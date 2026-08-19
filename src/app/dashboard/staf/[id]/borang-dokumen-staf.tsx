"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { muatNaikDokumenStaf, type HasilStaf } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const awalan: HasilStaf = {};

export function BorangDokumenStaf({ staffId, kategori }: { staffId: string; kategori: string }) {
  const tindakan = muatNaikDokumenStaf.bind(null, staffId);
  const [hasil, dispatch, menunggu] = useActionState(tindakan, awalan);

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) toast.success("Dokumen berjaya dimuat naik");
  }, [hasil, menunggu]);

  return (
    <form action={dispatch} className="flex items-center gap-2">
      <input type="hidden" name="kategori" value={kategori} />
      <Input
        type="file"
        name="fail"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="h-8 w-auto max-w-52 text-xs"
        required
      />
      <Button type="submit" size="sm" variant="outline" disabled={menunggu}>
        <Upload className="mr-1.5 size-3.5" />
        {menunggu ? "Memuat naik..." : "Muat Naik"}
      </Button>
      {hasil?.ralat && <span className="text-xs text-destructive">{hasil.ralat}</span>}
    </form>
  );
}
