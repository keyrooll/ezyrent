"use server";

import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLandlord } from "@/lib/sesi";
import { DocCategory } from "@prisma/client";

const MAX_SAIZ = 5 * 1024 * 1024; // 5MB
const MIME_DIBENARKAN = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export type HasilPenyewa = { ralat?: string; medan?: Record<string, string>; berjaya?: boolean };

const skema = z.object({
  nama: z.string().trim().min(2, "Nama terlalu pendek"),
  email: z.string().trim().toLowerCase().email("E-mel tidak sah").optional().or(z.literal("")),
  telefon: z.string().trim().optional(),
  noKad: z.string().trim().optional(),
  pekerjaan: z.string().trim().optional(),
  namaKecemasan: z.string().trim().optional(),
  telefonKecemasan: z.string().trim().optional(),
});

/** Kemaskini maklumat penyewa (scoped kepada landlord semasa) */
export async function kemaskiniPenyewa(
  tenantId: string,
  _sebelum: HasilPenyewa,
  formData: FormData
): Promise<HasilPenyewa> {
  const { db } = await requireLandlord();
  const mentah = Object.fromEntries(formData.entries());
  const hasil = skema.safeParse(mentah);

  if (!hasil.success) {
    const medan: Record<string, string> = {};
    for (const isu of hasil.error.issues) {
      if (isu.path[0]) medan[String(isu.path[0])] = isu.message;
    }
    return { medan };
  }

  const sediaAda = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!sediaAda) return { ralat: "Penyewa tidak dijumpai." };

  const { nama, email, telefon, noKad, pekerjaan, namaKecemasan, telefonKecemasan } = hasil.data;

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      name: nama,
      email: email || null,
      phone: telefon || null,
      ic_no: noKad || null,
      occupation: pekerjaan || null,
      emergency_contact: namaKecemasan || null,
      emergency_phone: telefonKecemasan || null,
    },
  });

  revalidatePath(`/dashboard/penyewa/${tenantId}`);
  revalidatePath("/dashboard/penyewa");
  return { berjaya: true };
}

/**
 * Muat naik dokumen penyewa: IC, perjanjian sewaan, bil air/api.
 * Kategori UTILITY_BILL memerlukan bulan & amaun — rekod bil dicipta sekali.
 */
export async function muatNaikDokumenPenyewa(
  tenantId: string,
  _sebelum: HasilPenyewa,
  formData: FormData
): Promise<HasilPenyewa> {
  const { user, landlordId, db } = await requireLandlord();

  const kategori = String(formData.get("kategori") ?? "") as DocCategory;
  const KATEGORI_DIBENARKAN: DocCategory[] = ["TENANT_IC", "TENANCY_AGREEMENT", "UTILITY_BILL"];
  if (!KATEGORI_DIBENARKAN.includes(kategori)) return { ralat: "Kategori dokumen tidak sah." };

  const fail = formData.get("fail") as File | null;
  if (!fail || fail.size === 0) return { ralat: "Pilih fail dahulu." };
  if (fail.size > MAX_SAIZ) return { ralat: "Fail terlalu besar (maksimum 5MB)." };
  if (!MIME_DIBENARKAN.includes(fail.type)) {
    return { ralat: "Format fail tidak disokong (JPG, PNG, WEBP atau PDF sahaja)." };
  }

  const penyewa = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!penyewa) return { ralat: "Penyewa tidak dijumpai." };

  // Bil utiliti: validasi bulan & amaun, cipta rekod bil
  let utilityBilId: string | null = null;
  if (kategori === "UTILITY_BILL") {
    const bulan = String(formData.get("bulan") ?? "").trim();
    const amaun = Number(String(formData.get("amaun") ?? "").trim());
    if (!/^\d{4}-\d{2}$/.test(bulan)) return { ralat: "Pilih bulan bil." };
    if (!Number.isFinite(amaun) || amaun <= 0) return { ralat: "Amaun bil tidak sah." };

    const bil = await db.utilityBil.create({
      data: {
        landlord_id: landlordId, // dienforce oleh tenant-client
        tenant_id: tenantId,
        bulan,
        amount: amaun,
        status: "UNPAID",
        created_by_user_id: user.id,
      },
    });
    utilityBilId = bil.id;
  }

  const dir = path.join(process.cwd(), "uploads", landlordId, "penyewa", tenantId);
  await fs.mkdir(dir, { recursive: true });
  const nama = fail.name.replace(/[^\w.\-]/g, "_");
  const stored = path.join("uploads", landlordId, "penyewa", tenantId, nama);
  const data = Buffer.from(await fail.arrayBuffer());
  await fs.writeFile(path.join(process.cwd(), stored), data);

  await db.document.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      uploader_user_id: user.id,
      tenant_id: tenantId,
      utility_bil_id: utilityBilId,
      category: kategori,
      original_name: fail.name,
      stored_path: stored,
      mime_type: fail.type,
      size_bytes: fail.size,
    },
  });

  revalidatePath(`/dashboard/penyewa/${tenantId}`);
  return { berjaya: true };
}
