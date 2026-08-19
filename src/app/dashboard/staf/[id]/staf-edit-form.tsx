"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { kemaskiniStaf, type HasilStaf } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const awalan: HasilStaf = {};

export function StafEditForm({
  staffId,
  nama,
  telefon,
}: {
  staffId: string;
  nama: string;
  telefon: string;
}) {
  const tindakan = kemaskiniStaf.bind(null, staffId);
  const [hasil, dispatch, menunggu] = useActionState(tindakan, awalan);

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) toast.success("Maklumat staf dikemaskini");
  }, [hasil, menunggu]);

  return (
    <form action={dispatch} className="space-y-4">
      {hasil?.ralat && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {hasil.ralat}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nama">Nama</Label>
          <Input id="nama" name="nama" defaultValue={nama} required />
          {hasil?.medan?.nama && <p className="text-xs text-destructive">{hasil.medan.nama}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefon">No. Telefon</Label>
          <Input id="telefon" name="telefon" defaultValue={telefon} />
        </div>
      </div>
      <Button type="submit" disabled={menunggu}>
        {menunggu ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
