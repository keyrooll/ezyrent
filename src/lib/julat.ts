export type Julat = { mula: Date; akhir: Date };
export type TitikSiri = { label: string; jumlah: number };

const LABEL_BULAN = new Intl.DateTimeFormat("ms-MY", { month: "short" });

/** Format Date → YYYY-MM-DD (untuk nilai default input tarikh) */
export function fmtTarikh(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Selesaikan pilihan julat carta kepada { mula, akhir }.
 * - "1"  = bulan semasa
 * - "12" = 12 bulan terakhir
 * - "6"  = 6 bulan terakhir (default)
 * - "custom" = guna mulaStr/akhirStr (YYYY-MM-DD)
 */
export function selesaikanJulat(
  julat?: string,
  mulaStr?: string,
  akhirStr?: string,
  sekarang = new Date()
): Julat {
  const sah = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined);

  if (julat === "custom") {
    const m = sah(mulaStr);
    const a = sah(akhirStr);
    if (m && a) {
      return { mula: new Date(`${m}T00:00:00`), akhir: new Date(`${a}T23:59:59.999`) };
    }
  }

  const thn = sekarang.getFullYear();
  const bln = sekarang.getMonth();
  const akhirBulan = new Date(thn, bln + 1, 0, 23, 59, 59, 999);

  if (julat === "1") return { mula: new Date(thn, bln, 1), akhir: akhirBulan };
  if (julat === "12") return { mula: new Date(thn, bln - 11, 1), akhir: akhirBulan };
  // default: 6 bulan
  return { mula: new Date(thn, bln - 5, 1), akhir: akhirBulan };
}

function kunciHari(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function kunciBulan(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Kumpulkan titik (tarikh + jumlah) kepada siri carta.
 * Julat ≤ 45 hari → bucket harian ("5/08"); selain itu → bucket bulanan ("Ogo").
 */
export function bucketSiri(julat: Julat, titik: { tarikh: Date; jumlah: number }[]): TitikSiri[] {
  const hari = Math.round((julat.akhir.getTime() - julat.mula.getTime()) / 86400000);
  const harian = hari <= 45;
  const map = new Map<string, number>();

  if (harian) {
    for (let d = new Date(julat.mula); d <= julat.akhir; d.setDate(d.getDate() + 1)) {
      map.set(kunciHari(d), 0);
    }
    for (const t of titik) {
      const k = kunciHari(t.tarikh);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + t.jumlah);
    }
    return [...map.entries()].map(([k, jumlah]) => {
      const [, m, d] = k.split("-");
      return { label: `${Number(d)}/${Number(m)}`, jumlah };
    });
  }

  let d = new Date(julat.mula.getFullYear(), julat.mula.getMonth(), 1);
  const akhir = new Date(julat.akhir.getFullYear(), julat.akhir.getMonth(), 1);
  while (d <= akhir) {
    map.set(kunciBulan(d), 0);
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  for (const t of titik) {
    const k = kunciBulan(t.tarikh);
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + t.jumlah);
  }
  return [...map.entries()].map(([k, jumlah]) => {
    const [thn, bln] = k.split("-").map(Number);
    return { label: LABEL_BULAN.format(new Date(thn, bln - 1, 1)), jumlah };
  });
}

/** Senarai bulan (YYYY-MM + label) dalam julat — untuk siri bulanan seperti bil utiliti */
export function senaraiBulan(julat: Julat): { kunci: string; label: string }[] {
  const list: { kunci: string; label: string }[] = [];
  let d = new Date(julat.mula.getFullYear(), julat.mula.getMonth(), 1);
  const akhir = new Date(julat.akhir.getFullYear(), julat.akhir.getMonth(), 1);
  while (d <= akhir) {
    list.push({ kunci: kunciBulan(d), label: LABEL_BULAN.format(d) });
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return list;
}
