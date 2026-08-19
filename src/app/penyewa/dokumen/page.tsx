import Link from "next/link";
import { FileText } from "lucide-react";
import { requirePenyewa } from "@/lib/sesi";
import { formatRM, formatTarikh } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BorangBukti } from "./borang-bukti";

export const dynamic = "force-dynamic";

const STATUS_BIL: Record<string, { label: string; kelas: string }> = {
  UNPAID: { label: "Belum Dibayar", kelas: "bg-red-500/10 text-red-700" },
  PENDING_PROOF: { label: "Menunggu Pengesahan", kelas: "bg-amber-500/10 text-amber-700" },
  PAID: { label: "Disahkan", kelas: "bg-emerald-500/10 text-emerald-700" },
};

const BULAN_MELAYU = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember",
];

function formatBulan(bulan: string) {
  const [tahun, bln] = bulan.split("-");
  return `${BULAN_MELAYU[Number(bln) - 1] ?? bln} ${tahun}`;
}

export default async function DokumenPenyewaPage() {
  const { tenantId, db } = await requirePenyewa();

  const [dokumen, bil] = await Promise.all([
    db.document.findMany({
      where: { tenant_id: tenantId, category: { in: ["TENANT_IC", "TENANCY_AGREEMENT"] } },
      orderBy: { created_at: "desc" },
    }),
    db.utilityBil.findMany({
      where: { tenant_id: tenantId },
      include: { documents: { select: { id: true, original_name: true } } },
      orderBy: { bulan: "desc" },
    }),
  ]);

  const dokumenIc = dokumen.filter((d) => d.category === "TENANT_IC");
  const dokumenPerjanjian = dokumen.filter((d) => d.category === "TENANCY_AGREEMENT");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dokumen</h1>
        <p className="text-sm text-muted-foreground">
          Dokumen sewaan anda — IC, perjanjian dan bil utiliti
        </p>
      </div>

      {/* IC & Perjanjian — dimuat naik oleh tuan rumah/staf */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kad Pengenalan</CardTitle>
          </CardHeader>
          <CardContent>
            <SenaraiDokumen senarai={dokumenIc} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Perjanjian Sewaan</CardTitle>
          </CardHeader>
          <CardContent>
            <SenaraiDokumen senarai={dokumenPerjanjian} />
          </CardContent>
        </Card>
      </div>

      {/* Bil Utiliti — bayar + hantar bukti */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Bil Utiliti ({bil.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bil.length === 0 ? (
            <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              Tiada bil lagi. Tuan rumah akan memuat naik bil setiap bulan.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {bil.map((b) => {
                const info = STATUS_BIL[b.status] ?? STATUS_BIL.UNPAID;
                const bukti = b.documents[0];
                return (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {formatBulan(b.bulan)} · {formatRM(Number(b.amount))}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={info.kelas}>
                          {info.label}
                        </Badge>
                        {bukti && (
                          <Link
                            href={`/api/v1/dokumen/${bukti.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <FileText className="size-3.5" />
                            {bukti.original_name}
                          </Link>
                        )}
                      </div>
                    </div>
                    {b.status === "UNPAID" && <BorangBukti bilId={b.id} />}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SenaraiDokumen({
  senarai,
}: {
  senarai: { id: string; original_name: string; created_at: Date }[];
}) {
  if (senarai.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        Tiada dokumen.
      </p>
    );
  }
  return (
    <ul className="divide-y rounded-md border">
      {senarai.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <Link
            href={`/api/v1/dokumen/${d.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-2 text-primary hover:underline"
          >
            <FileText className="size-4 shrink-0" />
            <span className="truncate">{d.original_name}</span>
          </Link>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatTarikh(d.created_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}
