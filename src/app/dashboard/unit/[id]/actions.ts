"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";

export type HasilBilUnit = {
  ralat?: string;
  medan?: Record<string, string>;
  berjaya?: boolean;
};

const skema = z.object({
  unitId: z.string().min(1),
  tenantId: z.string().min(1, "Pilih penyewa."),
  bulan: z.string().regex(/^\d{4}-\d{2}$/, "Pilih bulan bil."),
  amaun: z.coerce.number().positive("Amaun bil tidak sah."),
});

/** Sahkan unit berada dalam skop staf — pulang unit jika sah */
async function unitDalamSkop(unitId: string) {
  const { db, user, landlordId } = await requireLandlord();
  const unit = await db.unit.findUnique({
    where: { id: unitId },
    select: { id: true, property_id: true },
  });
  if (!unit) return { db, user, landlordId, unit: null };

  const skop = await skopHartanahStaf(db, user);
  if (skop && !skop.includes(unit.property_id)) return { db, user, landlordId, unit: null };

  return { db, user, landlordId, unit };
}

/** Tambah bil utiliti untuk unit — tenant sedia ada unit */
export async function tambahBilUnit(
  _sebelum: HasilBilUnit,
  formData: FormData
): Promise<HasilBilUnit> {
  const { db, user, landlordId, unit } = await unitDalamSkop(String(formData.get("unitId") ?? ""));
  if (!unit) return { ralat: "Unit di luar skop urusan anda." };

  const parsed = skema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const medan: Record<string, string> = {};
    for (const isu of parsed.error.issues) {
      if (isu.path[0]) medan[String(isu.path[0])] = isu.message;
    }
    return { medan };
  }

  // Pastikan penyewa benar-benar menyewa unit ini
  const tenancy = await db.tenancy.findFirst({
    where: { unit_id: unit.id, tenant_id: parsed.data.tenantId, status: "ACTIVE" },
  });
  if (!tenancy) return { ralat: "Penyewa tidak aktif menyewa unit ini." };

  // Elak bil berganda untuk unit + bulan sama
  const wujud = await db.utilityBil.findFirst({
    where: { unit_id: unit.id, bulan: parsed.data.bulan },
  });
  if (wujud) return { ralat: "Bil untuk bulan ini sudah wujud bagi unit ini." };

  await db.utilityBil.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      tenant_id: parsed.data.tenantId,
      unit_id: unit.id,
      bulan: parsed.data.bulan,
      amount: parsed.data.amaun,
      status: "UNPAID",
      created_by_user_id: user.id,
    },
  });

  revalidatePath(`/dashboard/unit/${unit.id}`);
  return { berjaya: true };
}

/** Padam bil utiliti — semak bil dalam skop staf */
export async function padamBilUnit(bilId: string) {
  const { db, user } = await requireLandlord();

  const bil = await db.utilityBil.findUnique({
    where: { id: bilId },
    select: { id: true, unit: { select: { id: true, property_id: true } } },
  });
  if (!bil) return;

  const skop = await skopHartanahStaf(db, user);
  if (skop && (!bil.unit || !skop.includes(bil.unit.property_id))) return;

  await db.utilityBil.delete({ where: { id: bilId } });
  revalidatePath("/dashboard/utiliti");
  if (bil.unit) revalidatePath(`/dashboard/unit/${bil.unit.id}`);
}

const skemaEdit = z.object({
  bilId: z.string().min(1),
  bulan: z.string().regex(/^\d{4}-\d{2}$/, "Pilih bulan bil."),
  amaun: z.coerce.number().positive("Amaun bil tidak sah."),
});

/** Kemas kini bil utiliti (bulan + amaun) — landlord & staf dalam skop */
export async function kemaskiniBilUnit(
  _sebelum: HasilBilUnit,
  formData: FormData
): Promise<HasilBilUnit> {
  const { db, user } = await requireLandlord();
  const parsed = skemaEdit.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const medan: Record<string, string> = {};
    for (const isu of parsed.error.issues) {
      if (isu.path[0]) medan[String(isu.path[0])] = isu.message;
    }
    return { medan };
  }

  const bil = await db.utilityBil.findUnique({
    where: { id: parsed.data.bilId },
    select: { id: true, unit: { select: { id: true, property_id: true } } },
  });
  if (!bil) return { ralat: "Bil tidak dijumpai." };

  const skop = await skopHartanahStaf(db, user);
  if (skop && (!bil.unit || !skop.includes(bil.unit.property_id))) {
    return { ralat: "Bil di luar skop urusan anda." };
  }

  await db.utilityBil.update({
    where: { id: parsed.data.bilId },
    data: { bulan: parsed.data.bulan, amount: parsed.data.amaun },
  });

  revalidatePath("/dashboard/utiliti");
  if (bil.unit) revalidatePath(`/dashboard/unit/${bil.unit.id}`);
  return { berjaya: true };
}
