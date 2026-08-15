import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import { requirePenyewa } from "@/lib/sesi";
import { formatRM, formatTarikh } from "@/lib/format";
import { LABEL_INVOIS, LABEL_TENANCY } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const WARNA_INVOIS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700",
  PARTIAL: "bg-purple-500/10 text-purple-700",
  PAID: "bg-emerald-500/10 text-emerald-700",
  OVERDUE: "bg-red-500/10 text-red-700",
  CANCELLED: "bg-zinc-500/10 text-zinc-700",
  WAIVED: "bg-zinc-500/10 text-zinc-700",
};

export default async function PenyewaDashboardPage() {
  const { db, tenantId, user } = await requirePenyewa();

  const tenancyAktif = await db.tenancy.findFirst({
    where: { tenant_id: tenantId, status: "ACTIVE" },
    include: { unit: { include: { property: { select: { name: true } } } } },
  });

  const invois = await db.rentInvoice.findMany({
    where: { tenant_id: tenantId },
    orderBy: { period_start: "desc" },
    take: 5,
  });

  const belumBayar = invois.filter((i) => i.status === "PENDING" || i.status === "OVERDUE" || i.status === "PARTIAL");
  const jumlahTertunggak = belumBayar.reduce((t, i) => t + Number(i.amount) - Number(i.paid_amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Salam, {user.name?.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Berikut status sewaan dan invois anda.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Sewaan Semasa</CardTitle>
          </CardHeader>
          <CardContent>
            {tenancyAktif ? (
              <>
                <p className="text-xl font-semibold">{tenancyAktif.unit.property.name}</p>
                <p className="text-sm text-muted-foreground">Unit {tenancyAktif.unit.unit_no}</p>
                <p className="mt-2 text-sm">
                  Sewa bulanan <span className="font-medium">{formatRM(tenancyAktif.rent_amount)}</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Tiada sewaan aktif.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Jumlah Tertunggak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatRM(jumlahTertunggak)}</p>
            <p className="text-sm text-muted-foreground">{belumBayar.length} invois belum selesai</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Hari Due Sewa</CardTitle>
          </CardHeader>
          <CardContent>
            {tenancyAktif ? (
              <>
                <p className="flex items-center gap-1.5 text-xl font-semibold">
                  <CalendarClock className="size-5 text-muted-foreground" />
                  Setiap {tenancyAktif.rent_due_day} haribulan
                </p>
                <p className="text-sm text-muted-foreground">Bayar sebelum tarikh due untuk elak tertunggak.</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Invois Terkini</CardTitle>
          <Link
            href="/penyewa/invois"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Semua invois
            <ArrowRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {invois.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tiada invois lagi.</p>
          ) : (
            invois.map((i) => (
              <Link
                key={i.id}
                href={`/penyewa/invois/${i.id}`}
                className="flex items-center justify-between gap-3 rounded-md border px-4 py-3 hover:bg-accent"
              >
                <div>
                  <p className="text-sm font-medium">{i.invoice_no}</p>
                  <p className="text-xs text-muted-foreground">
                    Tempoh {formatTarikh(i.period_start)} – {formatTarikh(i.period_end)} • Due{" "}
                    {formatTarikh(i.due_date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatRM(i.amount)}</span>
                  <Badge variant="outline" className={WARNA_INVOIS[i.status]}>
                    {LABEL_INVOIS[i.status]}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
