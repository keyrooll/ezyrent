"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { ciptaAduanPenyewa, type HasilAduanPenyewa } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const awalan: HasilAduanPenyewa = {};

export function AduanForm() {
  const [hasil, tindakan, menunggu] = useActionState(ciptaAduanPenyewa, awalan);

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) {
      toast.success("Aduan berjaya dihantar. Tuan rumah akan dimaklumkan.");
    }
  }, [hasil, menunggu]);

  return (
    <form action={tindakan} className="space-y-4">
      {hasil?.ralat && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{hasil.ralat}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="tajuk">Tajuk</Label>
        <Input id="tajuk" name="tajuk" placeholder="cth: Paip sinki bocor" required />
        {hasil?.medan?.tajuk && <p className="text-xs text-destructive">{hasil.medan.tajuk}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="keterangan">Keterangan</Label>
        <Textarea
          id="keterangan"
          name="keterangan"
          rows={3}
          placeholder="Terangkan masalah yang berlaku..."
          required
        />
        {hasil?.medan?.keterangan && (
          <p className="text-xs text-destructive">{hasil.medan.keterangan}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label
          htmlFor="gambar"
          className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
        >
          <ImagePlus className="size-4" />
          Lampir Gambar
        </label>
        <Input id="gambar" name="gambar" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" />
      </div>

      <Button type="submit" disabled={menunggu}>
        {menunggu ? "Menghantar..." : "Hantar Aduan"}
      </Button>
    </form>
  );
}
