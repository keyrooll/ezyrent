"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLandlord } from "@/lib/sesi";

const skema = z.object({
  unitId: z.string().min(1, "Pilih unit"),
  tenantId: z.string().min(1, "Pilih penyewa"),
  tarikhMula: z.coerce.date(),
  tarikhTamat: z.string().optional(),
  sewa: z.coerce.number().positive("Sewa mesti melebihi 0"),
  deposit: z.coerce.number().min(0),
  hariDue: z.coerce.number().int().min(1).max(28),
  status: z.enum(["DRAFT", "ACTIVE"]),
});

export type HasilPenyewaan = {
  ralat?: string;
  medan?: Record<string, string>;
  berjaya?: boolean;
  id?: string;
};

export async function ciptaPenyewaan(_sebelum: HasilPenyewaan, formData: FormData): Promise<HasilPenyewaan> {
  const { landlordId, db } = await requireLandlord();
  const mentah = Object.fromEntries(formData.entries());
  const hasil = skema.safeParse(mentah);

  if (!hasil.success) {
    const medan: Record<string, string> = {};
    for (const isu of hasil.error.issues) {
      if (isu.path[0]) medan[String(isu.path[0])] = isu.message;
    }
    return { medan };
  }

  const { unitId, tenantId, tarikhMula, tarikhTamat, sewa, deposit, hariDue, status } = hasil.data;

  const unit = await db.unit.findUnique({ where: { id: unitId } });
  if (!unit) return { ralat: "Unit tidak dijumpai." };
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { ralat: "Penyewa tidak dijumpai." };

  // Invariant: satu tenancy ACTIVE sahaja per unit
  if (status === "ACTIVE") {
    const aktif = await db.tenancy.findFirst({
      where: { unit_id: unit.id, status: "ACTIVE" },
    });
    if (aktif) {
      return { ralat: `Unit ${unit.unit_no} sudah mempunyai penyewaan aktif. Tamatkan dahulu sebelum buat yang baru.` };
    }
  }

  const tenancy = await db.tenancy.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      unit_id: unit.id,
      tenant_id: tenant.id,
      start_date: tarikhMula,
      end_date: tarikhTamat ? new Date(tarikhTamat) : null,
      rent_amount: sewa,
      deposit_amount: deposit,
      rent_due_day: hariDue,
      status,
    },
  });

  if (status === "ACTIVE") {
    await db.unit.update({ where: { id: unit.id }, data: { status: "OCCUPIED" } });
  }

  revalidatePath("/dashboard/penyewaan");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/unit");
  return { berjaya: true, id: tenancy.id };
}
