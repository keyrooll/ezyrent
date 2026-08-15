"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { requirePenyewa } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";

const MAX_SAIZ = 5 * 1024 * 1024; // 5MB
const MIME_DIBENARKAN = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export type HasilBayaranPenyewa = { ralat?: string; berjaya?: boolean };

/** Penyewa merekod pembayaran + muat naik bukti untuk invois sendiri */
export async function rekodBayaranPenyewa(
  _sebelum: HasilBayaranPenyewa,
  formData: FormData
): Promise<HasilBayaranPenyewa> {
  const { user, landlordId, tenantId, db } = await requirePenyewa();

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "BANK_TRANSFER") as PaymentMethod;
  const rujukan = String(formData.get("rujukan") ?? "").trim();
  const bukti = formData.get("bukti") as File | null;

  if (!invoiceId) return { ralat: "Invois tidak sah." };
  if (!Number.isFinite(amount) || amount <= 0) return { ralat: "Amaun mesti melebihi 0." };
  if (bukti && bukti.size > MAX_SAIZ) return { ralat: "Fail bukti terlalu besar (maksimum 5MB)." };
  if (bukti && bukti.size > 0 && !MIME_DIBENARKAN.includes(bukti.type)) {
    return { ralat: "Format fail tidak disokong (JPG, PNG, WEBP atau PDF sahaja)." };
  }

  // Invois mesti milik penyewa sendiri
  const invois = await db.rentInvoice.findUnique({ where: { id: invoiceId } });
  if (!invois || invois.tenant_id !== tenantId) return { ralat: "Invois tidak dijumpai." };

  const baki = Number(invois.amount) - Number(invois.paid_amount);
  if (amount > baki) {
    return { ralat: `Amaun melebihi baki (${baki.toFixed(2)}).` };
  }

  const pembayaran = await db.payment.create({
    data: {
      landlord_id: landlordId,
      invoice_id: invois.id,
      tenant_id: tenantId,
      amount,
      method,
      reference_no: rujukan || null,
      status: "PENDING",
    },
  });

  if (bukti && bukti.size > 0) {
    const dir = path.join(process.cwd(), "uploads", landlordId, pembayaran.id);
    await fs.mkdir(dir, { recursive: true });
    const nama = bukti.name.replace(/[^\w.\-]/g, "_");
    const stored = path.join("uploads", landlordId, pembayaran.id, nama);
    await fs.writeFile(path.join(process.cwd(), stored), Buffer.from(await bukti.arrayBuffer()));

    await db.document.create({
      data: {
        landlord_id: landlordId,
        uploader_user_id: user.id,
        tenant_id: tenantId,
        payment_id: pembayaran.id,
        category: "PAYMENT_PROOF",
        original_name: bukti.name,
        stored_path: stored,
        mime_type: bukti.type,
        size_bytes: bukti.size,
      },
    });
  }

  // Maklumkan landlord
  const landlord = await prisma.landlord.findUnique({ where: { id: landlordId } });
  if (landlord) {
    await prisma.notification.create({
      data: {
        user_id: landlord.owner_id,
        type: "PAYMENT_UPLOADED",
        title: "Bukti bayaran diterima",
        body: `Penyewa memuat naik bukti bayaran untuk invois ${invois.invoice_no} — menunggu pengesahan.`,
      },
    });
  }

  revalidatePath(`/penyewa/invois/${invois.id}`);
  revalidatePath("/penyewa/invois");
  revalidatePath("/penyewa");
  return { berjaya: true };
}
