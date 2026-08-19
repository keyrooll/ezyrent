"use server";

import { revalidatePath } from "next/cache";
import { requireLandlord } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";

export type HasilKelulusan = { ralat?: string; berjaya?: boolean };

/**
 * Landlord & staf boleh menilai permohonan — staf hanya untuk permohonan
 * penyewa; permohonan berkaitan staf hanya landlord.
 */
async function sahkanPengurus() {
  const ctx = await requireLandlord();
  if (ctx.user.role !== "LANDLORD" && ctx.user.role !== "STAFF") return null;
  return ctx;
}

/** Luluskan permohonan — terapkan nilai ke User/Tenant */
async function lulusKelulusan(id: string): Promise<HasilKelulusan> {
  const ctx = await sahkanPengurus();
  if (!ctx) return { ralat: "Hanya tuan rumah atau staf boleh meluluskan permohonan." };
  const { user, db } = ctx;

  const permohonan = await db.profileUpdateRequest.findFirst({
    where: { id, status: "PENDING" },
  });
  if (!permohonan) return { ralat: "Permohonan tidak dijumpai." };
  if (user.role === "STAFF" && permohonan.jenis !== "TENANT") {
    return { ralat: "Staf hanya boleh meluluskan permohonan penyewa." };
  }

  await prisma.user.update({
    where: { id: permohonan.user_id },
    data: { name: permohonan.nama, phone: permohonan.telefon },
  });

  if (permohonan.jenis === "TENANT" && permohonan.tenant_id) {
    await db.tenant.update({
      where: { id: permohonan.tenant_id },
      data: {
        emergency_contact: permohonan.emergency_contact,
        emergency_phone: permohonan.emergency_phone,
        emergency_address: permohonan.emergency_address,
        emergency_relationship: permohonan.emergency_relationship,
      },
    });
  }

  if (permohonan.jenis === "STAFF" && permohonan.staff_id) {
    await db.staff.update({
      where: { id: permohonan.staff_id },
      data: {
        emergency_contact: permohonan.emergency_contact,
        emergency_phone: permohonan.emergency_phone,
        emergency_address: permohonan.emergency_address,
        emergency_relationship: permohonan.emergency_relationship,
      },
    });
  }

  await db.profileUpdateRequest.update({
    where: { id: permohonan.id },
    data: { status: "APPROVED", reviewed_at: new Date() },
  });

  await prisma.notification.create({
    data: {
      user_id: permohonan.user_id,
      type: "PROFILE_APPROVED",
      title: "Kemaskini profil diluluskan",
      body: "Tuan rumah telah meluluskan permohonan kemaskini profil anda.",
    },
  });

  revalidatePath("/dashboard/kelulusan");
  return { berjaya: true };
}

/** Tolak permohonan — tiada perubahan dibuat */
async function tolakKelulusan(id: string): Promise<HasilKelulusan> {
  const ctx = await sahkanPengurus();
  if (!ctx) return { ralat: "Hanya tuan rumah atau staf boleh menilai permohonan." };
  const { user, db } = ctx;

  const permohonan = await db.profileUpdateRequest.findFirst({
    where: { id, status: "PENDING" },
  });
  if (!permohonan) return { ralat: "Permohonan tidak dijumpai." };
  if (user.role === "STAFF" && permohonan.jenis !== "TENANT") {
    return { ralat: "Staf hanya boleh meluluskan permohonan penyewa." };
  }

  await db.profileUpdateRequest.update({
    where: { id: permohonan.id },
    data: { status: "REJECTED", reviewed_at: new Date() },
  });

  await prisma.notification.create({
    data: {
      user_id: permohonan.user_id,
      type: "PROFILE_REJECTED",
      title: "Kemaskini profil ditolak",
      body: "Tuan rumah menolak permohonan kemaskini profil anda.",
    },
  });

  revalidatePath("/dashboard/kelulusan");
  return { berjaya: true };
}

/** Wrapper untuk <form action> — id dibawa dalam medan tersembunyi */
export async function lulusForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await lulusKelulusan(id);
}

/** Wrapper untuk <form action> — id dibawa dalam medan tersembunyi */
export async function tolakForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await tolakKelulusan(id);
}
