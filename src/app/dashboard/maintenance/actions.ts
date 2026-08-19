"use server";

import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { MaintenanceStatus } from "@prisma/client";

const MAX_SAIZ = 5 * 1024 * 1024; // 5MB
const MIME_DIBENARKAN = ["image/jpeg", "image/png", "image/webp"];

export type HasilMaintenance = {
  ralat?: string;
  medan?: Record<string, string>;
  berjaya?: boolean;
};

const skema = z.object({
  unitId: z.string().min(1, "Pilih unit"),
  tajuk: z.string().trim().min(3, "Tajuk terlalu pendek"),
  keterangan: z.string().trim().min(5, "Terangkan masalah dengan lebih jelas"),
});

/** Hantar aduan maintenance (landlord & staf) — boleh lampir gambar */
export async function ciptaAduan(
  _sebelum: HasilMaintenance,
  formData: FormData
): Promise<HasilMaintenance> {
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

  const gambar = formData.get("gambar") as File | null;
  if (gambar && gambar.size > MAX_SAIZ) return { ralat: "Gambar terlalu besar (maksimum 5MB)." };
  if (gambar && gambar.size > 0 && !MIME_DIBENARKAN.includes(gambar.type)) {
    return { ralat: "Format gambar tidak disokong (JPG, PNG atau WEBP sahaja)." };
  }

  const { unitId, tajuk, keterangan } = hasil.data;

  const unit = await db.unit.findUnique({
    where: { id: unitId },
    include: {
      tenancies: {
        where: { status: "ACTIVE" },
        take: 1,
        select: { tenant_id: true },
      },
    },
  });
  if (!unit) return { ralat: "Unit tidak dijumpai." };

  // Staf terhad hanya boleh hantar aduan untuk unit dalam skop mereka
  const skop = await skopHartanahStaf(db, user);
  if (skop && !skop.includes(unit.property_id)) {
    return { ralat: "Unit di luar skop urusan anda." };
  }

  const aduan = await db.maintenanceRequest.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      unit_id: unit.id,
      tenant_id: unit.tenancies[0]?.tenant_id ?? null,
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
        maintenance_request_id: aduan.id,
        category: "MAINTENANCE_PHOTO",
        original_name: gambar.name,
        stored_path: stored,
        mime_type: gambar.type,
        size_bytes: gambar.size,
      },
    });
  }

  revalidatePath("/dashboard/maintenance");
  return { berjaya: true };
}

/** Pindah status aduan (drag & drop) — staf & tuan rumah sahaja */
export async function ubahStatusAduan(id: string, status: MaintenanceStatus) {
  const { user, landlordId, db } = await requireLandlord();

  // Staf & tuan rumah sahaja (requireLandlord sudah menapis penyewa)
  const SAH: MaintenanceStatus[] = ["COMPLAIN", "IN_PROGRESS", "COMPLETED"];
  if (!SAH.includes(status)) return;

  const aduan = await db.maintenanceRequest.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      reported_by_user_id: true,
      unit: { select: { property_id: true } },
    },
  });
  if (!aduan) return;

  // Staf terhad hanya boleh ubah status aduan dalam skop mereka
  const skop = await skopHartanahStaf(db, user);
  if (skop && !skop.includes(aduan.unit.property_id)) return;

  await db.maintenanceRequest.update({
    where: { id },
    data: { status },
  });

  // Notifikasi kepada pelapor jika ada
  if (aduan.reported_by_user_id !== user.id) {
    await prisma.notification.create({
      data: {
        user_id: aduan.reported_by_user_id,
        type: "MAINTENANCE_STATUS",
        title: "Status aduan dikemaskini",
        body: `Aduan "${aduan.title}" kini berstatus ${status === "COMPLAIN" ? "Aduan Baru" : status === "IN_PROGRESS" ? "Dalam Proses" : "Selesai"}.`,
      },
    });
  }

  revalidatePath("/dashboard/maintenance");
}
