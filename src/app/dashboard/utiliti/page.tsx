import Link from "next/link";
import { Banknote, CheckCircle2, Clock, FileText, Zap } from "lucide-react";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { formatRM } from "@/lib/format";
import { CartaKutipan, type TitikKutipan } from "@/components/dashboard/carta-kutipan";
import { CartaDonut, HIJAU, MERAH } from "@/components/dashboard/carta-donut";
import { JulatChart } from "@/components/dashboard/julat-chart";
import { selesaikanJulat, senaraiBulan, fmtTarikh } from "@/lib/julat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TambahBilForm } from "./tambah-bil-form";
import { sahkanBilUtility, tolakBilUtility } from "./actions";

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

export default async function UtilitiPage({
  searchParams,
}: {
  searchParams?: Promise<{ julat?: string; jmula?: string; jakhir?: string }>;
}) {
  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);
  const { julat, jmula, jakhir } = (await searchParams) ?? {};
  const jlt = selesaikanJulat(julat, jmula, jakhir);
  // Bil utiliti mesti milik penyewa dalam skop hartanah staf
  const skopBil = skop
    ? { tenant: { tenancies: { some: { unit: { property_id: { in: skop } } } } } }
    : {};

  const [penyewa, bils, dahBayar, belumBayar, bayarMengikutBulan] = await Promise.all([
    db.tenant.findMany({
      where: {
        status: "ACTIVE",
        ...(skop ? { tenancies: { some: { unit: { property_id: { in: skop } } } } } : {}),
      },
      include: {
        tenancies: {
          select: { unit: { select: { unit_no: true, property: { select: { name: true } } } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.utilityBil.findMany({
      where: skopBil,
      include: {
        tenant: { select: { name: true } },
        documents: { where: { category: "UTILITY_BILL" } },
      },
      orderBy: [{ bulan: "desc" }, { created_at: "desc" }],
    }),
    db.utilityBil.aggregate({
      where: { status: "PAID", ...skopBil },
      _sum: { amount: true },
      _count: true,
    }),
    db.utilityBil.aggregate({
      where: { status: { in: ["UNPAID", "PENDING_PROOF"] }, ...skopBil },
      _sum: { amount: true },
      _count: true,
    }),
    db.utilityBil.groupBy({
      by: ["bulan"],
      where: { status: "PAID", ...skopBil },
      _sum: { amount: true },
    }),
  ]);

  const pilihanPenyewa = penyewa.map((p) => ({
    id: p.id,
    label: p.tenancies[0]
      ? `${p.name} — ${p.tenancies[0].unit.property.name} ${p.tenancies[0].unit.unit_no}`
      : p.name,
  }));

  // Kutipan utiliti ikut bulan dalam julat terpilih
  const petaBulan = new Map(bayarMengikutBulan.map((g) => [g.bulan, Number(g._sum.amount ?? 0)]));
  const dataCarta: TitikKutipan[] = senaraiBulan(jlt).map(({ kunci, label }) => ({
    label,
    jumlah: petaBulan.get(kunci) ?? 0,
  }));

  const kad = [
    { label: "Bil Dah Bayar", nilai: String(dahBayar._count), ikon: CheckCircle2 },
    { label: "Bil Belum Bayar", nilai: String(belumBayar._count), ikon: Clock },
    { label: "Jumlah Dah Bayar", nilai: formatRM(dahBayar._sum.amount), ikon: Banknote },
    { label: "Jumlah Belum Bayar", nilai: formatRM(belumBayar._sum.amount), ikon: Zap },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Utiliti</h1>
        <p className="text-sm text-muted-foreground">
          Urus bil air &amp; elektrik penyewa — tambah, assign dan sahkan pembayaran.
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

      {/* Carta + donut */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Analitik</h2>
        <JulatChart julat={julat ?? "6"} mula={fmtTarikh(jlt.mula)} akhir={fmtTarikh(jlt.akhir)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bayaran Utiliti</CardTitle>
          </CardHeader>
          <CardContent>
            <CartaKutipan data={dataCarta} labelTooltip="Bayaran Utiliti" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dah Bayar vs Belum Bayar</CardTitle>
          </CardHeader>
          <CardContent>
            <CartaDonut
              data={[
                { nama: "Dah Bayar", nilai: dahBayar._count, warna: HIJAU },
                { nama: "Belum Bayar", nilai: belumBayar._count, warna: MERAH },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tambah bil */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Tambah Bil Utiliti</CardTitle>
            <CardDescription>Assign bil kepada penyewa. Bil bulan sama tidak boleh berganda.</CardDescription>
          </CardHeader>
          <CardContent>
            <TambahBilForm penyewa={pilihanPenyewa} />
          </CardContent>
        </Card>

        {/* Senarai bil */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Senarai Bil Utiliti ({bils.length})</CardTitle>
            <CardDescription>
              Bil berstatus &quot;Menunggu Pengesahan&quot; perlu disahkan atau ditolak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bils.length === 0 ? (
              <p className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Tiada bil utiliti lagi.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Bulan</th>
                      <th className="px-3 py-2.5 font-medium">Penyewa</th>
                      <th className="px-3 py-2.5 font-medium">Amaun</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5 text-right font-medium">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bils.map((bil) => {
                      const info = STATUS_BIL[bil.status] ?? STATUS_BIL.UNPAID;
                      const bukti = bil.documents[0];
                      return (
                        <tr key={bil.id}>
                          <td className="whitespace-nowrap px-3 py-2.5 font-medium">
                            {formatBulan(bil.bulan)}
                          </td>
                          <td className="px-3 py-2.5">{bil.tenant.name}</td>
                          <td className="whitespace-nowrap px-3 py-2.5">
                            {formatRM(Number(bil.amount))}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant="outline" className={info.kelas}>
                              {info.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-end gap-2">
                              {bukti && (
                                <Button asChild variant="ghost" size="sm">
                                  <Link
                                    href={`/api/v1/dokumen/${bukti.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <FileText className="mr-1.5 size-3.5" />
                                    Bukti
                                  </Link>
                                </Button>
                              )}
                              {bil.status === "PENDING_PROOF" && (
                                <>
                                  <form action={sahkanBilUtility.bind(null, bil.id)}>
                                    <Button type="submit" size="sm">
                                      Sahkan
                                    </Button>
                                  </form>
                                  <form action={tolakBilUtility.bind(null, bil.id)}>
                                    <Button type="submit" size="sm" variant="outline">
                                      Tolak
                                    </Button>
                                  </form>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
