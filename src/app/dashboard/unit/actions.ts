"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLandlord } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";

const skema = z.object({
  hartanahId: z.string().min(1, "Pilih hartanah"),
  noUnit: z.string().trim().min(1, "Sila isi no. unit"),
  tingkat: z.string().trim().optional(),
  keluasan: z.coerce.number().int().positive().optional(),
  bilik: z.coerce.number().int().min(0).max(20).optional(),
  bilikAir: z.coerce.number().int().min(0).max(20).optional(),
  sewa: z.coerce.number().positive("Sewa mesti melebihi 0"),
  deposit: z.coerce.number().min(0),
  nota: z.string().trim().optional(),
});

export type HasilUnit = { ralat?: string; medan?: Record<string, string>; berjaya?: boolean };

export async function ciptaUnit(_sebelum: HasilUnit, formData: FormData): Promise<HasilUnit> {
  const { user, landlordId, db } = await requireLandlord();

  // Hanya tuan rumah boleh tambah unit — staf tidak dibenarkan
  if (user.role === "STAFF") {
    return { ralat: "Staf tidak dibenarkan menambah unit. Hanya tuan rumah sahaja." };
  }

  const mentah = Object.fromEntries(formData.entries());
  const hasil = skema.safeParse(mentah);

  if (!hasil.success) {
    const medan: Record<string, string> = {};
    for (const isu of hasil.error.issues) {
      if (isu.path[0]) medan[String(isu.path[0])] = isu.message;
    }
    return { medan };
  }

  const { hartanahId, noUnit, tingkat, keluasan, bilik, bilikAir, sewa, deposit, nota } = hasil.data;

  // Penguatkuasaan had unit ikut pelan langganan
  const landlord = await prisma.landlord.findUnique({ where: { id: landlordId } });
  const jumlahUnit = await db.unit.count();
  if (landlord && jumlahUnit >= landlord.unit_limit) {
    return {
      ralat: `Had unit pelan anda (${landlord.unit_limit} unit) sudah penuh. Naik taraf pelan untuk tambah unit.`,
    };
  }

  // Pastikan hartanah milik landlord ini (pertahanan berganda)
  const harta = await db.property.findUnique({ where: { id: hartanahId } });
  if (!harta) return { ralat: "Hartanah tidak dijumpai." };

  await db.unit.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      property_id: harta.id,
      unit_no: noUnit,
      floor: tingkat || null,
      size_sqm: keluasan ?? null,
      bedrooms: bilik ?? null,
      bathrooms: bilikAir ?? null,
      rent_amount: sewa,
      deposit_amount: deposit,
      notes: nota || null,
      status: "VACANT",
    },
  });

  revalidatePath("/dashboard/unit");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/hartanah/${harta.id}`);
  return { berjaya: true };
}
