"use client";

import { useState } from "react";

const PILIHAN = [
  { nilai: "1", label: "1 Bulan" },
  { nilai: "6", label: "6 Bulan" },
  { nilai: "12", label: "12 Bulan" },
  { nilai: "custom", label: "Custom" },
];

/**
 * Pemilih julat untuk carta — borang GET yang auto-hantar bila pilihan berubah.
 * `hidden` untuk kekalkan query param lain (cth tab pada halaman laporan).
 * Nama param: julat / jmula / jakhir (berasingan dari filter jadual).
 */
export function JulatChart({
  julat = "6",
  mula,
  akhir,
  hidden = [],
}: {
  julat?: string;
  mula?: string;
  akhir?: string;
  hidden?: { name: string; value: string }[];
}) {
  const [nilai, setNilai] = useState(julat);

  return (
    <form method="GET" className="flex flex-wrap items-center gap-2">
      {hidden.map((h) => (
        <input key={h.name} type="hidden" name={h.name} value={h.value} />
      ))}

      <select
        name="julat"
        value={nilai}
        onChange={(e) => {
          setNilai(e.target.value);
          if (e.target.value !== "custom") e.currentTarget.form?.requestSubmit();
        }}
        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {PILIHAN.map((p) => (
          <option key={p.nilai} value={p.nilai}>
            {p.label}
          </option>
        ))}
      </select>

      {nilai === "custom" && (
        <>
          <input
            type="date"
            name="jmula"
            defaultValue={mula}
            className="h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="date"
            name="jakhir"
            defaultValue={akhir}
            className="h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Guna
          </button>
        </>
      )}
    </form>
  );
}
