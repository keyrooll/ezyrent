import Link from "next/link";
import { Building2, DoorOpen, Users, Wallet, Clock } from "lucide-react";
import { requireLandlord } from "@/lib/sesi";
import { formatRM, formatTarikhPendek } from "@/lib/format";
import { CartaKutipan, type TitikKutipan } from "@/components/dashboard/carta-kutipan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { db } = await requireLandlord();

  const [bilHartanah, bilUnit, bilKosong, bilPenyewa, statInvois, kutipanBulan, menungguSah, kutipan6Bulan] =
    await Promise.all([
      db.property.count(),
      db.unit.count(),
      db.unit.count({ where: { status: "VACANT" } }),
      db.tenant.count({ where: { status: "ACTIVE" } }),
      db.rentInvoice.aggregate({
        where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        _count: true,
        _sum: { amount: true, paid_amount: true },
      }),
      db.payment.aggregate({
        where: {
          status: "VERIFIED",
          verified_at: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { amount: true },
      }),
      db.payment.findMany({
        where: { status: "PENDING" },
        include: { tenant: { select: { name: true } }, invoice: { select: { invoice_no: true } } },
        orderBy: { created_at: "desc" },
        take: 5,
      }),
      db.payment.findMany({
        where: {
          status: "VERIFIED",
          verified_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
          },
        },
        select: { amount: true, verified_at: true },
      }),
    ]);

  const belumTerima = Number(statInvois._sum.amount ?? 0) - Number(statInvois._sum.paid_amount ?? 0);

  // Kumpulkan kutipan VERIFIED ikut bulan (6 bulan terakhir)
  const labelBulan = new Intl.DateTimeFormat("ms-MY", { month: "short" });
  const petaBulan = new Map<string, number>();
  const sekarang = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(sekarang.getFullYear(), sekarang.getMonth() - i, 1);
    petaBulan.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const p of kutipan6Bulan) {
    if (!p.verified_at) continue;
    const kunci = `${p.verified_at.getFullYear()}-${String(p.verified_at.getMonth() + 1).padStart(2, "0")}`;
    if (petaBulan.has(kunci)) petaBulan.set(kunci, (petaBulan.get(kunci) ?? 0) + Number(p.amount));
  }
  const dataCarta: TitikKutipan[] = [...petaBulan.entries()].map(([kunci, jumlah]) => {
    const [tahun, bulan] = kunci.split("-").map(Number);
    return { bulan: labelBulan.format(new Date(tahun, bulan - 1, 1)), jumlah };
  });

  const kad = [
    { label: "Hartanah", nilai: String(bilHartanah), ikon: Building2 },
    { label: "Unit", nilai: `${bilUnit} (${bilKosong} kosong)`, ikon: DoorOpen },
    { label: "Penyewa Aktif", nilai: String(bilPenyewa), ikon: Users },
    { label: "Sewa Belum Diterima", nilai: formatRM(belumTerima), ikon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Papan Pemuka</h1>
        <p className="text-sm text-muted-foreground">
          Kutipan bulan ini: <span className="font-medium text-foreground">{formatRM(kutipanBulan._sum.amount)}</span>
        </p>
      </div>

      {/* Kad KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kad.map(({ label, nilai, ikon: Ikon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Ikon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{nilai}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Carta kutipan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kutipan Sewa 6 Bulan</CardTitle>
        </CardHeader>
        <CardContent>
          <CartaKutipan data={dataCarta} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Menunggu pengesahan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Pembayaran Menunggu Pengesahan</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/pembayaran">Lihat semua</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {menungguSah.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tiada pembayaran menunggu pengesahan.</p>
            ) : (
              <ul className="divide-y">
                {menungguSah.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{p.tenant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.invoice.invoice_no} • {formatTarikhPendek(p.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-amber-600">
                        <Clock className="mr-1 size-3" />
                        Menunggu
                      </Badge>
                      <span className="text-sm font-semibold">{formatRM(p.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Invois belum bayar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Invois Belum Selesai</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/invois">Lihat semua</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bilangan</p>
                <p className="text-2xl font-semibold">{statInvois._count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jumlah Baki</p>
                <p className="text-2xl font-semibold">{formatRM(belumTerima)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
