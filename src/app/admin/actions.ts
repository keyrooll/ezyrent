"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";

/** Gantung / aktifkan semula akaun landlord */
export async function tukarStatusLandlord(id: string, status: "ACTIVE" | "SUSPENDED") {
  const { user } = await requireSuperAdmin();

  const landlord = await prisma.landlord.findUnique({ where: { id } });
  if (!landlord) return;

  await prisma.$transaction(async (tx) => {
    await tx.landlord.update({ where: { id }, data: { status } });
    await tx.auditLog.create({
      data: {
        actor_user_id: user.id,
        landlord_id: id,
        action: status === "SUSPENDED" ? "landlord.suspend" : "landlord.activate",
        entity_type: "landlord",
        entity_id: id,
        meta: { business_name: landlord.business_name },
      },
    });
  });

  revalidatePath("/admin");
}
