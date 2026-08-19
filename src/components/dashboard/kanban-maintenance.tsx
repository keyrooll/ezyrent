"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ImageIcon, Building2 } from "lucide-react";
import { ubahStatusAduan } from "@/app/dashboard/maintenance/actions";
import { Badge } from "@/components/ui/badge";

export type KadAduan = {
  id: string;
  tajuk: string;
  hartanah: string;
  gambar?: { id: string; nama: string };
};

const KOLUM = [
  { kod: "COMPLAIN", label: "Aduan Baru", warna: "border-t-red-500", badge: "bg-red-500/10 text-red-700" },
  { kod: "IN_PROGRESS", label: "Dalam Proses", warna: "border-t-amber-500", badge: "bg-amber-500/10 text-amber-700" },
  { kod: "COMPLETED", label: "Selesai", warna: "border-t-emerald-500", badge: "bg-emerald-500/10 text-emerald-700" },
] as const;

type Status = (typeof KOLUM)[number]["kod"];

/**
 * Papan Kanban maintenance — drag & drop HTML5 asli.
 * Kolum disusun kiri ke kanan (scroll mendatar pada skrin sempit).
 * Kad hanya tunjuk maklumat penting (hartanah + kerosakan); klik untuk details.
 *
 * `bolehSeret=false` → paparan sahaja (portal penyewa).
 * `pautanBase` → kad jadi pautan ke halaman detail (abaikan untuk paparan sahaja).
 */
export function KanbanMaintenance({
  data,
  bolehSeret = true,
  pautanBase,
}: {
  data: Record<Status, KadAduan[]>;
  bolehSeret?: boolean;
  pautanBase?: string;
}) {
  const [menyeret, setMenyeret] = useState<string | null>(null);
  const [atasKolom, setAtasKolom] = useState<Status | null>(null);

  /** Pindah aduan ke kolum lain — dipakai drag & drop dan butang pada kad (HP) */
  async function alih(id: string, kolom: Status) {
    await ubahStatusAduan(id, kolom);
    toast.success(`Aduan dipindahkan ke "${KOLUM.find((k) => k.kod === kolom)!.label}"`);
  }

  async function lepas(kolom: Status) {
    setAtasKolom(null);
    const id = menyeret;
    setMenyeret(null);
    if (!id || !bolehSeret) return;
    await alih(id, kolom);
  }

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-2">
      {KOLUM.map((k) => (
        <div
          key={k.kod}
          {...(bolehSeret
            ? {
                onDragOver: (e: React.DragEvent) => {
                  e.preventDefault();
                  setAtasKolom(k.kod);
                },
                onDragLeave: () => setAtasKolom((s) => (s === k.kod ? null : s)),
                onDrop: (e: React.DragEvent) => {
                  e.preventDefault();
                  void lepas(k.kod);
                },
              }
            : {})}
          className={`w-full min-w-72 flex-1 rounded-lg border border-t-4 ${k.warna} bg-muted/30 p-3 transition-colors ${
            atasKolom === k.kod ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold">{k.label}</h3>
            <Badge variant="outline" className={k.badge}>
              {data[k.kod].length}
            </Badge>
          </div>

          <div className="min-h-24 space-y-2">
            {data[k.kod].length === 0 ? (
              <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                {bolehSeret ? "Lepaskan kad di sini" : "Tiada aduan"}
              </p>
            ) : (
              data[k.kod].map((a) => {
                const isi = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Building2 className="size-3 shrink-0" />
                        <span className="truncate">{a.hartanah}</span>
                      </p>
                      <Badge variant="outline" className={`shrink-0 ${k.badge}`}>
                        {k.label}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex items-start justify-between gap-2">
                      <h4 className="line-clamp-2 text-sm font-semibold">{a.tajuk}</h4>
                      {a.gambar && (
                        <span className="shrink-0 text-muted-foreground" title={a.gambar.nama}>
                          <ImageIcon className="size-4" />
                        </span>
                      )}
                    </div>
                  </>
                );
                const kelas = `rounded-md border bg-card p-3 shadow-sm transition-colors ${
                  bolehSeret ? "hover:border-primary/40" : ""
                } ${menyeret === a.id ? "opacity-50" : ""}`;

                return (
                  <div key={a.id} className={kelas}>
                    {pautanBase ? (
                      <Link
                        href={`${pautanBase}/${a.id}`}
                        draggable={bolehSeret}
                        onDragStart={
                          bolehSeret
                            ? (e) => {
                                e.dataTransfer.setData("text/plain", a.id);
                                setMenyeret(a.id);
                              }
                            : undefined
                        }
                        onDragEnd={
                          bolehSeret
                            ? () => {
                                setMenyeret(null);
                                setAtasKolom(null);
                              }
                            : undefined
                        }
                        className={`block ${bolehSeret ? "cursor-grab active:cursor-grabbing" : ""}`}
                      >
                        {isi}
                      </Link>
                    ) : (
                      isi
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
