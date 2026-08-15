"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const skema = z.object({
  nama: z.string().trim().min(2, "Nama terlalu pendek"),
  telefon: z.string().trim().optional(),
  katalaluan: z.string().min(8, "Kata laluan minima 8 aksara"),
});

export type HasilTerimaJemputan = { ralat?: string; medan?: Record<string, string> };

export async function terimaJemputan(
  token: string,
  _sebelum: HasilTerimaJemputan,
  formData: FormData
): Promise<HasilTerimaJemputan> {
  const mentah = Object.fromEntries(formData.entries());
  const hasil = skema.safeParse(mentah);

  if (!hasil.success) {
    const medan: Record<string, string> = {};
    for (const isu of hasil.error.issues) {
      if (isu.path[0]) medan[String(isu.path[0])] = isu.message;
    }
    return { medan };
  }

  const { nama, telefon, katalaluan } = hasil.data;

  // Token ialah nilai unik seperti rahsia — selamat untuk lookup terus
  const jemputan = await prisma.invitation.findUnique({
    where: { token },
    include: { unit: { include: { property: true } } },
  });

  if (!jemputan || jemputan.status !== "PENDING" || jemputan.expires_at < new Date()) {
    return { ralat: "Jemputan ini tidak sah atau telah tamat tempoh." };
  }

  const email = jemputan.tenant_email;

  // E-mel sudah didaftarkan?
  const userWujud = await prisma.user.findUnique({ where: { email } });
  if (userWujud) {
    return { ralat: "E-mel ini sudah didaftarkan. Sila log masuk." };
  }

  const hash = await bcrypt.hash(katalaluan, 10);

  await prisma.$transaction(async (tx) => {
    // 1. Cipta akaun penyewa
    const user = await tx.user.create({
      data: { email, name: nama, phone: telefon || null, password_hash: hash, role: "TENANT" },
    });

    // 2. Pautkan kepada rekod Tenant sedia ada (jika ada) atau cipta baru
    const sediaAda = await tx.tenant.findFirst({
      where: { landlord_id: jemputan.landlord_id, email },
    });

    let tenantId: string;
    if (sediaAda) {
      await tx.tenant.update({ where: { id: sediaAda.id }, data: { user_id: user.id, name: nama } });
      tenantId = sediaAda.id;
    } else {
      const tenant = await tx.tenant.create({
        data: {
          landlord_id: jemputan.landlord_id,
          user_id: user.id,
          name: nama,
          email,
          phone: jemputan.tenant_phone || telefon || null,
        },
      });
      tenantId = tenant.id;
    }

    // 3. Tandakan jemputan diterima
    await tx.invitation.update({
      where: { id: jemputan.id },
      data: { status: "ACCEPTED", accepted_at: new Date(), tenant_id: tenantId },
    });

    // 4. Notifikasi kepada landlord
    await tx.notification.create({
      data: {
        user_id: jemputan.invited_by_user_id,
        type: "INVITATION_ACCEPTED",
        title: "Jemputan diterima",
        body: `${nama} telah mendaftar melalui jemputan untuk ${jemputan.unit.property.name} (${jemputan.unit.unit_no}).`,
      },
    });
  });

  redirect("/login?berjaya=1");
}
