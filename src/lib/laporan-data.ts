import { scopedClient } from "@/lib/tenant-client";
import { formatRM, formatTarikhPendek } from "@/lib/format";
import { LABEL_INVOIS, LABEL_MAINTENANCE } from "@/lib/labels";

export type Db = ReturnType<typeof scopedClient>;
export type Skop = string[] | null;
export type Sel = string | number;

export type DataLaporan = {
  tajuk: string[];
  /** Indeks kolum (0-based) yang memegang amaun wang — untuk format RM */
  kolumWang: number[];
  baris: Sel[][];
  ringkasan: { label: string; nilai: string }[];
};

export function julatBulanIni(): { mula: Date; akhir: Date } {
  const d = new Date();
  return {
    mula: new Date(d.getFullYear(), d.getMonth(), 1),
    akhir: new Date(d.getFullYear(), d.getMonth() + 1, 0),
  };
}

/** Laporan sewa: jangkaan / dikutip / tertunggak / bil tertunggak */
export async function dataLaporanRental(
  db: Db,
  skop: Skop,
  { mula, akhir }: { mula: Date; akhir: Date }
): Promise<DataLaporan> {
  const invois = await db.rentInvoice.findMany({
    where: {
      period_start: { gte: mula, lte: akhir },
      ...(skop ? { unit: { property_id: { in: skop } } } : {}),
    },
    include: {
      tenant: { select: { name: true } },
      unit: { select: { unit_no: true, property: { select: { name: true } } } },
    },
    orderBy: [{ period_start: "asc" }, { invoice_no: "asc" }],
  });

  const hariIni = new Date();
  let expected = 0, collected = 0, outstanding = 0, overdue = 0;

  const baris: Sel[][] = invois.map((inv) => {
    const amount = Number(inv.amount);
    const paid = Number(inv.paid_amount);
    const baki = amount - paid;
    const tertunggak =
      inv.status === "OVERDUE" || (inv.status !== "PAID" && new Date(inv.due_date) < hariIni);
    expected += amount;
    collected += paid;
    outstanding += baki;
    if (tertunggak) overdue++;
    return [
      inv.invoice_no,
      `${inv.unit.property.name} ${inv.unit.unit_no}`,
      inv.tenant.name,
      `${formatTarikhPendek(inv.period_start)} – ${formatTarikhPendek(inv.period_end)}`,
      formatTarikhPendek(inv.due_date),
      amount,
      paid,
      baki,
      LABEL_INVOIS[inv.status],
    ];
  });

  return {
    tajuk: [
      "Invois", "Unit", "Penyewa", "Tempoh", "Due",
      "Jangkaan (RM)", "Dikutip (RM)", "Tertunggak (RM)", "Status",
    ],
    kolumWang: [5, 6, 7],
    baris,
    ringkasan: [
      { label: "Jangkaan", nilai: formatRM(expected) },
      { label: "Dikutip", nilai: formatRM(collected) },
      { label: "Tertunggak", nilai: formatRM(outstanding) },
      { label: "Bil Tertunggak", nilai: String(overdue) },
    ],
  };
}

/** Laporan hartanah: occupancy / jangkaan / perbelanjaan / bersih */
export async function dataLaporanHartanah(
  db: Db,
  skop: Skop,
  { mula, akhir }: { mula: Date; akhir: Date }
): Promise<DataLaporan> {
  const hartanah = await db.property.findMany({
    where: skop ? { id: { in: skop } } : {},
    include: {
      units: {
        select: {
          id: true,
          tenancies: { where: { status: "ACTIVE" }, select: { rent_amount: true } },
        },
      },
      expenses: { where: { expense_date: { gte: mula, lte: akhir } }, select: { amount: true } },
    },
    orderBy: { name: "asc" },
  });

  let jumlahUnit = 0, jumlahBerpenghuni = 0, jumlahJangkaan = 0, jumlahPerbelanjaan = 0;

  const baris: Sel[][] = hartanah.map((p) => {
    const unit = p.units.length;
    const berpenghuni = p.units.filter((u) => u.tenancies.length > 0).length;
    const kosong = unit - berpenghuni;
    const kadar = unit ? Math.round((berpenghuni / unit) * 100) : 0;
    const jangkaan = p.units.reduce(
      (s, u) => s + u.tenancies.reduce((t, tn) => t + Number(tn.rent_amount), 0),
      0
    );
    const perbelanjaan = p.expenses.reduce((s, e) => s + Number(e.amount), 0);
    jumlahUnit += unit;
    jumlahBerpenghuni += berpenghuni;
    jumlahJangkaan += jangkaan;
    jumlahPerbelanjaan += perbelanjaan;
    return [p.name, unit, berpenghuni, kosong, `${kadar}%`, jangkaan, perbelanjaan, jangkaan - perbelanjaan];
  });

  return {
    tajuk: [
      "Hartanah", "Unit", "Berpenghuni", "Kosong", "Kadar",
      "Jangkaan (RM)", "Perbelanjaan (RM)", "Bersih (RM)",
    ],
    kolumWang: [5, 6, 7],
    baris,
    ringkasan: [
      { label: "Hartanah", nilai: String(hartanah.length) },
      { label: "Jumlah Unit", nilai: String(jumlahUnit) },
      { label: "Berpenghuni", nilai: String(jumlahBerpenghuni) },
      { label: "Jangkaan", nilai: formatRM(jumlahJangkaan) },
      { label: "Perbelanjaan", nilai: formatRM(jumlahPerbelanjaan) },
    ],
  };
}

