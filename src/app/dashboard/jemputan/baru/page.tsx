import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { JemputanForm } from "./jemputan-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function JemputanBaruPage() {
  const { user, db } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);
  const bolehJemputStaf = user.role === "LANDLORD";

  // Staf terhad hanya nampak unit dalam skop mereka; staf hanya jemput penyewa
  const unit = await db.unit.findMany({
    where: skop ? { property_id: { in: skop } } : {},
    include: { property: { select: { name: true } } },
    orderBy: { unit_no: "asc" },
  });

  // Staf tanpa sebarang unit dalam skop tidak boleh membuat jemputan
  if (unit.length === 0 && !bolehJemputStaf) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Jemputan Baru</CardTitle>
            <CardDescription>Jemputan penyewa untuk unit dalam skop urusan anda</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tiada unit dalam skop urusan anda. Tuan rumah belum menugaskan sebarang hartanah
              kepada anda.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <JemputanForm
      unit={unit.map((u) => ({ id: u.id, label: `${u.property.name} — ${u.unit_no}` }))}
      bolehJemputStaf={bolehJemputStaf}
    />
  );
}
