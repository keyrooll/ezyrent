import Link from "next/link";
import { Download } from "lucide-react";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { formatRM } from "@/lib/format";
import { LABEL_EXPENSE } from "@/lib/labels";
import {
  dataLaporanRental,
  dataLaporanHartanah,
  dataLaporanPenyewa,
  dataLaporanMaintenance,
  julatBulanIni,
  type DataLaporan,
  type Sel,
} from "@/lib/laporan-data";
import { CartaKutipan, type TitikKutipan } from "@/components/dashboard/carta-kutipan";
import { CartaDonut, type DataDonut } from "@/components/dashboard/carta-donut";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const TAB = [
  { kod: "rental", label: "Sewa" },
  { kod: "hartanah", label: "Hartanah" },
  { kod: "penyewa", label: "Penyewa" },
  { kod: "maintenance", label: "Maintenance" },
] as const;
type KodTab = (typeof TAB)[number]["kod"];

function fmtYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nilaiSel(v: Sel, kolom: number, kolumWang: number[]): string {
  return typeof v === "number" && kolumWang.includes(kolom) ? formatRM(v) : String(v);
}

export default async function LaporanPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; mula?: string; akhir?: string }>;
}) {
  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);
  const { tab, mula: mulaParam, akhir: akhirParam } = (await searchParams) ?? {};

  const tabSah = (TAB.map((t) => t.kod) as string[]).includes(tab ?? "");
  const kod: KodTab = tabSah ? (tab as KodTab) : "rental";

  const { mula: defMula, akhir: defAkhir } = julatBulanIni();
  const mulaStr = /^\d{4}-\d{2}-\d{2}$/.test(mulaParam ?? "") ? mulaParam! : fmtYMD(defMula);
  const akhirStr = /^\d{4}-\d{2}-\d{2}$/.test(akhirParam ?? "") ? akhirParam! : fmtYMD(defAkhir);
  const mula = new Date(`${mulaStr}T00:00:00.000Z`);
  const akhir = new Date(`${akhirStr}T23:59:59.999Z`);

  let data: DataLaporan;
  switch (kod) {
    case "rental":
      data = await dataLaporanRental(db, skop, { mula, akhir });
      break;
    case "hartanah":
      data = await dataLaporanHartanah(db, skop, { mula, akhir });
      break;
    case "penyewa":
      data = await dataLaporanPenyewa(db, skop);
      break;
    case "maintenance":
      data = await dataLaporanMaintenance(db, skop, { mula, akhir });
      break;
  }

  const gunaTarikh = kod !== "penyewa";
  const pautan = (format: "csv" | "xlsx") =>
    `/api/v1/laporan/${kod}?format=${format}&mula=${mulaStr}&akhir=${akhirStr}`;

  // Analitik sentiasa dipapar: kutipan sewa 6 bulan + perbelanjaan ikut kategori
  const sekarang = new Date();
  const enamBulanLalu = new Date(sekarang.getFullYear(), sekarang.getMonth() - 5, 1);
  const [invois6Bulan, expenseGroup] = await Promise.all([
    db.rentInvoice.findMany({
      where: {
        period_start: { gte: enamBulanLalu },
        ...(skop ? { unit: { property_id: { in: skop } } } : {}),
      },
      select: { period_start: true, paid_amount: true },
    }),
    db.expense.groupBy({
      by: ["category"],
      where: skop ? { property_id: { in: skop } } : {},
      _sum: { amount: true },
    }),
  ]);

  const labelBulan = new Intl.DateTimeFormat("ms-MY", { month: "short" });
  const petaBulan = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(sekarang.getFullYear(), sekarang.getMonth() - i, 1);
    petaBulan.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const inv of invois6Bulan) {
    const kunci = `${inv.period_start.getFullYear()}-${String(inv.period_start.getMonth() + 1).padStart(2, "0")}`;
    if (petaBulan.has(kunci)) {
      petaBulan.set(kunci, (petaBulan.get(kunci) ?? 0) + Number(inv.paid_amount));
    }
  }
  const dataCarta: TitikKutipan[] = [...petaBulan.entries()].map(([kunci, jumlah]) => {
    const [thn, bln] = kunci.split("-").map(Number);
    return { bulan: labelBulan.format(new Date(thn, bln - 1, 1)), jumlah };
  });

  const PALET = ["#4E9D2D", "#F5821F", "#E5484D", "#2D7FF9", "#8B5CF6", "#EC4899", "#64748B"];
  const dataDonut: DataDonut[] = expenseGroup.map((g, i) => ({
    nama: LABEL_EXPENSE[g.category],
    nilai: Math.round(Number(g._sum.amount ?? 0)),
    warna: PALET[i % PALET.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Laporan</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan prestasi hartanah — muat turun sebagai CSV atau Excel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={pautan("csv")}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Download className="size-4" />
            CSV
          </Link>
          <Link
            href={pautan("xlsx")}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="size-4" />
            Excel
          </Link>
        </div>
      </div>

      {/* Tab */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border p-1">
        {TAB.map((t) => {
          const aktif = t.kod === kod;
          return (
            <Link
              key={t.kod}
              href={`/dashboard/laporan?tab=${t.kod}&mula=${mulaStr}&akhir=${akhirStr}`}
              className={
                aktif
                  ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                  : "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Penapis tarikh */}
      {gunaTarikh && (
        <form method="GET" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="tab" value={kod} />
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="mula">
              Mula
            </label>
            <input
              id="mula"
              name="mula"
              type="date"
              defaultValue={mulaStr}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="akhir">
              Akhir
            </label>
            <input
              id="akhir"
              name="akhir"
              type="date"
              defaultValue={akhirStr}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Tapis
          </button>
        </form>
      )}

      {/* Ringkasan */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.ringkasan.map((r) => (
          <Card key={r.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{r.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{r.nilai}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analitik — graph + donut dalam satu baris */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kutipan Sewa 6 Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <CartaKutipan data={dataCarta} labelTooltip="Kutipan Sewa" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Perbelanjaan Mengikut Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <CartaDonut data={dataDonut} labelTengah="Jumlah (RM)" />
          </CardContent>
        </Card>
      </div>

      {/* Jadual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{TAB.find((t) => t.kod === kod)?.label} — {data.baris.length} rekod</CardTitle>
        </CardHeader>
        <CardContent>
          {data.baris.length === 0 ? (
            <p className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              Tiada data untuk julat tarikh ini.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {data.tajuk.map((t, i) => (
                      <TableHead key={i} className={i === 0 ? "" : undefined}>
                        {t}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.baris.map((b, i) => (
                    <TableRow key={i}>
                      {b.map((sel, j) => (
                        <TableCell
                          key={j}
                          className={
                            data.kolumWang.includes(j) ? "whitespace-nowrap text-right" : undefined
                          }
                        >
                          {nilaiSel(sel, j, data.kolumWang)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
