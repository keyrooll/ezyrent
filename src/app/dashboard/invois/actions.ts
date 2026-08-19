"use server";

import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";

const MAX_SAIZ = 5 * 1024 * 1024; // 5MB
const MIME_DIBENARKAN = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export type HasilPembayaran = { ralat?: string; medan?: Record<string, string>; berjaya?: boolean };

/** Rekod pembayaran manual + bukti (diguna oleh landlord dan penyewa) */
export async function rekodPembayaran(_sebelum: HasilPembayaran, formData: FormData): Promise<HasilPembayaran> {
  const { user, landlordId, db } = await requireLandlord();

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

  const invois = await db.rentInvoice.findUnique({
    where: { id: invoiceId },
    include: { tenant: { select: { id: true, name: true, user_id: true } } },
  });
  if (!invois) return { ralat: "Invois tidak dijumpai." };

  // Bayaran tidak boleh melebihi baki belum bayar
  const baki = Number(invois.amount) - Number(invois.paid_amount);
  if (amount > baki) {
    return { ralat: `Amaun melebihi baki (${baki.toFixed(2)}).` };
  }

  const pembayaran = await db.payment.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      invoice_id: invois.id,
      tenant_id: invois.tenant_id,
      amount,
      method,
      reference_no: rujukan || null,
      status: "PENDING",
    },
  });

  // Simpan bukti ke penyimpanan tempatan (R2 pada fasa seterusnya)
  if (bukti && bukti.size > 0) {
    const dir = path.join(process.cwd(), "uploads", landlordId, pembayaran.id);
    await fs.mkdir(dir, { recursive: true });
    const nama = bukti.name.replace(/[^\w.\-]/g, "_");
    const stored = path.join("uploads", landlordId, pembayaran.id, nama);
    const data = Buffer.from(await bukti.arrayBuffer());
    await fs.writeFile(path.join(process.cwd(), stored), data);

    await db.document.create({
      data: {
        landlord_id: landlordId, // dienforce oleh tenant-client
        uploader_user_id: user.id,
        tenant_id: invois.tenant_id,
        payment_id: pembayaran.id,
        category: "PAYMENT_PROOF",
        original_name: bukti.name,
        stored_path: stored,
        mime_type: bukti.type,
        size_bytes: bukti.size,
      },
    });
  }

  // Notifikasi kepada pemilik landlord
  const landlord = await prisma.landlord.findUnique({ where: { id: landlordId } });
  if (landlord) {
    await prisma.notification.create({
      data: {
        user_id: landlord.owner_id,
        type: "PAYMENT_UPLOADED",
        title: "Bukti bayaran diterima",
        body: `${invois.tenant.name} merekod pembayaran ${invois.invoice_no} — menunggu pengesahan.`,
      },
    });
  }

  revalidatePath("/dashboard/invois");
  revalidatePath(`/dashboard/invois/${invois.id}`);
  revalidatePath("/dashboard/pembayaran");
  revalidatePath("/dashboard");
  return { berjaya: true };
}

/** Sahkan pembayaran — kemas kini status invois sekali gus */
export async function sahkanPembayaran(paymentId: string) {
  const { user, landlordId, db } = await requireLandlord();

  const pembayaran = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        select: {
          id: true,
          invoice_no: true,
          amount: true,
          paid_amount: true,
          unit: { select: { property_id: true } },
        },
      },
      tenant: true,
    },
  });
  if (!pembayaran) return;
  if (pembayaran.status !== "PENDING") return;

  // Staf terhad hanya boleh sahkan pembayaran dalam skop hartanah mereka
  const skop = await skopHartanahStaf(db, user);
  if (skop && !skop.includes(pembayaran.invoice.unit.property_id)) return;

  const invois = pembayaran.invoice;
  const dibayar = Number(invois.paid_amount) + Number(pembayaran.amount);
  const statusInvois = dibayar >= Number(invois.amount) ? "PAID" : "PARTIAL";

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: pembayaran.id },
      data: { status: "VERIFIED", verified_by_user_id: user.id, verified_at: new Date() },
    });
    await tx.rentInvoice.update({
      where: { id: invois.id },
      data: {
        paid_amount: dibayar,
        status: statusInvois,
        paid_at: statusInvois === "PAID" ? new Date() : null,
      },
    });
    if (pembayaran.tenant.user_id) {
      await tx.notification.create({
        data: {
          user_id: pembayaran.tenant.user_id,
          type: "PAYMENT_VERIFIED",
          title: "Pembayaran disahkan",
          body: `Pembayaran anda untuk invois ${invois.invoice_no} telah disahkan.`,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actor_user_id: user.id,
        landlord_id: landlordId,
        action: "payment.verify",
        entity_type: "payment",
        entity_id: pembayaran.id,
        meta: { amount: Number(pembayaran.amount), invoice_no: invois.invoice_no },
      },
    });
  });

  revalidatePath("/dashboard/pembayaran");
  revalidatePath(`/dashboard/invois/${invois.id}`);
  revalidatePath("/dashboard/invois");
  revalidatePath("/dashboard");
}

/** Tolak pembayaran dengan sebab */
export async function tolakPembayaran(paymentId: string, formData: FormData) {
  const { user, landlordId, db } = await requireLandlord();
  const sebab = String(formData.get("sebab") ?? "").trim();

  const pembayaran = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: { select: { invoice_no: true, unit: { select: { property_id: true } } } },
      tenant: true,
    },
  });
  if (!pembayaran || pembayaran.status !== "PENDING") return;

  // Staf terhad hanya boleh tolak pembayaran dalam skop hartanah mereka
  const skop = await skopHartanahStaf(db, user);
  if (skop && !skop.includes(pembayaran.invoice.unit.property_id)) return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: pembayaran.id },
      data: { status: "REJECTED", rejection_reason: sebab || null, verified_by_user_id: user.id, verified_at: new Date() },
    });
    if (pembayaran.tenant.user_id) {
      await tx.notification.create({
        data: {
          user_id: pembayaran.tenant.user_id,
          type: "PAYMENT_REJECTED",
          title: "Pembayaran ditolak",
          body: `Pembayaran anda untuk invois ${pembayaran.invoice.invoice_no} ditolak${sebab ? `: ${sebab}` : "."}`,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actor_user_id: user.id,
        landlord_id: landlordId,
        action: "payment.reject",
        entity_type: "payment",
        entity_id: pembayaran.id,
        meta: { sebab },
      },
    });
  });

  revalidatePath("/dashboard/pembayaran");
  revalidatePath(`/dashboard/invois/${pembayaran.invoice_id}`);
  revalidatePath("/dashboard/invois");
}
