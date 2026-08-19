"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { requirePenyewa } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";

const MAX_SAIZ = 5 * 1024 * 1024; // 5MB
const MIME_DIBENARKAN = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export type HasilDokumen = { ralat?: string; berjaya?: boolean };

/**
 * Penyewa muat naik bukti pembayaran bil utiliti.
 * Status bil → PENDING_PROOF; tuan rumah/staf akan semak & sahkan.
 */
export async function buktiBayarUtility(
  bilId: string,
  _sebelum: HasilDokumen,
  formData: FormData
): Promise<HasilDokumen> {
  const { user, tenantId, landlordId, db } = await requirePenyewa();

  const bil = await db.utilityBil.findFirst({ where: { id: bilId, tenant_id: tenantId } });
  if (!bil) return { ralat: "Bil tidak dijumpai." };
  if (bil.status !== "UNPAID") return { ralat: "Bukti telah dihantar atau bil telah disahkan." };

  const fail = formData.get("fail") as File | null;
  if (!fail || fail.size === 0) return { ralat: "Pilih fail dahulu." };
  if (fail.size > MAX_SAIZ) return { ralat: "Fail terlalu besar (maksimum 5MB)." };
  if (!MIME_DIBENARKAN.includes(fail.type)) {
    return { ralat: "Format fail tidak disokong (JPG, PNG, WEBP atau PDF sahaja)." };
  }

  const dir = path.join(process.cwd(), "uploads", landlordId, "penyewa", tenantId);
  await fs.mkdir(dir, { recursive: true });
  const nama = `bukti-${Date.now()}.${fail.type.split("/")[1]}`;
  const stored = path.join("uploads", landlordId, "penyewa", tenantId, nama);
  await fs.writeFile(path.join(process.cwd(), stored), Buffer.from(await fail.arrayBuffer()));

  await db.document.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      uploader_user_id: user.id,
      tenant_id: tenantId,
      utility_bil_id: bilId,
      category: "UTILITY_BILL",
      original_name: fail.name,
      stored_path: stored,
      mime_type: fail.type,
      size_bytes: fail.size,
    },
  });
  await db.utilityBil.update({
    where: { id: bilId },
    data: { status: "PENDING_PROOF" },
  });

  // Maklumkan tuan rumah untuk semakan
  const tuanRumah = await db.landlord.findUnique({
    where: { id: landlordId },
    select: { owner_id: true },
  });
  if (tuanRumah?.owner_id) {
    await prisma.notification.create({
      data: {
        user_id: tuanRumah.owner_id,
        type: "UTILITY_PROOF",
        title: "Bukti pembayaran bil utiliti",
        body: `Penyewa memuat naik bukti pembayaran bil ${bil.bulan}. Sila semak dan sahkan.`,
      },
    });
  }

  revalidatePath("/penyewa/dokumen");
  return { berjaya: true };
}
