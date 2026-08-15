"use server";

import { z } from "zod";
import { PropertyType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLandlord } from "@/lib/sesi";

const skema = z.object({
  nama: z.string().trim().min(2, "Nama hartanah terlalu pendek"),
  jenis: z.nativeEnum(PropertyType),
  jalan: z.string().trim().min(3, "Alamat terlalu pendek"),
  bandar: z.string().trim().min(2, "Sila isi bandar"),
  negeri: z.string().trim().min(2, "Sila pilih negeri"),
  poskod: z.string().trim().regex(/^\d{5}$/, "Poskod mesti 5 digit"),
  keterangan: z.string().trim().optional(),
});

export type HasilHartanah = { ralat?: string; medan?: Record<string, string> };

export async function ciptaHartanah(_sebelum: HasilHartanah, formData: FormData): Promise<HasilHartanah> {
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

  const { nama, jenis, jalan, bandar, negeri, poskod, keterangan } = hasil.data;

  const harta = await db.property.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      name: nama,
      type: jenis,
      street: jalan,
      city: bandar,
      state: negeri,
      postcode: poskod,
      description: keterangan || null,
      status: "ACTIVE",
    },
  });

  revalidatePath("/dashboard/hartanah");
  revalidatePath("/dashboard");
  redirect(`/dashboard/hartanah/${harta.id}`);
}
