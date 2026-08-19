"use server";

import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLandlord } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { DocCategory } from "@prisma/client";

const MAX_SAIZ = 5 * 1024 * 1024; // 5MB
const MIME_DIBENARKAN = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export type HasilStaf = { ralat?: string; medan?: Record<string, string>; berjaya?: boolean };

const SkemaStaf = z.object({
  nama: z.string().min(1, "Nama diperlukan."),
  email: z.string().email("E-mel tidak sah."),
  katalaluan: z.string().min(8, "Kata laluan minimum 8 aksara."),
});

const SkemaEditStaf = z.object({
  nama: z.string().min(1, "Nama diperlukan."),
  telefon: z.string().trim().optional(),
});

/** Hanya tuan rumah boleh urus staf — null jika bukan landlord */
async function hanyaTuanRumah() {
  const { user, landlordId, db } = await requireLandlord();
  if (user.role !== "LANDLORD") return null;
  return { user, landlordId, db };
}

/** Cipta akaun staf baru di bawah landlord semasa */
export async function ciptaStaf(_sebelum: HasilStaf, formData: FormData): Promise<HasilStaf> {
  const sesi = await hanyaTuanRumah();
  if (!sesi) return { ralat: "Hanya tuan rumah boleh menambah staf." };
  const { user, landlordId } = sesi;

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

/** Kemaskini nama & telefon staf */
export async function kemaskiniStaf(
  staffId: string,
  _sebelum: HasilStaf,
  formData: FormData
): Promise<HasilStaf> {
  const sesi = await hanyaTuanRumah();
  if (!sesi) return { ralat: "Hanya tuan rumah boleh mengemas kini staf." };
  const { user, landlordId, db } = sesi;

  const parsed = SkemaEditStaf.safeParse({
    nama: String(formData.get("nama") ?? "").trim(),
    telefon: String(formData.get("telefon") ?? "").trim(),
  });
  if (!parsed.success) {
    return {
      ralat: parsed.error.issues[0]?.message ?? "Data tidak sah.",
      medan: Object.fromEntries(parsed.error.issues.map((e) => [e.path.join("."), e.message])),
    };
  }

  const staf = await db.staff.findUnique({
    where: { id: staffId },
    include: { user: { select: { id: true } } },
  });
  if (!staf) return { ralat: "Staf tidak dijumpai." };

  await prisma.user.update({
    where: { id: staf.user.id },
    data: { name: parsed.data.nama, phone: parsed.data.telefon || null },
  });

  await prisma.auditLog.create({
    data: {
      actor_user_id: user.id,
      landlord_id: landlordId,
      action: "staff.update",
      entity_type: "staff",
      entity_id: staffId,
    },
  });

  revalidatePath(`/dashboard/staf/${staffId}`);
  revalidatePath("/dashboard/staf");
  return { berjaya: true };
}

/** Nyahaktifkan akaun staf */
export async function nyahaktifStaf(id: string) {
  const sesi = await hanyaTuanRumah();
  if (!sesi) return;
  const { user, landlordId, db } = sesi;

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
  revalidatePath(`/dashboard/staf/${id}`);
}

/** Aktifkan semula akaun staf yang digantung */
export async function aktifkanStaf(id: string) {
  const sesi = await hanyaTuanRumah();
  if (!sesi) return;
  const { user, landlordId, db } = sesi;

  await db.staff.updateMany({
    where: { id, landlord_id: landlordId },
    data: { status: "ACTIVE" },
  });

  await prisma.auditLog.create({
    data: {
      actor_user_id: user.id,
      landlord_id: landlordId,
      action: "staff.reactivate",
      entity_type: "staff",
      entity_id: id,
    },
  });

  revalidatePath("/dashboard/staf");
  revalidatePath(`/dashboard/staf/${id}`);
}

/** Tukar skop urusan staf: semua hartanah vs hartanah tertentu sahaja */
export async function tukarSkopStaf(staffId: string, manageAll: boolean) {
  const sesi = await hanyaTuanRumah();
  if (!sesi) return;
  const { user, landlordId, db } = sesi;

  await db.staff.updateMany({
    where: { id: staffId, landlord_id: landlordId },
    data: { manage_all: manageAll },
  });

  await prisma.auditLog.create({
    data: {
      actor_user_id: user.id,
      landlord_id: landlordId,
      action: manageAll ? "staff.scope_all" : "staff.scope_restricted",
      entity_type: "staff",
      entity_id: staffId,
    },
  });

  revalidatePath(`/dashboard/staf/${staffId}`);
}

/** Tetapkan / buang staf dari hartanah (assign) */
export async function tukarAssignHartanah(staffId: string, propertyId: string, tetapkan: boolean) {
  const sesi = await hanyaTuanRumah();
  if (!sesi) return;
  const { user, landlordId, db } = sesi;

  if (tetapkan) {
    await db.propertyStaff.upsert({
      where: { staff_id_property_id: { staff_id: staffId, property_id: propertyId } },
      create: { landlord_id: landlordId, staff_id: staffId, property_id: propertyId, can_view: true },
      update: { can_view: true },
    });
  } else {
    await db.propertyStaff.deleteMany({
      where: { staff_id: staffId, property_id: propertyId, landlord_id: landlordId },
    });
  }

  await prisma.auditLog.create({
    data: {
      actor_user_id: user.id,
      landlord_id: landlordId,
      action: tetapkan ? "staff.assign_property" : "staff.unassign_property",
      entity_type: "property_staff",
      entity_id: `${staffId}:${propertyId}`,
    },
  });

  revalidatePath(`/dashboard/staf/${staffId}`);
}

/** Kemaskini kontak kecemasan staf — tuan rumah sahaja */
export async function kemaskiniKecemasanStaf(
  staffId: string,
  _sebelum: HasilStaf,
  formData: FormData
): Promise<HasilStaf> {
  const sesi = await hanyaTuanRumah();
  if (!sesi) return { ralat: "Hanya tuan rumah boleh mengemas kini staf." };
  const { user, landlordId, db } = sesi;

  const parsed = z
    .object({
      namaKecemasan: z.string().trim().optional(),
      telefonKecemasan: z.string().trim().optional(),
      alamatKecemasan: z.string().trim().optional(),
      hubungan: z.string().trim().optional(),
    })
    .safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ralat: parsed.error.issues[0]?.message ?? "Data tidak sah." };
  }

  await db.staff.updateMany({
    where: { id: staffId, landlord_id: landlordId },
    data: {
      emergency_contact: parsed.data.namaKecemasan || null,
      emergency_phone: parsed.data.telefonKecemasan || null,
      emergency_address: parsed.data.alamatKecemasan || null,
      emergency_relationship: parsed.data.hubungan || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actor_user_id: user.id,
      landlord_id: landlordId,
      action: "staff.update_emergency",
      entity_type: "staff",
      entity_id: staffId,
    },
  });

  revalidatePath(`/dashboard/staf/${staffId}`);
  return { berjaya: true };
}

