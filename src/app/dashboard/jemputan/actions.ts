"use server";

import crypto from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";

const skema = z.object({
  jenis: z.enum(["TENANT", "STAFF"]),
  unitId: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email("E-mel tidak sah"),
  telefon: z.string().trim().optional(),
});

export type HasilJemputan = { ralat?: string; medan?: Record<string, string>; berjaya?: boolean };

export async function ciptaJemputan(_sebelum: HasilJemputan, formData: FormData): Promise<HasilJemputan> {
  const { user, landlordId, db } = await requireLandlord();
  const mentah = Object.fromEntries(formData.entries());
  const hasil = skema.safeParse(mentah);

  if (!hasil.success) {
    const medan: Record<string, string> = {};
    for (const isu of hasil.error.issues) {
      if (isu.path[0]) medan[String(isu.path[0])] = isu.message;
    }
    return { medan };
  }

  const { jenis, unitId, email, telefon } = hasil.data;

  // Jemputan staf hanya oleh tuan rumah (owner)
  if (jenis === "STAFF" && user.role !== "LANDLORD") {
    return { ralat: "Hanya tuan rumah boleh menjemput staf." };
  }

  if (jenis === "TENANT") {
    if (!unitId) return { medan: { unitId: "Pilih unit" } };
    const unit = await db.unit.findUnique({ where: { id: unitId } });
    if (!unit) return { ralat: "Unit tidak dijumpai." };

    // Staf terhad hanya boleh jemput penyewa untuk unit dalam skop mereka
    const skop = await skopHartanahStaf(db, user);
    if (skop && !skop.includes(unit.property_id)) {
      return { ralat: "Unit di luar skop urusan anda." };
    }

    // Jangan benarkan jemputan berganda PENDING untuk unit + e-mel yang sama
    const wujud = await db.invitation.findFirst({
      where: { unit_id: unit.id, tenant_email: email, status: "PENDING" },
    });
    if (wujud) return { ralat: "Jemputan untuk e-mel ini pada unit tersebut sudah wujud." };
  } else {
    const wujud = await db.invitation.findFirst({
      where: { role: "STAFF", tenant_email: email, status: "PENDING" },
    });
    if (wujud) return { ralat: "Jemputan staf untuk e-mel ini sudah wujud." };
  }

  const token = crypto.randomBytes(24).toString("hex");

  const jemputan = await db.invitation.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      unit_id: jenis === "TENANT" ? unitId! : null,
      role: jenis,
      tenant_email: email,
      tenant_phone: telefon || null,
      token,
      status: "PENDING",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // sah 24 jam sahaja
      invited_by_user_id: user.id,
    },
  });

  revalidatePath("/dashboard/jemputan");
  redirect(`/dashboard/jemputan/${jemputan.id}`);
}

export async function batalkanJemputan(id: string) {
  const { db } = await requireLandlord();
  const jemputan = await db.invitation.findUnique({ where: { id } });
  if (!jemputan) return;
  await db.invitation.update({
    where: { id },
    data: { status: "REVOKED" },
  });
  revalidatePath("/dashboard/jemputan");
  revalidatePath(`/dashboard/jemputan/${id}`);
}
