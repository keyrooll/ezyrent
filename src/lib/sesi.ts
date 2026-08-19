import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { scopedClient } from "@/lib/tenant-client";
import { prisma } from "@/lib/prisma";

/**
 * Peranan berkesan pengguna — pilihan paparan (view_role) jika rekod untuk
 * peranan itu wujud, selainnya peranan asal. Sentiasa semak DB kerana
 * view_role tidak disimpan dalam JWT.
 */
async function perananBerkesan(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, view_role: true },
  });
  if (!u) return null;
  if (u.role === "SUPER_ADMIN") return u.role;

  const pilihan = u.view_role;
  if (pilihan && pilihan !== u.role) {
    const wujud = await (pilihan === "LANDLORD"
      ? prisma.landlord.findFirst({ where: { owner_id: userId }, select: { id: true } })
      : pilihan === "STAFF"
        ? prisma.staff.findFirst({ where: { user_id: userId }, select: { id: true } })
        : pilihan === "TENANT"
          ? prisma.tenant.findFirst({ where: { user_id: userId }, select: { id: true } })
          : null);
    if (wujud) return pilihan;
  }
  return u.role;
}

export type PilihanPaparan = { kod: string; label: string; semasa: boolean };

/** Senarai peranan yang user benar-benar berdaftar — untuk penukar paparan */
export async function pilihanPaparan(userId: string): Promise<PilihanPaparan[]> {
  const [u, ll, staf, penyewa] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true, view_role: true } }),
    prisma.landlord.findFirst({ where: { owner_id: userId }, select: { id: true } }),
    prisma.staff.findFirst({ where: { user_id: userId }, select: { id: true } }),
    prisma.tenant.findFirst({ where: { user_id: userId }, select: { id: true } }),
  ]);
  const semasa = u?.view_role ?? u?.role;
  const senarai: { kod: string; label: string }[] = [];
  if (ll) senarai.push({ kod: "LANDLORD", label: "Landlord" });
  if (staf) senarai.push({ kod: "STAFF", label: "Staf" });
  if (penyewa) senarai.push({ kod: "TENANT", label: "Penyewa" });
  return senarai.map((s) => ({ ...s, semasa: s.kod === semasa }));
}

/**
 * Pengawal sesi untuk halaman dashboard landlord/staf.
 * Redirect ke /login jika tiada sesi atau tiada landlord_id.
 * Mengembalikan `db` yang sudah diskop kepada landlord — semua query
 * melalui `db` dijamin terasing mengikut landlord.
 */
export async function requireLandlord() {
  const sesi = await auth();
  const user = sesi?.user;
  if (!user) redirect("/login");

  const peranan = await perananBerkesan(user.id);
  // Penyewa yang memilih paparan penyewa tidak boleh masuk dashboard
  if (peranan === "TENANT") redirect("/penyewa");
  if (peranan !== "LANDLORD" && peranan !== "STAFF") redirect("/login");

  // Landlord_id ikut rekod peranan berkesan — bukan JWT semata-mata
  let landlordId: string | undefined = undefined;
  if (peranan === "LANDLORD") {
    const ll = await prisma.landlord.findFirst({
      where: { owner_id: user.id },
      select: { id: true },
    });
    landlordId = ll?.id;
  } else {
    const staf = await prisma.staff.findFirst({
      where: { user_id: user.id },
      select: { landlord_id: true },
    });
    landlordId = staf?.landlord_id;
  }
  if (!landlordId) redirect("/login");

  return { user: { ...user, role: peranan }, landlordId, db: scopedClient(landlordId) };
}

/**
 * Skop urusan staf mengikut hartanah.
 *  - null → tiada sekatan (landlord, atau staf dengan manage_all = true)
 *  - string[] → senarai property_id yang staf ini dibenarkan urus
 */
export async function skopHartanahStaf(
  db: ReturnType<typeof scopedClient>,
  user: { id: string; role?: string }
): Promise<string[] | null> {
  if (user.role !== "STAFF") return null;
  const staf = await db.staff.findFirst({ where: { user_id: user.id } });
  if (!staf || staf.manage_all) return null;
  const grants = await db.propertyStaff.findMany({
    where: { staff_id: staf.id },
    select: { property_id: true },
  });
  return grants.map((g) => g.property_id);
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
 * Cari rekod Tenant yang dipaut dengan user — merentas landlord kerana
 * paparan penyewa mungkin milik landlord berbeza daripada JWT semasa.
 */
export async function requirePenyewa() {
  const sesi = await auth();
  const user = sesi?.user;
  if (!user) redirect("/login");

  const peranan = await perananBerkesan(user.id);
  if (peranan !== "TENANT") redirect("/dashboard");

  const penyewa = await prisma.tenant.findFirst({
    where: { user_id: user.id },
    select: { id: true, landlord_id: true },
  });
  if (!penyewa) redirect("/login");

  const db = scopedClient(penyewa.landlord_id);
  const wujud = await db.tenant.findFirst({ where: { id: penyewa.id } });
  if (!wujud) redirect("/login");

  return {
    user: { ...user, role: "TENANT" },
    landlordId: penyewa.landlord_id,
    tenantId: penyewa.id,
    db,
  };
}
