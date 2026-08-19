"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { muatNaikDokumenPenyewa, type HasilPenyewa } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const awalan: HasilPenyewa = {};

export function BorangDokumen({ tenantId, kategori }: { tenantId: string; kategori: string }) {
  const tindakan = muatNaikDokumenPenyewa.bind(null, tenantId);
  const [hasil, dispatch, menunggu] = useActionState(tindakan, awalan);
  const ialahBil = kategori === "UTILITY_BILL";

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) {
      toast.success(ialahBil ? "Bil utiliti berjaya ditambah" : "Dokumen berjaya dimuat naik");
    }
  }, [hasil, menunggu, ialahBil]);

  return (
    <form action={dispatch} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="kategori" value={kategori} />
      {ialahBil && (
        <>
          <Input
            type="month"
            name="bulan"
            className="h-8 w-auto text-xs"
            aria-label="Bulan bil"
            required
          />
          <Input
            type="number"
            name="amaun"
            step="0.01"
            min="0.01"
            placeholder="Amaun (RM)"
            className="h-8 w-28 text-xs"
            required
          />
        </>
      )}
      <Input
        type="file"
        name="fail"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="h-8 w-auto max-w-52 text-xs"
        required
      />
      <Button type="submit" size="sm" variant="outline" disabled={menunggu}>
        <Upload className="mr-1.5 size-3.5" />
        {menunggu ? "Memuat naik..." : ialahBil ? "Tambah Bil" : "Muat Naik"}
      </Button>
      {hasil?.ralat && <span className="text-xs text-destructive">{hasil.ralat}</span>}
    </form>
  );
}
