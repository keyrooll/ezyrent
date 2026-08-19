"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { tambahBilUnit, type HasilBilUnit } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const awalan: HasilBilUnit = {};

/** Borang tambah bil utiliti untuk unit — tenant sedia ada dihantar tersembunyi */
export function BilUnitForm({ unitId, tenantId }: { unitId: string; tenantId: string }) {
  const [hasil, tindakan, menunggu] = useActionState(tambahBilUnit, awalan);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) {
      toast.success("Bil utiliti ditambah");
      ref.current?.reset();
    }
  }, [hasil, menunggu]);

  return (
    <form ref={ref} action={tindakan} className="space-y-3">
      {hasil?.ralat && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {hasil.ralat}
        </p>
      )}

      <input type="hidden" name="unitId" value={unitId} />
      <input type="hidden" name="tenantId" value={tenantId} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bulan">Bulan</Label>
          <Input id="bulan" name="bulan" type="month" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amaun">Amaun (RM)</Label>
          <Input id="amaun" name="amaun" type="number" step="0.01" min="0.01" placeholder="0.00" required />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={menunggu}>
        <Plus className="mr-1.5 size-4" />
        {menunggu ? "Menambah..." : "Tambah Bil"}
      </Button>
    </form>
  );
}
