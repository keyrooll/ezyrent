import Link from "next/link";
import { ArrowRight, CalendarClock, Send } from "lucide-react";
import { requirePenyewa } from "@/lib/sesi";
import { formatRM, formatTarikh } from "@/lib/format";
import { LABEL_INVOIS } from "@/lib/labels";
import { CartaKutipan, type TitikKutipan } from "@/components/dashboard/carta-kutipan";
import { CartaDonut, HIJAU, OREN } from "@/components/dashboard/carta-donut";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const sekarang = new Date();

  const [tenancyAktif, invois, bayaran6Bulan, statInvois, statUtiliti] = await Promise.all([
    db.tenancy.findFirst({
      where: { tenant_id: tenantId, status: "ACTIVE" },
      include: {
        unit: { include: { property: { select: { id: true, name: true, image_path: true } } } },
      },
    }),
    db.rentInvoice.findMany({
      where: { tenant_id: tenantId },
      orderBy: { period_start: "desc" },
      take: 5,
    }),
    db.payment.findMany({
      where: {
        tenant_id: tenantId,
        status: "VERIFIED",
        verified_at: {
          gte: new Date(sekarang.getFullYear(), sekarang.getMonth() - 5, 1),
        },
      },
      select: { amount: true, verified_at: true },
    }),
    db.rentInvoice.aggregate({
      where: { tenant_id: tenantId },
      _sum: { amount: true, paid_amount: true },
    }),
    // Bil utiliti belum selesai (belum bayar atau menunggu pengesahan)
    db.utilityBil.aggregate({
      where: { tenant_id: tenantId, status: { in: ["UNPAID", "PENDING_PROOF"] } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const belumBayar = invois.filter(
    (i) => i.status === "PENDING" || i.status === "OVERDUE" || i.status === "PARTIAL"
  );
  const jumlahTertunggak = belumBayar.reduce(
    (t, i) => t + Number(i.amount) - Number(i.paid_amount),
    0
  );

  // Invois belum selesai paling lama — sasaran butang "Hantar Bayaran"
  const invoisSasaran =
    invois.find((i) => i.status === "PENDING" || i.status === "OVERDUE" || i.status === "PARTIAL") ??
    invois[0];

  // Kumpulkan bayaran VERIFIED ikut bulan (6 bulan terakhir)
  const labelBulan = new Intl.DateTimeFormat("ms-MY", { month: "short" });
  const petaBulan = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(sekarang.getFullYear(), sekarang.getMonth() - i, 1);
    petaBulan.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const p of bayaran6Bulan) {
    if (!p.verified_at) continue;
    const kunci = `${p.verified_at.getFullYear()}-${String(p.verified_at.getMonth() + 1).padStart(2, "0")}`;
    if (petaBulan.has(kunci)) petaBulan.set(kunci, (petaBulan.get(kunci) ?? 0) + Number(p.amount));
  }
  const dataCarta: TitikKutipan[] = [...petaBulan.entries()].map(([kunci, jumlah]) => {
    const [tahun, bulan] = kunci.split("-").map(Number);
    return { label: labelBulan.format(new Date(tahun, bulan - 1, 1)), jumlah };
  });

  const jumlahSemua = Number(statInvois._sum.amount ?? 0);
  const jumlahDahBayar = Number(statInvois._sum.paid_amount ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Salam, {user.name?.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">Berikut status sewaan dan invois anda.</p>
        </div>
        {invoisSasaran && (
          <Button asChild>
            <Link href={`/penyewa/invois/${invoisSasaran.id}`}>
              <Send className="mr-2 size-4" />
              Hantar Bayaran
            </Link>
          </Button>
        )}
      </div>

      {/* Gambar hartanah sewaan */}
      {tenancyAktif?.unit.property.image_path && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/v1/hartanah/gambar/${tenancyAktif.unit.property.id}`}
          alt={tenancyAktif.unit.property.name}
          className="max-h-64 w-full rounded-lg border object-cover"
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bil Utiliti Belum Selesai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatRM(Number(statUtiliti._sum.amount ?? 0))}</p>
            <p className="text-sm text-muted-foreground">
              {statUtiliti._count} bil — bayar &amp; hantar bukti di tab{" "}
              <Link href="/penyewa/dokumen" className="text-primary hover:underline">
                Dokumen
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Carta bayaran */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bayaran 6 Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <CartaKutipan data={dataCarta} labelTooltip="Bayaran" />
          </CardContent>
        </Card>

        {/* Donut dah bayar vs belum */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dah Bayar vs Belum Bayar</CardTitle>
          </CardHeader>
          <CardContent>
            <CartaDonut
              labelTengah="RM"
              data={[
                { nama: "Dah Bayar", nilai: jumlahDahBayar, warna: HIJAU },
                { nama: "Belum Bayar", nilai: Math.max(0, jumlahSemua - jumlahDahBayar), warna: OREN },
              ]}
            />
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
