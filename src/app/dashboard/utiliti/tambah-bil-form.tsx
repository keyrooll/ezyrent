"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { tambahBilUtility, type HasilUtiliti } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const awalan: HasilUtiliti = {};

/** Borang tambah bil utiliti — assign kepada penyewa dalam skop */
export function TambahBilForm({ penyewa }: { penyewa: { id: string; label: string }[] }) {
  const [hasil, tindakan, menunggu] = useActionState(tambahBilUtility, awalan);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) {
      toast.success("Bil utiliti ditambah");
      ref.current?.reset();
    }
  }, [hasil, menunggu]);

  return (
    <form ref={ref} action={tindakan} className="space-y-4">
      {hasil?.ralat && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {hasil.ralat}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="tenantId">Penyewa</Label>
        <select
          id="tenantId"
          name="tenantId"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          required
          disabled={penyewa.length === 0}
        >
          {penyewa.length === 0 ? (
            <option value="">Tiada penyewa aktif</option>
          ) : (
            penyewa.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bulan">Bulan</Label>
          <Input id="bulan" name="bulan" type="month" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amaun">Amaun (RM)</Label>
          <Input id="amaun" name="amaun" type="number" step="0.01" min="0.01" placeholder="0.00" required />
        </div>
      </div>

      <Button type="submit" disabled={menunggu || penyewa.length === 0}>
        <Plus className="mr-2 size-4" />
        {menunggu ? "Menambah..." : "Tambah Bil"}
      </Button>
    </form>
  );
}