/** Laporan penyewa: aktif / tamat hampir / kosong */
export async function dataLaporanPenyewa(db: Db, skop: Skop): Promise<DataLaporan> {
  const penyewa = await db.tenant.findMany({
    where: {
      status: "ACTIVE",
      ...(skop ? { tenancies: { some: { unit: { property_id: { in: skop } } } } } : {}),
    },
    include: {
      tenancies: {
        where: { status: "ACTIVE" },
        include: { unit: { select: { unit_no: true, property: { select: { name: true } } } } },
        orderBy: { start_date: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const hariIni = new Date();
  const TIGA_PULUH = 30 * 24 * 60 * 60 * 1000;
  let aktif = 0, hampir = 0, kosong = 0;

  const baris: Sel[][] = penyewa.map((t) => {
    const tn = t.tenancies[0];
    if (!tn) {
      kosong++;
      return [t.name, "—", "—", "—", "—", "Kosong"];
    }
    const end = tn.end_date ? new Date(tn.end_date) : null;
    let status = "Aktif";
    if (end && end >= hariIni && end.getTime() - hariIni.getTime() <= TIGA_PULUH) {
      status = "Tamat Hampir";
      hampir++;
    } else if (end && end < hariIni) {
      status = "Tamat";
    } else {
      aktif++;
    }
    return [
      t.name,
      `${tn.unit.property.name} ${tn.unit.unit_no}`,
      formatTarikhPendek(tn.start_date),
      tn.end_date ? formatTarikhPendek(tn.end_date) : "—",
      Number(tn.rent_amount),
      status,
    ];
  });

  return {
    tajuk: ["Penyewa", "Unit", "Mula", "Tamat", "Sewa (RM)", "Status"],
    kolumWang: [4],
    baris,
    ringkasan: [
      { label: "Aktif", nilai: String(aktif) },
      { label: "Tamat Hampir", nilai: String(hampir) },
      { label: "Kosong", nilai: String(kosong) },
      { label: "Jumlah Penyewa", nilai: String(penyewa.length) },
    ],
  };
}

/** Laporan maintenance: status + kos */
export async function dataLaporanMaintenance(
  db: Db,
  skop: Skop,
  { mula, akhir }: { mula: Date; akhir: Date }
): Promise<DataLaporan> {
  const aduan = await db.maintenanceRequest.findMany({
    where: {
      created_at: { gte: mula, lte: akhir },
      ...(skop ? { unit: { property_id: { in: skop } } } : {}),
    },
    include: {
      unit: { select: { unit_no: true, property: { select: { name: true } } } },
      tenant: { select: { name: true } },
      expenses: { select: { amount: true } },
    },
    orderBy: { created_at: "desc" },
  });

  let complain = 0, progress = 0, selesai = 0, jumlahKos = 0;

  const baris: Sel[][] = aduan.map((a) => {
    const kos = a.expenses.reduce((s, e) => s + Number(e.amount), 0);
    jumlahKos += kos;
    if (a.status === "COMPLAIN") complain++;
    else if (a.status === "IN_PROGRESS") progress++;
    else selesai++;
    return [
      a.title,
      `${a.unit.property.name} ${a.unit.unit_no}`,
      a.tenant?.name ?? "—",
      LABEL_MAINTENANCE[a.status],
      formatTarikhPendek(a.created_at),
      kos,
    ];
  });

  return {
    tajuk: ["Tajuk", "Unit", "Penyewa", "Status", "Tarikh Lapor", "Kos (RM)"],
    kolumWang: [5],
    baris,
    ringkasan: [
      { label: "Aduan Baru", nilai: String(complain) },
      { label: "Dalam Proses", nilai: String(progress) },
      { label: "Selesai", nilai: String(selesai) },
      { label: "Jumlah Kos", nilai: formatRM(jumlahKos) },
    ],
  };
}
