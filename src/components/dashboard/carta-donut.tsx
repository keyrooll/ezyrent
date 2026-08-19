"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";

const HIJAU = "#4E9D2D";
const OREN = "#F5821F";
const MERAH = "#E5484D";

export type DataDonut = { nama: string; nilai: number; warna: string };

/** Donut: unit disewakan vs dah bayar vs kosong */
export function CartaDonut({ data, labelTengah = "Unit" }: { data: DataDonut[]; labelTengah?: string }) {
  const jumlah = data.reduce((s, d) => s + d.nilai, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        {/* Saiz tetap 208px — elak carta kosong jika pengukuran lebar gagal (HP) */}
        <PieChart width={208} height={208}>
            <Pie
              data={data}
              dataKey="nilai"
              nameKey="nama"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={jumlah > 0 && data.every((d) => d.nilai > 0) ? 2 : 0}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.nama} fill={d.warna} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [String(v), ""]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
            />
        </PieChart>
        {/* Jumlah di tengah donut */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold">{jumlah}</span>
          <span className="text-xs text-muted-foreground">{labelTengah}</span>
        </div>
      </div>

      <ul className="w-full space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.nama} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full" style={{ backgroundColor: d.warna }} />
              {d.nama}
            </span>
            <span className="font-semibold">{d.nilai}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { HIJAU, OREN, MERAH };
