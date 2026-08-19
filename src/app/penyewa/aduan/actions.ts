"use server";

import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePenyewa } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";

const MAX_SAIZ = 5 * 1024 * 1024; // 5MB
const MIME_DIBENARKAN = ["image/jpeg", "image/png", "image/webp"];

export type HasilAduanPenyewa = {
  ralat?: string;
  medan?: Record<string, string>;
  berjaya?: boolean;
};

const skema = z.object({
  tajuk: z.string().trim().min(3, "Tajuk terlalu pendek"),
  keterangan: z.string().trim().min(5, "Terangkan masalah dengan lebih jelas"),
});

/** Hantar aduan maintenance dari portal penyewa — boleh lampir gambar */
export async function ciptaAduanPenyewa(
  _sebelum: HasilAduanPenyewa,
  formData: FormData
): Promise<HasilAduanPenyewa> {
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

  const gambar = formData.get("gambar") as File | null;
  if (gambar && gambar.size > MAX_SAIZ) return { ralat: "Gambar terlalu besar (maksimum 5MB)." };
  if (gambar && gambar.size > 0 && !MIME_DIBENARKAN.includes(gambar.type)) {
    return { ralat: "Format gambar tidak disokong (JPG, PNG atau WEBP sahaja)." };
  }

  // Unit dari tenancy aktif penyewa
  const tenancy = await db.tenancy.findFirst({
    where: { tenant_id: tenantId, status: "ACTIVE" },
  });
  if (!tenancy) return { ralat: "Tiada penyewaan aktif untuk anda." };

  const { tajuk, keterangan } = hasil.data;

  const aduan = await db.maintenanceRequest.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      unit_id: tenancy.unit_id,
      tenant_id: tenantId,
      reported_by_user_id: user.id,
      title: tajuk,
      description: keterangan,
      status: "COMPLAIN",
    },
  });

  if (gambar && gambar.size > 0) {
    const dir = path.join(process.cwd(), "uploads", landlordId, "maintenance", aduan.id);
    await fs.mkdir(dir, { recursive: true });
    const nama = gambar.name.replace(/[^\w.\-]/g, "_");
    const stored = path.join("uploads", landlordId, "maintenance", aduan.id, nama);
    const data = Buffer.from(await gambar.arrayBuffer());
    await fs.writeFile(path.join(process.cwd(), stored), data);

    await db.document.create({
      data: {
        landlord_id: landlordId, // dienforce oleh tenant-client
        uploader_user_id: user.id,
        tenant_id: tenantId,
        maintenance_request_id: aduan.id,
        category: "MAINTENANCE_PHOTO",
        original_name: gambar.name,
        stored_path: stored,
        mime_type: gambar.type,
        size_bytes: gambar.size,
      },
    });
  }

  // Notifikasi kepada landlord
  const landlord = await prisma.landlord.findUnique({ where: { id: landlordId } });
  if (landlord) {
    await prisma.notification.create({
      data: {
        user_id: landlord.owner_id,
        type: "MAINTENANCE_NEW",
        title: "Aduan maintenance baru",
        body: `${user.name} menghantar aduan: ${tajuk}.`,
      },
    });
  }

  revalidatePath("/penyewa/aduan");
  return { berjaya: true };
}
