"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatRM } from "@/lib/format";

export type TitikPL = { label: string; pendapatan: number; liabiliti: number };

const HIJAU = "#4E9D2D";
const MERAH = "#E5484D";

/** Carta untung-rugi bulanan — pendapatan vs liabiliti */
export function CartaPL({ data }: { data: TitikPL[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 520, height: 256 }}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            formatter={(v, nama) => [formatRM(Number(v)), String(nama)]}
            cursor={{ fill: "var(--accent)" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="pendapatan" name="Pendapatan" fill={HIJAU} radius={[4, 4, 0, 0]} maxBarSize={20} />
          <Bar dataKey="liabiliti" name="Liabiliti" fill={MERAH} radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
