"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { buktiBayarUtility, type HasilDokumen } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const awalan: HasilDokumen = {};

/** Borang muat naik bukti pembayaran bagi satu bil utiliti */
export function BorangBukti({ bilId }: { bilId: string }) {
  const tindakan = buktiBayarUtility.bind(null, bilId);
  const [hasil, dispatch, menunggu] = useActionState(tindakan, awalan);

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) {
      toast.success("Bukti dihantar — menunggu pengesahan tuan rumah");
    }
  }, [hasil, menunggu]);

  return (
    <form action={dispatch} className="flex items-center gap-2">
      <Input
        type="file"
        name="fail"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="h-8 w-auto max-w-52 text-xs"
        required
      />
      <Button type="submit" size="sm" variant="outline" disabled={menunggu}>
        <Upload className="mr-1.5 size-3.5" />
        {menunggu ? "Menghantar..." : "Saya Dah Bayar"}
      </Button>
      {hasil?.ralat && <span className="text-xs text-destructive">{hasil.ralat}</span>}
    </form>
  );
}
