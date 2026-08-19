"use server";

import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { ExpenseCategory } from "@prisma/client";

const MAX_SAIZ = 5 * 1024 * 1024; // 5MB
const MIME_DIBENARKAN = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export type HasilPerbelanjaan = {
  ralat?: string;
  medan?: Record<string, string>;
  berjaya?: boolean;
};

const skema = z.object({
  propertyId: z.string().min(1, "Pilih hartanah."),
  unitId: z.string().optional(),
  maintenanceRequestId: z.string().optional(),
  category: z.nativeEnum(ExpenseCategory, { message: "Pilih kategori." }),
  description: z.string().trim().min(3, "Keterangan terlalu pendek."),
  amount: z.coerce.number().positive("Amaun tidak sah."),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tarikh."),
  vendor: z.string().trim().optional(),
});

/** Tambah perbelanjaan (landlord & staf) — boleh lampir resit */
export async function tambahExpense(
  _sebelum: HasilPerbelanjaan,
  formData: FormData
): Promise<HasilPerbelanjaan> {
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

  const resit = formData.get("resit") as File | null;
  if (resit && resit.size > MAX_SAIZ) return { ralat: "Resit terlalu besar (maksimum 5MB)." };
  if (resit && resit.size > 0 && !MIME_DIBENARKAN.includes(resit.type)) {
    return { ralat: "Format resit tidak disokong (JPG, PNG, WEBP atau PDF sahaja)." };
  }

  const { propertyId, unitId, maintenanceRequestId, category, description, amount, expense_date, vendor } =
    hasil.data;

  const skop = await skopHartanahStaf(db, user);
  if (skop && !skop.includes(propertyId)) {
    return { ralat: "Hartanah di luar skop urusan anda." };
  }

  // Unit & maintenance request mesti dalam skop (jika dipilih)
  if (unitId) {
    const unit = await db.unit.findUnique({ where: { id: unitId }, select: { property_id: true } });
    if (!unit || unit.property_id !== propertyId) {
      return { ralat: "Unit tidak sepadan dengan hartanah." };
    }
  }
  if (maintenanceRequestId) {
    const aduan = await db.maintenanceRequest.findUnique({
      where: { id: maintenanceRequestId },
      select: { unit: { select: { property_id: true } } },
    });
    if (!aduan || (skop && !skop.includes(aduan.unit.property_id))) {
      return { ralat: "Aduan maintenance tidak sah atau di luar skop." };
    }
  }

  const expense = await db.expense.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      property_id: propertyId,
      unit_id: unitId || null,
      maintenance_request_id: maintenanceRequestId || null,
      category,
      description,
      amount,
      expense_date: new Date(expense_date),
      vendor: vendor || null,
      created_by_user_id: user.id,
    },
  });

  if (resit && resit.size > 0) {
    const dir = path.join(process.cwd(), "uploads", landlordId, "expense", expense.id);
    await fs.mkdir(dir, { recursive: true });
    const nama = resit.name.replace(/[^\w.\-]/g, "_");
    const stored = path.join("uploads", landlordId, "expense", expense.id, nama);
    const data = Buffer.from(await resit.arrayBuffer());
    await fs.writeFile(path.join(process.cwd(), stored), data);

    await db.document.create({
      data: {
        landlord_id: landlordId, // dienforce oleh tenant-client
        uploader_user_id: user.id,
        expense_id: expense.id,
        category: "EXPENSE_RECEIPT",
        original_name: resit.name,
        stored_path: stored,
        mime_type: resit.type,
        size_bytes: resit.size,
      },
    });
  }

  revalidatePath("/dashboard/perbelanjaan");
  revalidatePath("/dashboard/laporan");
  return { berjaya: true };
}

/** Padam perbelanjaan — staf terhad hanya boleh padam dalam skop hartanah mereka */
export async function padamExpense(id: string) {
  const { db, user } = await requireLandlord();

  const exp = await db.expense.findUnique({ where: { id }, select: { property_id: true } });
  if (!exp) return;

  const skop = await skopHartanahStaf(db, user);
  if (skop && !skop.includes(exp.property_id)) return;

  await db.expense.delete({ where: { id } });

  revalidatePath("/dashboard/perbelanjaan");
  revalidatePath("/dashboard/laporan");
}
