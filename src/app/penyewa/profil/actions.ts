"use server";

import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePenyewa } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";

const MAX_SAIZ = 5 * 1024 * 1024; // 5MB
const MIME_DIBENARKAN = ["image/jpeg", "image/png", "image/webp"];

export type HasilProfil = { ralat?: string; medan?: Record<string, string>; berjaya?: boolean };

const skema = z.object({
  nama: z.string().trim().min(2, "Nama terlalu pendek"),
  telefon: z.string().trim().optional(),
  emergency_contact: z.string().trim().optional(),
  emergency_phone: z.string().trim().optional(),
  emergency_address: z.string().trim().optional(),
  emergency_relationship: z.string().trim().optional(),
});

/**
 * Kemaskini profil penyewa — tidak terus disimpan. Rekod sebagai permohonan
 * kelulusan (PENDING); tuan rumah mesti luluskan dahulu di /dashboard/kelulusan.
 */
export async function kemaskiniProfilPenyewa(
  _sebelum: HasilProfil,
  formData: FormData
): Promise<HasilProfil> {
  const { user, landlordId, tenantId, db } = await requirePenyewa();
  const mentah = Object.fromEntries(formData.entries());
  const hasil = skema.safeParse(mentah);

  if (!hasil.success) {
    const medan: Record<string, string> = {};
    for (const isu of hasil.error.issues) {
      if (isu.path[0]) medan[String(isu.path[0])] = isu.message;
    }
    return { medan };
  }

  const data = {
    nama: hasil.data.nama,
    telefon: hasil.data.telefon || null,
    emergency_contact: hasil.data.emergency_contact || null,
    emergency_phone: hasil.data.emergency_phone || null,
    emergency_address: hasil.data.emergency_address || null,
    emergency_relationship: hasil.data.emergency_relationship || null,
  };

  // Satu permohonan PENDING sahaja bagi setiap penyewa — kemaskini yang sedia ada
  const sediaAda = await db.profileUpdateRequest.findFirst({
    where: { tenant_id: tenantId, status: "PENDING" },
  });
  if (sediaAda) {
    await db.profileUpdateRequest.update({ where: { id: sediaAda.id }, data });
  } else {
    await db.profileUpdateRequest.create({
      data: {
        ...data,
        landlord_id: landlordId, // dienforce oleh tenant-client
        jenis: "TENANT",
        user_id: user.id,
        tenant_id: tenantId,
      },
    });
  }

  // Maklumkan tuan rumah & semua staf aktif (mereka yang luluskan permohonan penyewa)
  const [tuanRumah, stafAktif] = await Promise.all([
    db.landlord.findUnique({
      where: { id: landlordId },
      select: { owner_id: true },
    }),
    prisma.staff.findMany({
      where: { landlord_id: landlordId, status: "ACTIVE" },
      select: { user_id: true },
    }),
  ]);
  const penerima = new Set<string>();
  if (tuanRumah?.owner_id) penerima.add(tuanRumah.owner_id);
  for (const s of stafAktif) penerima.add(s.user_id);
  if (penerima.size > 0) {
    await prisma.notification.createMany({
      data: [...penerima].map((uid) => ({
        user_id: uid,
        type: "PROFILE_UPDATE",
        title: "Permohonan kemaskini profil penyewa",
        body: `${user.name} memohon kemaskini profil. Sila semak di tab Kelulusan.`,
      })),
    });
  }

  revalidatePath("/penyewa/profil");
  return { berjaya: true };
}

/** Muat naik gambar profil (avatar) penyewa */
export async function muatNaikAvatarPenyewa(
  _sebelum: HasilProfil,
  formData: FormData
): Promise<HasilProfil> {
  const { user, landlordId } = await requirePenyewa();

  const gambar = formData.get("gambar") as File | null;
  if (!gambar || gambar.size === 0) return { ralat: "Pilih gambar dahulu." };
  if (gambar.size > MAX_SAIZ) return { ralat: "Gambar terlalu besar (maksimum 5MB)." };
  if (!MIME_DIBENARKAN.includes(gambar.type)) {
    return { ralat: "Format gambar tidak disokong (JPG, PNG atau WEBP sahaja)." };
  }

  const dir = path.join(process.cwd(), "uploads", landlordId, "avatar", user.id);
  await fs.mkdir(dir, { recursive: true });
  const nama = `avatar-${Date.now()}.${gambar.type.split("/")[1]}`;
  const stored = path.join("uploads", landlordId, "avatar", user.id, nama);
  const data = Buffer.from(await gambar.arrayBuffer());
  await fs.writeFile(path.join(process.cwd(), stored), data);

  await prisma.user.update({
    where: { id: user.id },
    data: { avatar_url: stored },
  });

  revalidatePath("/penyewa/profil");
  return { berjaya: true };
}
