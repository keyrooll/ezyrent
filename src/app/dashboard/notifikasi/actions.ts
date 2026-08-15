"use server";

import { revalidatePath } from "next/cache";
import { requireLandlord } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";

/** Tanda semua notifikasi pengguna sebagai dibaca */
export async function tandaSemuaBaca() {
  const { user } = await requireLandlord();
  await prisma.notification.updateMany({
    where: { user_id: user.id, is_read: false },
    data: { is_read: true },
  });
  revalidatePath("/dashboard/notifikasi");
  revalidatePath("/dashboard");
}

/** Tanda satu notifikasi sebagai dibaca */
export async function tandaBaca(id: string) {
  const { user } = await requireLandlord();
  await prisma.notification.updateMany({
    where: { id, user_id: user.id, is_read: false },
    data: { is_read: true },
  });
  revalidatePath("/dashboard/notifikasi");
  revalidatePath("/dashboard");
}
