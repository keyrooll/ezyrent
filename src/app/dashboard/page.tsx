import Link from "next/link";
import { Building2, DoorOpen, Home, CircleDashed, Users, Wallet, Banknote, Clock, Zap } from "lucide-react";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { formatRM, formatTarikhPendek } from "@/lib/format";
import { CartaKutipan, type TitikKutipan } from "@/components/dashboard/carta-kutipan";
import { CartaDonut, HIJAU, OREN, MERAH } from "@/components/dashboard/carta-donut";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);
  const skopHartanah = skop ? { unit: { property_id: { in: skop } } } : {};
  const sekarang = new Date();

  const [
    bilHartanah,
    bilUnit,
    bilKosong,
    bilDisewakan,
    bilDahBayar,
    bilPenyewa,
    statInvois,
    kutipanBulan,
    menungguSah,
    kutipan6Bulan,
    statUtiliti,
    bilDahDue,
  ] = await Promise.all([
      db.property.count({ where: skop ? { id: { in: skop } } : {} }),
      db.unit.count({ where: skop ? { property_id: { in: skop } } : {} }),
      db.unit.count({ where: { status: "VACANT", ...(skop ? { property_id: { in: skop } } : {}) } }),
      db.unit.count({ where: { status: "OCCUPIED", ...(skop ? { property_id: { in: skop } } : {}) } }),
      // Unit yang invois bulan semasa sudah PAID
      db.rentInvoice.count({
        where: {
          status: "PAID",
          period_start: { lte: sekarang },
          period_end: { gte: sekarang },
          ...skopHartanah,
        },
      }),
      db.tenant.count({
        where: {
          status: "ACTIVE",
          ...(skop ? { tenancies: { some: { unit: { property_id: { in: skop } } } } } : {}),
        },
      }),
      db.rentInvoice.aggregate({
        where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] }, ...skopHartanah },
        _count: true,
        _sum: { amount: true, paid_amount: true },
      }),
      db.payment.aggregate({
        where: {
          status: "VERIFIED",
          verified_at: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          ...(skop ? { invoice: { unit: { property_id: { in: skop } } } } : {}),
        },
        _sum: { amount: true },
      }),
      db.payment.findMany({
        where: {
          status: "PENDING",
          ...(skop ? { invoice: { unit: { property_id: { in: skop } } } } : {}),
        },
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
          ...(skop ? { invoice: { unit: { property_id: { in: skop } } } } : {}),
        },
        select: { amount: true, verified_at: true },
      }),
      // Bil utiliti belum selesai (belum bayar / menunggu pengesahan)
      db.utilityBil.aggregate({
        where: {
          status: { in: ["UNPAID", "PENDING_PROOF"] },
          ...(skop ? { tenant: { tenancies: { some: { unit: { property_id: { in: skop } } } } } } : {}),
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Unit dengan invois dah due (merah dalam donut) — kira unit unik
      db.rentInvoice.groupBy({
        by: ["unit_id"],
        where: { status: "OVERDUE", ...skopHartanah },
      }),
    ]);

  const belumTerima = Number(statInvois._sum.amount ?? 0) - Number(statInvois._sum.paid_amount ?? 0);

  // Kumpulkan kutipan VERIFIED ikut bulan (6 bulan terakhir)
  const labelBulan = new Intl.DateTimeFormat("ms-MY", { month: "short" });
  const petaBulan = new Map<string, number>();
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
    { label: "Unit", nilai: String(bilUnit), ikon: DoorOpen },
    { label: "Unit Disewakan", nilai: String(bilDisewakan), ikon: Home },
    { label: "Unit Kosong", nilai: String(bilKosong), ikon: CircleDashed },
    { label: "Penyewa Aktif", nilai: String(bilPenyewa), ikon: Users },
    { label: "Sewa Belum Diterima", nilai: formatRM(belumTerima), ikon: Wallet },
    { label: "Kutipan Bulan Ini", nilai: formatRM(kutipanBulan._sum.amount), ikon: Banknote },
    { label: "Menunggu Pengesahan", nilai: String(menungguSah.length), ikon: Clock },
    { label: "Bil Utiliti Belum Selesai", nilai: formatRM(statUtiliti._sum.amount), ikon: Zap },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Gambaran keseluruhan hartanah dan kutipan sewa anda.
        </p>
      </div>

      {/* Kad KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {kad.map(({ label, nilai, ikon: Ikon }) => (
          <Card key={label} className="px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
              <Ikon className="size-3.5 shrink-0 text-muted-foreground" />
            </div>
            <p className="mt-1 text-lg font-semibold tracking-tight">{nilai}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Carta kutipan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kutipan Sewa 6 Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <CartaKutipan data={dataCarta} />
          </CardContent>
        </Card>

        {/* Donut disewakan vs dah bayar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unit Disewakan vs Dah Bayar</CardTitle>
          </CardHeader>
          <CardContent>
            <CartaDonut
              data={[
                { nama: "Disewakan", nilai: bilDisewakan, warna: OREN },
                { nama: "Dah Bayar", nilai: bilDahBayar, warna: HIJAU },
                { nama: "Dah Due", nilai: bilDahDue.length, warna: MERAH },
                { nama: "Kosong", nilai: bilKosong, warna: "#A1A1AA" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

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
