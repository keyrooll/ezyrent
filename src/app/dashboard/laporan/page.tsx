import Link from "next/link";
import { Download } from "lucide-react";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { formatRM } from "@/lib/format";
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
import { JulatChart } from "@/components/dashboard/julat-chart";
import { selesaikanJulat, bucketSiri, fmtTarikh } from "@/lib/julat";
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
  searchParams?: Promise<{ tab?: string; mula?: string; akhir?: string; julat?: string; jmula?: string; jakhir?: string }>;
}) {
  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);
  const { tab, mula: mulaParam, akhir: akhirParam, julat, jmula, jakhir } = (await searchParams) ?? {};
  const jlt = selesaikanJulat(julat, jmula, jakhir);

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

  // Analitik: kutipan sewa dalam julat terpilih
  const invois6Bulan = await db.rentInvoice.findMany({
    where: {
      period_start: { gte: jlt.mula, lte: jlt.akhir },
      ...(skop ? { unit: { property_id: { in: skop } } } : {}),
    },
    select: { period_start: true, paid_amount: true },
  });

  const dataCarta: TitikKutipan[] = bucketSiri(
    jlt,
    invois6Bulan.map((inv) => ({ tarikh: inv.period_start, jumlah: Number(inv.paid_amount) }))
  );

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

      {/* Analitik — kutipan sewa */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Analitik</h2>
        <JulatChart
          julat={julat ?? "6"}
          mula={fmtTarikh(jlt.mula)}
          akhir={fmtTarikh(jlt.akhir)}
          hidden={[{ name: "tab", value: kod }]}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kutipan Sewa</CardTitle>
        </CardHeader>
        <CardContent>
          <CartaKutipan data={dataCarta} labelTooltip="Kutipan Sewa" />
        </CardContent>
      </Card>

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
