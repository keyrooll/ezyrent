"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Tukar paparan peranan — hanya untuk peranan yang user benar-benar berdaftar */
export async function tukarPaparan(pilihan: string) {
  const sesi = await auth();
  const user = sesi?.user;
  if (!user) redirect("/login");
  if (!["LANDLORD", "STAFF", "TENANT"].includes(pilihan)) return;

  const wujud = await (pilihan === "LANDLORD"
    ? prisma.landlord.findFirst({ where: { owner_id: user.id }, select: { id: true } })
    : pilihan === "STAFF"
      ? prisma.staff.findFirst({ where: { user_id: user.id }, select: { id: true } })
      : prisma.tenant.findFirst({ where: { user_id: user.id }, select: { id: true } }));
  if (!wujud) return;

  await prisma.user.update({
    where: { id: user.id },
    // Pilih peranan asal → kosongkan view_role supaya kembali ke lalai
    data: { view_role: pilihan === user.role ? null : pilihan },
  });

  redirect(pilihan === "TENANT" ? "/penyewa" : "/dashboard");
}
