"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/** Skema pendaftaran landlord — validasi sisi pelayan */
const skema = z.object({
  nama: z.string().trim().min(2, "Nama terlalu pendek"),
  email: z.string().trim().toLowerCase().email("E-mel tidak sah"),
  telefon: z.string().trim().optional(),
  namaPerniagaan: z.string().trim().min(2, "Nama perniagaan terlalu pendek"),
  katalaluan: z.string().min(8, "Kata laluan minima 8 aksara"),
});

export type RalatDaftar = { ralat?: string; medan?: Record<string, string> };

export async function daftarLandlord(_sebelum: RalatDaftar, formData: FormData): Promise<RalatDaftar> {
  const mentah = Object.fromEntries(formData.entries());
  const hasil = skema.safeParse(mentah);

  if (!hasil.success) {
    const medan: Record<string, string> = {};
    for (const isu of hasil.error.issues) {
      if (isu.path[0]) medan[String(isu.path[0])] = isu.message;
    }
    return { medan };
  }

  const { nama, email, telefon, namaPerniagaan, katalaluan } = hasil.data;

  // E-mel unik
  const wujud = await prisma.user.findUnique({ where: { email } });
  if (wujud) return { ralat: "E-mel ini sudah didaftarkan. Cuba log masuk." };

  const hash = await bcrypt.hash(katalaluan, 10);
  const trialTamat = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Cipta User + Landlord (pelan FREE, status TRIAL) + Subscription dalam satu transaksi
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, name: nama, phone: telefon ?? null, password_hash: hash, role: "LANDLORD" },
    });
    const pelan = await tx.subscriptionPlan.findUniqueOrThrow({ where: { code: "FREE" } });
    const landlord = await tx.landlord.create({
      data: {
        business_name: namaPerniagaan,
        email,
        phone: telefon ?? null,
        owner_id: user.id,
        plan_code: "FREE",
        unit_limit: pelan.unit_limit,
        status: "TRIAL",
        trial_ends_at: trialTamat,
      },
    });
    await tx.subscription.create({
      data: { landlord_id: landlord.id, plan_id: pelan.id, status: "TRIAL", trial_ends_at: trialTamat },
    });
  });

  redirect("/login?berjaya=1");
}
