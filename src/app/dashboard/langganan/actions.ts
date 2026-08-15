"use server";

import { revalidatePath } from "next/cache";
import { requireLandlord } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";

/**
 * Naik taraf / tukar pelan langganan.
 * Nota M1: tiada gateway pembayaran — tindakan ini simulasi terus
 * aktifkan pelan (pembayaran sebenar pada fasa seterusnya).
 */
export async function naikTarafPelan(planCode: string) {
  const { user, landlordId } = await requireLandlord();

  const pelan = await prisma.subscriptionPlan.findUnique({ where: { code: planCode } });
  if (!pelan || !pelan.is_active) return;

  const sekarang = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.landlord.update({
      where: { id: landlordId },
      data: {
        plan_code: pelan.code,
        unit_limit: pelan.unit_limit,
        status: "ACTIVE",
        plan_started_at: sekarang,
        plan_expires_at: null,
      },
    });
    await tx.subscription.create({
      data: {
        landlord_id: landlordId,
        plan_id: pelan.id,
        status: "ACTIVE",
        started_at: sekarang,
        renews_at: new Date(sekarang.getFullYear(), sekarang.getMonth() + 1, sekarang.getDate()),
      },
    });
    await tx.auditLog.create({
      data: {
        actor_user_id: user.id,
        landlord_id: landlordId,
        action: "subscription.upgrade",
        entity_type: "subscription_plan",
        entity_id: pelan.id,
        meta: { plan: pelan.code, price: Number(pelan.price_myr) },
      },
    });
  });

  revalidatePath("/dashboard/langganan");
  revalidatePath("/dashboard");
}
