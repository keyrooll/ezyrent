import { redirect } from "next/navigation";
import { requireLandlord } from "@/lib/sesi";
import { JemputanForm } from "./jemputan-form";

export const dynamic = "force-dynamic";

export default async function JemputanBaruPage() {
  const { db } = await requireLandlord();
  const unit = await db.unit.findMany({
    include: { property: { select: { name: true } } },
    orderBy: { unit_no: "asc" },
  });

  if (unit.length === 0) redirect("/dashboard/unit/baru");

  return <JemputanForm unit={unit.map((u) => ({ id: u.id, label: `${u.property.name} — ${u.unit_no}` }))} />;
}
