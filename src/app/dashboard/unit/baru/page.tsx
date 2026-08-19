import { redirect } from "next/navigation";
import { requireLandlord } from "@/lib/sesi";
import { UnitForm } from "./unit-form";

export const dynamic = "force-dynamic";

export default async function UnitBaruPage({
  searchParams,
}: {
  searchParams?: Promise<{ hartanah?: string }>;
}) {
  const { user, db } = await requireLandlord();
  const { hartanah } = (await searchParams) ?? {};

  // Staf tidak dibenarkan tambah unit
  if (user.role === "STAFF") {
    redirect("/dashboard/unit");
  }

  const senaraiHartanah = await db.property.findMany({ orderBy: { name: "asc" } });

  if (senaraiHartanah.length === 0) {
    redirect("/dashboard/hartanah/baru");
  }

  return (
    <UnitForm
      senaraiHartanah={senaraiHartanah.map((h) => ({ id: h.id, nama: h.name }))}
      pilihanAwal={hartanah}
    />
  );
}
