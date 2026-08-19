import { NextRequest } from "next/server";
import { requireLandlord } from "@/lib/sesi";
import { LABEL_INVOIS, type InvoiceStatus } from "@/lib/labels";

export const dynamic = "force-dynamic";

/** Muat turun senarai invois sebagai CSV (scoped kepada landlord semasa) */
export async function GET(req: NextRequest) {
  const { db } = await requireLandlord();

  const status = req.nextUrl.searchParams.get("status") ?? "";
  const mula = req.nextUrl.searchParams.get("mula") ?? "";
  const akhir = req.nextUrl.searchParams.get("akhir") ?? "";

  const sahStatus = (Object.keys(LABEL_INVOIS) as string[]).includes(status);
  const sahMula = /^\d{4}-\d{2}-\d{2}$/.test(mula) ? new Date(`${mula}T00:00:00.000Z`) : null;
  const sahAkhir = /^\d{4}-\d{2}-\d{2}$/.test(akhir) ? new Date(`${akhir}T23:59:59.999Z`) : null;
  const julat: { gte?: Date; lte?: Date } = {};
  if (sahMula) julat.gte = sahMula;
  if (sahAkhir) julat.lte = sahAkhir;

  const senarai = await db.rentInvoice.findMany({
    where: {
      ...(sahStatus ? { status: status as InvoiceStatus } : {}),
      ...(julat.gte || julat.lte ? { due_date: julat } : {}),
    },
    include: {
      tenant: { select: { name: true } },
      unit: { select: { unit_no: true, property: { select: { name: true } } } },
    },
    orderBy: { created_at: "desc" },
  });

  const baris = [
    [
      "No. Invois",
      "Penyewa",
      "Hartanah",
      "Unit",
      "Tempoh Mula",
      "Tempoh Akhir",
      "Due",
      "Amaun (RM)",
      "Dibayar (RM)",
      "Baki (RM)",
      "Status",
    ],
    ...senarai.map((i) => [
      i.invoice_no,
      i.tenant.name,
      i.unit.property.name,
      i.unit.unit_no,
      i.period_start.toISOString().slice(0, 10),
      i.period_end.toISOString().slice(0, 10),
      i.due_date.toISOString().slice(0, 10),
      Number(i.amount).toFixed(2),
      Number(i.paid_amount).toFixed(2),
      (Number(i.amount) - Number(i.paid_amount)).toFixed(2),
      LABEL_INVOIS[i.status],
    ]),
  ];

  const csv = baris.map((b) => b.map(sel).join(",")).join("\r\n");

  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invois-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

/** Escape nilai CSV (petik berganda) */
function sel(nilai: string): string {
  return /[",\r\n]/.test(nilai) ? `"${nilai.replace(/"/g, '""')}"` : nilai;
}
