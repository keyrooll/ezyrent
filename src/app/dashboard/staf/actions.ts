"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLandlord } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";

export type HasilStaf = { ralat?: string; medan?: Record<string, string>; berjaya?: boolean };

const SkemaStaf = z.object({
  nama: z.string().min(1, "Nama diperlukan."),
  email: z.string().email("E-mel tidak sah."),
  katalaluan: z.string().min(8, "Kata laluan minimum 8 aksara."),
});

/** Cipta akaun staf baru di bawah landlord semasa */
export async function ciptaStaf(_sebelum: HasilStaf, formData: FormData): Promise<HasilStaf> {
  const { user, landlordId } = await requireLandlord();

  const parsed = SkemaStaf.safeParse({
    nama: String(formData.get("nama") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    katalaluan: String(formData.get("katalaluan") ?? ""),
  });
  if (!parsed.success) {
    return {
      ralat: parsed.error.issues[0]?.message ?? "Data tidak sah.",
      medan: Object.fromEntries(parsed.error.issues.map((e) => [e.path.join("."), e.message])),
    };
  }

  const sediaAda = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (sediaAda) return { ralat: "E-mel ini telah didaftarkan." };

  const hash = await bcrypt.hash(parsed.data.katalaluan, 10);

  const userStaf = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: { email: parsed.data.email, name: parsed.data.nama, password_hash: hash, role: "STAFF" },
    });
    await tx.staff.create({
      data: {
        user_id: u.id,
        landlord_id: landlordId,
        permissions: {
          properties: { view: true, edit: true },
          tenants: { view: true, edit: true },
          rent: { view: true, record: true, verify: true },
          financial: { view: false },
        },
      },
    });
    return u;
  });

  await prisma.auditLog.create({
    data: {
      actor_user_id: user.id,
      landlord_id: landlordId,
      action: "staff.create",
      entity_type: "staff",
      entity_id: userStaf.id,
      meta: { email: parsed.data.email },
    },
  });

  revalidatePath("/dashboard/staf");
  return { berjaya: true };
}

/** Nyahaktifkan akaun staf */
export async function nyahaktifStaf(id: string) {
  const { user, landlordId, db } = await requireLandlord();

  await db.staff.updateMany({
    where: { id, landlord_id: landlordId },
    data: { status: "SUSPENDED" },
  });

  await prisma.auditLog.create({
    data: {
      actor_user_id: user.id,
      landlord_id: landlordId,
      action: "staff.deactivate",
      entity_type: "staff",
      entity_id: id,
    },
  });

  revalidatePath("/dashboard/staf");
}
