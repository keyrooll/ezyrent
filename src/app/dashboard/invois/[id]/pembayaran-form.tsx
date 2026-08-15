"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { rekodPembayaran, type HasilPembayaran } from "../actions";
import { LABEL_KAEDAH } from "@/lib/labels";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const awalan: HasilPembayaran = {};

export function PembayaranForm({ invoiceId, baki }: { invoiceId: string; baki: number }) {
  const router = useRouter();
  const borang = useRef<HTMLFormElement>(null);
  const [hasil, tindakan, menunggu] = useActionState(rekodPembayaran, awalan);

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) {
      toast.success("Pembayaran direkodkan — menunggu pengesahan");
      borang.current?.reset();
      router.refresh();
    }
  }, [hasil, menunggu, router]);

  if (baki <= 0) return null;

  return (
    <form ref={borang} action={tindakan} className="space-y-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />

      <div className="space-y-2">
        <Label htmlFor="amount">Amaun Dibayar (RM)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          max={baki}
          defaultValue={baki}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">Kaedah</Label>
        <select
          id="method"
          name="method"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          defaultValue="BANK_TRANSFER"
        >
          {Object.entries(LABEL_KAEDAH).map(([nilai, label]) => (
            <option key={nilai} value={nilai}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rujukan">No. Rujukan (pilihan)</Label>
        <Input id="rujukan" name="rujukan" placeholder="cth: TRF20260810" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bukti">Bukti Bayaran (pilihan, maks 5MB)</Label>
        <Input id="bukti" name="bukti" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
      </div>

      {hasil?.ralat && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{hasil.ralat}</p>}

      <Button type="submit" disabled={menunggu}>
        {menunggu ? "Merekod..." : "Rekod Pembayaran"}
      </Button>
    </form>
  );
}
