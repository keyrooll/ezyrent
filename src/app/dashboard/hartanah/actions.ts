"use server";

import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { PropertyType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLandlord } from "@/lib/sesi";

const MAX_SAIZ = 5 * 1024 * 1024; // 5MB
const MIME_DIBENARKAN = ["image/jpeg", "image/png", "image/webp"];

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
  const { user, landlordId, db } = await requireLandlord();

  // Hanya tuan rumah boleh tambah hartanah — staf tidak dibenarkan
  if (user.role === "STAFF") {
    return { ralat: "Staf tidak dibenarkan menambah hartanah. Hanya tuan rumah sahaja." };
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

  const gambar = formData.get("gambar") as File | null;
  if (gambar && gambar.size > MAX_SAIZ) return { ralat: "Gambar terlalu besar (maksimum 5MB)." };
  if (gambar && gambar.size > 0 && !MIME_DIBENARKAN.includes(gambar.type)) {
    return { ralat: "Format gambar tidak disokong (JPG, PNG atau WEBP sahaja)." };
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

  // Simpan gambar hartanah (jika dilampir)
  if (gambar && gambar.size > 0) {
    const dir = path.join(process.cwd(), "uploads", landlordId, "property", harta.id);
    await fs.mkdir(dir, { recursive: true });
    const nama = `gambar-${Date.now()}.${gambar.type.split("/")[1]}`;
    const stored = path.join("uploads", landlordId, "property", harta.id, nama);
    const data = Buffer.from(await gambar.arrayBuffer());
    await fs.writeFile(path.join(process.cwd(), stored), data);

    await db.property.update({
      where: { id: harta.id },
      data: { image_path: stored },
    });
  }

  revalidatePath("/dashboard/hartanah");
  revalidatePath("/dashboard");
  redirect(`/dashboard/hartanah/${harta.id}`);
}
