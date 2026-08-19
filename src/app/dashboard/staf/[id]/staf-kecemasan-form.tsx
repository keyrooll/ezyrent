"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { kemaskiniKecemasanStaf, type HasilStaf } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const awalan: HasilStaf = {};

export function StafKecemasanForm({
  staffId,
  nama,
  telefon,
  alamat,
  hubungan,
}: {
  staffId: string;
  nama: string;
  telefon: string;
  alamat: string;
  hubungan: string;
}) {
  const tindakan = kemaskiniKecemasanStaf.bind(null, staffId);
  const [hasil, dispatch, menunggu] = useActionState(tindakan, awalan);

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) toast.success("Kontak kecemasan dikemaskini");
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
          <Label htmlFor="namaKecemasan">Nama Kontak</Label>
          <Input id="namaKecemasan" name="namaKecemasan" defaultValue={nama} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefonKecemasan">No. Telefon</Label>
          <Input id="telefonKecemasan" name="telefonKecemasan" defaultValue={telefon} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hubungan">Hubungan</Label>
          <Input id="hubungan" name="hubungan" defaultValue={hubungan} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alamatKecemasan">Alamat</Label>
          <Input id="alamatKecemasan" name="alamatKecemasan" defaultValue={alamat} />
        </div>
      </div>
      <Button type="submit" disabled={menunggu}>
        {menunggu ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
