import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { scopedClient } from "@/lib/tenant-client";

/**
 * Pengawal sesi untuk halaman dashboard landlord/staf.
 * Redirect ke /login jika tiada sesi atau tiada landlord_id.
 * Mengembalikan `db` yang sudah diskop kepada landlord — semua query
 * melalui `db` dijamin terasing mengikut landlord.
 */
export async function requireLandlord() {
  const sesi = await auth();
  const landlordId = sesi?.user?.landlordId;
  if (!sesi?.user || !landlordId) {
    redirect("/login");
  }
  return { user: sesi.user, landlordId, db: scopedClient(landlordId) };
}

/** Pengawal sesi untuk kawasan super admin — tanpa skop landlord */
export async function requireSuperAdmin() {
  const sesi = await auth();
  if (!sesi?.user || sesi.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }
  return { user: sesi.user };
}

/**
 * Pengawal sesi untuk portal penyewa.
 * Cari rekod Tenant yang dipaut dengan user — diskop kepada landlord
 * yang sama dengan sesi JWT.
 */
export async function requirePenyewa() {
  const sesi = await auth();
  const landlordId = sesi?.user?.landlordId;
  if (!sesi?.user || !landlordId) {
    redirect("/login");
  }
  const db = scopedClient(landlordId);
  const penyewa = await db.tenant.findFirst({ where: { user_id: sesi.user.id } });
  if (!penyewa) {
    redirect("/login");
  }
  return { user: sesi.user, landlordId, tenantId: penyewa.id, db };
}
