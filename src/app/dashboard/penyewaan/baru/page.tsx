import { redirect } from "next/navigation";
import { requireLandlord } from "@/lib/sesi";
import { PenyewaanForm } from "./penyewaan-form";

export const dynamic = "force-dynamic";

export default async function PenyewaanBaruPage() {
  const { db } = await requireLandlord();

  const [unit, penyewa] = await Promise.all([
    db.unit.findMany({
      include: { property: { select: { name: true } } },
      orderBy: { unit_no: "asc" },
    }),
    db.tenant.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  if (unit.length === 0) redirect("/dashboard/unit/baru");
  if (penyewa.length === 0) redirect("/dashboard/penyewa/baru");

  return (
    <PenyewaanForm
      unit={unit.map((u) => ({
        id: u.id,
        label: `${u.property.name} — ${u.unit_no}`,
        hartaId: u.property_id,
        sewa: Number(u.rent_amount),
        deposit: Number(u.deposit_amount),
      }))}
      penyewa={penyewa.map((p) => ({ id: p.id, nama: p.name }))}
    />
  );
}
