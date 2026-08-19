import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { AduanForm } from "./aduan-form";
import { KanbanMaintenance, type KadAduan } from "@/components/dashboard/kanban-maintenance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);

  const [aduan, unit] = await Promise.all([
    db.maintenanceRequest.findMany({
      where: skop ? { unit: { property_id: { in: skop } } } : {},
      include: {
        unit: { select: { unit_no: true, property: { select: { name: true } } } },
        reporter: { select: { name: true } },
        tenant: { select: { name: true } },
        documents: { select: { id: true, original_name: true } },
      },
      orderBy: { created_at: "desc" },
    }),
    db.unit.findMany({
      where: skop ? { property_id: { in: skop } } : {},
      include: { property: { select: { name: true } } },
      orderBy: { unit_no: "asc" },
    }),
  ]);

  const keKad = (a: (typeof aduan)[number]): KadAduan => ({
    id: a.id,
    tajuk: a.title,
    hartanah: a.unit.property.name,
    gambar: a.documents[0] ? { id: a.documents[0].id, nama: a.documents[0].original_name } : undefined,
  });

  const data = {
    COMPLAIN: aduan.filter((a) => a.status === "COMPLAIN").map(keKad),
    IN_PROGRESS: aduan.filter((a) => a.status === "IN_PROGRESS").map(keKad),
    COMPLETED: aduan.filter((a) => a.status === "COMPLETED").map(keKad),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Maintenance</h1>
        <p className="text-sm text-muted-foreground">
          Seret kad antara kolum untuk mengemaskini status aduan.
        </p>
      </div>

      {/* Hantar aduan baharu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hantar Aduan Baru</CardTitle>
          <CardDescription>Laporkan kerosakan atau penyelenggaraan unit</CardDescription>
        </CardHeader>
        <CardContent>
          {unit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Daftarkan unit dahulu sebelum menghantar aduan.</p>
          ) : (
            <AduanForm
              unit={unit.map((u) => ({ id: u.id, label: `${u.property.name} — ${u.unit_no}` }))}
            />
          )}
        </CardContent>
      </Card>

      <KanbanMaintenance data={data} pautanBase="/dashboard/maintenance" />
    </div>
  );
}