/** Muat naik dokumen staf: IC, perjanjian pekerjaan, lain-lain — tuan rumah sahaja */
export async function muatNaikDokumenStaf(
  staffId: string,
  _sebelum: HasilStaf,
  formData: FormData
): Promise<HasilStaf> {
  const sesi = await hanyaTuanRumah();
  if (!sesi) return { ralat: "Hanya tuan rumah boleh memuat naik dokumen staf." };
  const { user, landlordId, db } = sesi;

  const kategori = String(formData.get("kategori") ?? "") as DocCategory;
  const KATEGORI_DIBENARKAN: DocCategory[] = ["STAFF_IC", "STAFF_AGREEMENT", "OTHER"];
  if (!KATEGORI_DIBENARKAN.includes(kategori)) return { ralat: "Kategori dokumen tidak sah." };

  const fail = formData.get("fail") as File | null;
  if (!fail || fail.size === 0) return { ralat: "Pilih fail dahulu." };
  if (fail.size > MAX_SAIZ) return { ralat: "Fail terlalu besar (maksimum 5MB)." };
  if (!MIME_DIBENARKAN.includes(fail.type)) {
    return { ralat: "Format fail tidak disokong (JPG, PNG, WEBP atau PDF sahaja)." };
  }

  const staf = await db.staff.findUnique({ where: { id: staffId } });
  if (!staf) return { ralat: "Staf tidak dijumpai." };

  const dir = path.join(process.cwd(), "uploads", landlordId, "staf", staffId);
  await fs.mkdir(dir, { recursive: true });
  const nama = fail.name.replace(/[^\w.\-]/g, "_");
  const stored = path.join("uploads", landlordId, "staf", staffId, nama);
  const data = Buffer.from(await fail.arrayBuffer());
  await fs.writeFile(path.join(process.cwd(), stored), data);

  await db.document.create({
    data: {
      landlord_id: landlordId, // dienforce oleh tenant-client
      uploader_user_id: user.id,
      staff_id: staffId,
      category: kategori,
      original_name: fail.name,
      stored_path: stored,
      mime_type: fail.type,
      size_bytes: fail.size,
    },
  });

  revalidatePath(`/dashboard/staf/${staffId}`);
  return { berjaya: true };
}
