"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLandlord } from "@/lib/sesi";

const skema = z.object({
  nama: z.string().trim().min(2, "Nama terlalu pendek"),
  email: z.string().trim().toLowerCase().email("E-mel tidak sah").optional().or(z.literal("")),
  telefon: z.string().trim().optional(),
  noKad: z.string().trim().optional(),
  pekerjaan: z.string().trim().optional(),
  namaKecemasan: z.string().trim().optional(),
  telefonKecemasan: z.string().trim().optional(),
});

export type HasilPenyewa = { ralat?: string; medan?: Record<string, string>; berjaya?: boolean };

export async function ciptaPenyewa(_sebelum: HasilPenyewa, formData: FormData): Promise<HasilPenyewa> {
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

  const { nama, email, telefon, noKad, pekerjaan, namaKecemasan, telefonKecemasan } = hasil.data;

  await db.tenant.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      name: nama,
      email: email || null,
      phone: telefon || null,
      ic_no: noKad || null,
      occupation: pekerjaan || null,
      emergency_contact: namaKecemasan || null,
      emergency_phone: telefonKecemasan || null,
    },
  });

  revalidatePath("/dashboard/penyewa");
  revalidatePath("/dashboard");
  return { berjaya: true };
}
