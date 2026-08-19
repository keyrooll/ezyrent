"use server";

import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLandlord } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";

const MAX_SAIZ = 5 * 1024 * 1024; // 5MB
const MIME_DIBENARKAN = ["image/jpeg", "image/png", "image/webp"];

export type HasilProfil = { ralat?: string; medan?: Record<string, string>; berjaya?: boolean };

const skema = z.object({
  nama: z.string().trim().min(2, "Nama terlalu pendek"),
  telefon: z.string().trim().optional(),
  namaKecemasan: z.string().trim().optional(),
  telefonKecemasan: z.string().trim().optional(),
  alamatKecemasan: z.string().trim().optional(),
  hubungan: z.string().trim().optional(),
});

/** Kemaskini nama & telefon profil sendiri */
export async function kemaskiniProfil(
  _sebelum: HasilProfil,
  formData: FormData
): Promise<HasilProfil> {
  const { user, landlordId, db } = await requireLandlord();
  const mentah = Object.fromEntries(formData.entries());
  const hasil = skema.safeParse(mentah);

  if (!hasil.success) {
    const medan: Record<string, string> = {};
    for (const isu of hasil.error.issues) {
      if (isu.path[0]) medan[String(isu.path[0])] = isu.message;
    }
    return { medan };
  }

  // Staf: perubahan profil perlu kelulusan tuan rumah — rekod sebagai permohonan
  if (user.role === "STAFF") {
    const staf = await prisma.staff.findUnique({ where: { user_id: user.id } });
    if (!staf) return { ralat: "Rekod staf tidak dijumpai." };

    const data = {
      nama: hasil.data.nama,
      telefon: hasil.data.telefon || null,
      emergency_contact: hasil.data.namaKecemasan || null,
      emergency_phone: hasil.data.telefonKecemasan || null,
      emergency_address: hasil.data.alamatKecemasan || null,
      emergency_relationship: hasil.data.hubungan || null,
    };
    const sediaAda = await db.profileUpdateRequest.findFirst({
      where: { staff_id: staf.id, status: "PENDING" },
    });
    if (sediaAda) {
      await db.profileUpdateRequest.update({ where: { id: sediaAda.id }, data });
    } else {
      await db.profileUpdateRequest.create({
        data: {
          ...data,
          landlord_id: landlordId, // dienforce oleh tenant-client
          jenis: "STAFF",
          user_id: user.id,
          staff_id: staf.id,
        },
      });
    }

    const tuanRumah = await db.landlord.findUnique({
      where: { id: landlordId },
      select: { owner_id: true },
    });
    if (tuanRumah?.owner_id) {
      await prisma.notification.create({
        data: {
          user_id: tuanRumah.owner_id,
          type: "PROFILE_UPDATE",
          title: "Permohonan kemaskini profil staf",
          body: `${user.name} memohon kemaskini profil. Sila semak di tab Kelulusan.`,
        },
      });
    }

    revalidatePath("/dashboard/profil");
    return { berjaya: true };
  }

  // Tuan rumah: terus simpan
  await prisma.user.update({
    where: { id: user.id },
    data: { name: hasil.data.nama, phone: hasil.data.telefon || null },
  });

  revalidatePath("/dashboard/profil");
  return { berjaya: true };
}

/** Muat naik gambar profil (avatar) */
export async function muatNaikAvatar(
  _sebelum: HasilProfil,
  formData: FormData
): Promise<HasilProfil> {
  const { user, landlordId } = await requireLandlord();

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

  revalidatePath("/dashboard/profil");
  return { berjaya: true };
}
