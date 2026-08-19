"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";

export type HasilUtiliti = { ralat?: string; medan?: Record<string, string>; berjaya?: boolean };

const skema = z.object({
  tenantId: z.string().min(1, "Pilih penyewa."),
  bulan: z.string().regex(/^\d{4}-\d{2}$/, "Pilih bulan bil."),
  amaun: z.coerce.number().positive("Amaun bil tidak sah."),
});

/**
 * Tambah bil utiliti dan assign kepada penyewa.
 * Staf terhad hanya boleh assign penyewa dalam skop hartanah mereka.
 */
export async function tambahBilUtility(
  _sebelum: HasilUtiliti,
  formData: FormData
): Promise<HasilUtiliti> {
  const { user, landlordId, db } = await requireLandlord();
  const parsed = skema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ralat: parsed.error.issues[0]?.message ?? "Data tidak sah." };
  }

  // Penyewa mesti dalam skop staf (kalau staf terhad)
  const penyewa = await db.tenant.findUnique({
    where: { id: parsed.data.tenantId },
    include: { tenancies: { select: { unit: { select: { property_id: true } } } } },
  });
  if (!penyewa) return { ralat: "Penyewa tidak dijumpai." };

  const skop = await skopHartanahStaf(db, user);
  if (
    skop &&
    !penyewa.tenancies.some((t) => skop.includes(t.unit.property_id))
  ) {
    return { ralat: "Penyewa di luar skop urusan anda." };
  }

  // Elak bil berganda untuk penyewa + bulan yang sama
  const wujud = await db.utilityBil.findFirst({
    where: { tenant_id: penyewa.id, bulan: parsed.data.bulan },
  });
  if (wujud) {
    return { ralat: `Bil untuk bulan ini sudah wujud (${penyewa.name}).` };
  }

  await db.utilityBil.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      tenant_id: penyewa.id,
      bulan: parsed.data.bulan,
      amount: parsed.data.amaun,
      status: "UNPAID",
      created_by_user_id: user.id,
    },
  });

  revalidatePath("/dashboard/utiliti");
  return { berjaya: true };
}

/** Sahkan bil utiliti (status → PAID) — bukti pembayaran telah disemak */
export async function sahkanBilUtility(bilId: string) {
  const { user, db } = await requireLandlord();

  const bil = await db.utilityBil.findUnique({ where: { id: bilId } });
  if (!bil) return;

  await db.utilityBil.update({
    where: { id: bilId },
    data: { status: "PAID", verified_by_user_id: user.id, verified_at: new Date() },
  });

  const penyewa = await db.tenant.findUnique({
    where: { id: bil.tenant_id },
    select: { user_id: true },
  });
  if (penyewa?.user_id) {
    await prisma.notification.create({
      data: {
        user_id: penyewa.user_id,
        type: "UTILITY_PAID",
        title: "Bil utiliti disahkan",
        body: `Pembayaran bil ${bil.bulan} telah disahkan. Terima kasih!`,
      },
    });
  }

  revalidatePath("/dashboard/utiliti");
  revalidatePath(`/dashboard/penyewa/${bil.tenant_id}`);
}

/** Tolak bukti pembayaran bil utiliti (status → UNPAID semula) */
export async function tolakBilUtility(bilId: string) {
  const { user, db } = await requireLandlord();

  const bil = await db.utilityBil.findUnique({ where: { id: bilId } });
  if (!bil) return;

  await db.utilityBil.update({
    where: { id: bilId },
    data: { status: "UNPAID", verified_by_user_id: user.id, verified_at: new Date() },
  });

  const penyewa = await db.tenant.findUnique({
    where: { id: bil.tenant_id },
    select: { user_id: true },
  });
  if (penyewa?.user_id) {
    await prisma.notification.create({
      data: {
        user_id: penyewa.user_id,
        type: "UTILITY_REJECTED",
        title: "Bukti pembayaran bil ditolak",
        body: `Bukti pembayaran bil ${bil.bulan} ditolak. Sila semak dan muat naik semula.`,
      },
    });
  }

  revalidatePath("/dashboard/utiliti");
  revalidatePath(`/dashboard/penyewa/${bil.tenant_id}`);
}
