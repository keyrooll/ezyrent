import { NextRequest } from "next/server";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import {
  dataLaporanRental,
  dataLaporanHartanah,
  dataLaporanPenyewa,
  dataLaporanMaintenance,
  julatBulanIni,
  type DataLaporan,
} from "@/lib/laporan-data";
import { keCsv, keXlsx } from "@/lib/export";

export const dynamic = "force-dynamic";

const JENIS = ["rental", "hartanah", "penyewa", "maintenance"] as const;
type Jenis = (typeof JENIS)[number];

const NAMA: Record<Jenis, string> = {
  rental: "Laporan Sewa",
  hartanah: "Laporan Hartanah",
  penyewa: "Laporan Penyewa",
  maintenance: "Laporan Maintenance",
};

function parseTarikh(v: string | null, akhirHari: boolean): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v ?? "")) return null;
  return new Date(`${v}${akhirHari ? "T23:59:59.999Z" : "T00:00:00.000Z"}`);
}

/** Muat turun laporan sebagai CSV atau .xlsx (scoped kepada landlord/staf semasa) */
export async function GET(req: NextRequest, { params }: { params: Promise<{ jenis: string }> }) {
  const { jenis } = await params;
  if (!JENIS.includes(jenis as Jenis)) {
    return new Response("Jenis laporan tidak sah.", { status: 400 });
  }
  const j = jenis as Jenis;

  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);

  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") === "xlsx" ? "xlsx" : "csv";
  const { mula: mulaDefault, akhir: akhirDefault } = julatBulanIni();
  const mula = parseTarikh(sp.get("mula"), false) ?? mulaDefault;
  const akhir = parseTarikh(sp.get("akhir"), true) ?? akhirDefault;

  let data: DataLaporan;
  switch (j) {
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

  const namaFail = `${j}-${new Date().toISOString().slice(0, 10)}`;

  if (format === "xlsx") {
    const buf = await keXlsx(NAMA[j], data.tajuk, data.baris, data.kolumWang);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${namaFail}.xlsx"`,
      },
    });
  }

  const csv = keCsv(data.tajuk, data.baris);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${namaFail}.csv"`,
    },
  });
}
