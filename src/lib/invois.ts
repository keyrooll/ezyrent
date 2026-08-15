import { prisma } from "@/lib/prisma";

/**
 * Jana invois sewa bulanan untuk semua tenancy ACTIVE.
 *
 * Idempotent: unique index [tenancy_id, period_start] menghalang invois
 * berganda — panggilan berulang (cron, butang manual) selamat.
 */
export async function janaInvoisBulanan(sekarang = new Date()): Promise<number> {
  // Guna UTC supaya konsisten dengan data seed — idempotensi [tenancy, period]
  // bergantung pada nilai period_start yang sama
  const tahun = sekarang.getUTCFullYear();
  const bulan = sekarang.getUTCMonth();
  const periodStart = new Date(Date.UTC(tahun, bulan, 1));
  const periodEnd = new Date(Date.UTC(tahun, bulan + 1, 0)); // hari terakhir bulan

  const tenancies = await prisma.tenancy.findMany({
    where: {
      status: "ACTIVE",
      start_date: { lte: periodEnd },
      OR: [{ end_date: null }, { end_date: { gte: periodStart } }],
    },
  });

  let dicipta = 0;

  for (const t of tenancies) {
    // Hari due: rent_due_day bulan semasa, clamp ke akhir bulan
    const hariDue = Math.min(t.rent_due_day, periodEnd.getUTCDate());
    const dueDate = new Date(Date.UTC(tahun, bulan, hariDue));

    try {
      const no = await noInvoisSeterusnya(t.landlord_id, tahun);
      await prisma.rentInvoice.create({
        data: {
          landlord_id: t.landlord_id,
          tenancy_id: t.id,
          unit_id: t.unit_id,
          tenant_id: t.tenant_id,
          invoice_no: no,
          period_start: periodStart,
          period_end: periodEnd,
          due_date: dueDate,
          amount: t.rent_amount, // snapshot dari tenancy — invariant M1
        },
      });
      dicipta++;
    } catch (e) {
      // P2002: invois untuk [tenancy, period] sudah wujud — abaikan
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }

  return dicipta;
}

/** No. invois berjujukan per landlord per tahun: INV-2026-0001 */
async function noInvoisSeterusnya(landlordId: string, tahun: number): Promise<string> {
  const prefix = `INV-${tahun}-`;
  const terkini = await prisma.rentInvoice.findFirst({
    where: { landlord_id: landlordId, invoice_no: { startsWith: prefix } },
    orderBy: { invoice_no: "desc" },
    select: { invoice_no: true },
  });
  const seterusnya = terkini ? parseInt(terkini.invoice_no.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seterusnya).padStart(4, "0")}`;
}

/** Tandakan invois PENDING yang lepas due_date sebagai OVERDUE */
export async function prosesOverdue(sekarang = new Date()): Promise<number> {
  const hasil = await prisma.rentInvoice.updateMany({
    where: { status: "PENDING", due_date: { lt: sekarang } },
    data: { status: "OVERDUE" },
  });
  return hasil.count;
}
