import ExcelJS from "exceljs";
import type { Sel } from "@/lib/laporan-data";

/** Escape sel CSV (petik, koma, baris baharu) */
function selCsv(v: Sel): string {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Gabung tajuk + baris menjadi satu jadual dan hasilkan CSV (dengan BOM) */
export function keCsv(tajuk: string[], baris: Sel[][]): string {
  const semua = [tajuk, ...baris];
  return "﻿" + semua.map((r) => r.map(selCsv).join(",")).join("\r\n");
}

/** Hasilkan fail .xlsx (header bold, format RM pada kolum wang) */
export async function keXlsx(
  namaSheet: string,
  tajuk: string[],
  baris: Sel[][],
  kolumWang: number[] = []
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(namaSheet.slice(0, 31));
  ws.columns = tajuk.map((t, i) => ({
    header: t,
    key: `c${i}`,
    width: Math.max(t.length + 2, 16),
  }));
  ws.getRow(1).font = { bold: true };

  for (const r of baris) {
    const row = ws.addRow(r);
    for (const k of kolumWang) {
      const sel = row.getCell(k + 1);
      if (typeof sel.value === "number") sel.numFmt = "#,##0.00";
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
