"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { tambahExpense, type HasilPerbelanjaan } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LABEL_EXPENSE } from "@/lib/labels";

const awalan: HasilPerbelanjaan = {};

const KELAS_SELECT =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

type Pilihan = { id: string; label: string };

/** Borang tambah perbelanjaan — hartanah wajib, unit & aduan optional */
export function ExpenseForm({
  hartanah,
  unit,
  aduan,
}: {
  hartanah: Pilihan[];
  unit: Pilihan[];
  aduan: Pilihan[];
}) {
  const [hasil, tindakan, menunggu] = useActionState(tambahExpense, awalan);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) {
      toast.success("Perbelanjaan ditambah");
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
        <Label htmlFor="propertyId">Hartanah</Label>
        <select
          id="propertyId"
          name="propertyId"
          className={KELAS_SELECT}
          required
          disabled={hartanah.length === 0}
        >
          {hartanah.length === 0 ? (
            <option value="">Tiada hartanah</option>
          ) : (
            hartanah.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))
          )}
        </select>
        {hasil?.medan?.propertyId && (
          <p className="text-xs text-destructive">{hasil.medan.propertyId}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitId">Unit (pilihan)</Label>
          <select id="unitId" name="unitId" className={KELAS_SELECT} defaultValue="">
            <option value="">— Tiada —</option>
            {unit.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <select id="category" name="category" className={KELAS_SELECT} required>
            {Object.entries(LABEL_EXPENSE).map(([kod, label]) => (
              <option key={kod} value={kod}>
                {label}
              </option>
            ))}
          </select>
          {hasil?.medan?.category && (
            <p className="text-xs text-destructive">{hasil.medan.category}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maintenanceRequestId">Aduan Maintenance (pilihan)</Label>
        <select id="maintenanceRequestId" name="maintenanceRequestId" className={KELAS_SELECT} defaultValue="">
          <option value="">— Tiada —</option>
          {aduan.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Keterangan</Label>
        <Input id="description" name="description" placeholder="cth: Baiki paip sinki unit A-01-01" required />
        {hasil?.medan?.description && (
          <p className="text-xs text-destructive">{hasil.medan.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amaun (RM)</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
          {hasil?.medan?.amount && (
            <p className="text-xs text-destructive">{hasil.medan.amount}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense_date">Tarikh</Label>
          <Input id="expense_date" name="expense_date" type="date" required />
          {hasil?.medan?.expense_date && (
            <p className="text-xs text-destructive">{hasil.medan.expense_date}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor">Vendor (pilihan)</Label>
        <Input id="vendor" name="vendor" placeholder="cth: Juruteknik Ali Sdn Bhd" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resit">Resit (pilihan)</Label>
        <Input id="resit" name="resit" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
      </div>

      <Button type="submit" disabled={menunggu || hartanah.length === 0}>
        <Plus className="mr-2 size-4" />
        {menunggu ? "Menambah..." : "Tambah Perbelanjaan"}
      </Button>
    </form>
  );
}
