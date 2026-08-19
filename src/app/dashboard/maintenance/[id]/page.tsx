import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { formatTarikh } from "@/lib/format";
import { ubahStatusForm } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const LABEL_STATUS: Record<string, string> = {
  COMPLAIN: "Aduan Baru",
  IN_PROGRESS: "Dalam Proses",
  COMPLETED: "Selesai",
};

const WARNA_STATUS: Record<string, string> = {
  COMPLAIN: "bg-red-500/10 text-red-700",
  IN_PROGRESS: "bg-amber-500/10 text-amber-700",
  COMPLETED: "bg-emerald-500/10 text-emerald-700",
};

const STATUS_SENARAI = ["COMPLAIN", "IN_PROGRESS", "COMPLETED"] as const;

export default async function AduanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);

  const aduan = await db.maintenanceRequest.findUnique({
    where: { id },
    include: {
      unit: { include: { property: { select: { name: true } } } },
      tenant: { select: { id: true, name: true } },
      reporter: { select: { name: true } },
      documents: { select: { id: true, original_name: true } },
    },
  });

  if (!aduan || (skop && !skop.includes(aduan.unit.property_id))) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/maintenance"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Semua Aduan
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{aduan.title}</h1>
            <Badge variant="outline" className={WARNA_STATUS[aduan.status]}>
              {LABEL_STATUS[aduan.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {aduan.unit.property.name} • Unit {aduan.unit.unit_no} • {formatTarikh(aduan.created_at)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Maklumat Aduan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Hartanah</dt>
                  <dd className="font-medium">{aduan.unit.property.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Unit</dt>
                  <dd className="font-medium">
                    <Link href={`/dashboard/unit/${aduan.unit_id}`} className="text-primary hover:underline">
                      {aduan.unit.unit_no}
                    </Link>
                  </dd>
                </div>
                {aduan.tenant && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Penyewa</dt>
                    <dd className="font-medium">
                      <Link
                        href={`/dashboard/penyewa/${aduan.tenant.id}`}
                        className="text-primary hover:underline"
                      >
                        {aduan.tenant.name}
                      </Link>
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Pelapor</dt>
                  <dd className="font-medium">{aduan.reporter.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Tarikh</dt>
                  <dd className="font-medium">{formatTarikh(aduan.created_at)}</dd>
                </div>
              </dl>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Keterangan Kerosakan
                </p>
                <p className="mt-1 whitespace-pre-line">{aduan.description}</p>
              </div>
            </CardContent>
          </Card>

          {aduan.documents.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Gambar ({aduan.documents.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {aduan.documents.map((d) => (
                  <Link
                    key={d.id}
                    href={`/api/v1/dokumen/${d.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-primary hover:bg-accent"
                  >
                    <ImageIcon className="size-4" />
                    {d.original_name}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tukar Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {STATUS_SENARAI.filter((s) => s !== aduan.status).map((s) => (
              <form key={s} action={ubahStatusForm} className="w-full">
                <input type="hidden" name="id" value={aduan.id} />
                <input type="hidden" name="status" value={s} />
                <Button type="submit" variant="outline" size="sm" className="w-full justify-start">
                  Pindah ke {LABEL_STATUS[s]}
                </Button>
              </form>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">
              Atau seret kad di papan Kanban.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
