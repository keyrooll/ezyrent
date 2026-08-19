import { requirePenyewa } from "@/lib/sesi";
import { AduanForm } from "./aduan-form";
import { KanbanMaintenance, type KadAduan } from "@/components/dashboard/kanban-maintenance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AduanPenyewaPage() {
  const { tenantId, db } = await requirePenyewa();

  const aduan = await db.maintenanceRequest.findMany({
    where: { tenant_id: tenantId },
    include: {
      unit: { select: { unit_no: true, property: { select: { name: true } } } },
      documents: { select: { id: true, original_name: true } },
    },
    orderBy: { created_at: "desc" },
  });

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
        <h1 className="text-2xl font-semibold tracking-tight">Aduan Maintenance</h1>
        <p className="text-sm text-muted-foreground">
          Laporkan kerosakan di unit anda — tuan rumah akan dimaklumkan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hantar Aduan</CardTitle>
        </CardHeader>
        <CardContent>
          <AduanForm />
        </CardContent>
      </Card>

      {/* Paparan 3 kolum sama seperti view staff — baca sahaja */}
      <KanbanMaintenance data={data} bolehSeret={false} />
    </div>
  );
}
