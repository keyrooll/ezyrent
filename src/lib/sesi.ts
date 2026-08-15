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
