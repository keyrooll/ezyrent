"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { kemaskiniPenyewa, type HasilPenyewa } from "../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const awalan: HasilPenyewa = {};

type Penyewa = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  ic_no: string | null;
  occupation: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
};

export function PenyewaEditForm({ penyewa }: { penyewa: Penyewa }) {
  const router = useRouter();
  const tindakan = kemaskiniPenyewa.bind(null, penyewa.id);
  const [hasil, dispatch, menunggu] = useActionState(tindakan, awalan);

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) {
      toast.success("Maklumat penyewa dikemaskini");
      router.push(`/dashboard/penyewa/${penyewa.id}`);
      router.refresh();
    }
  }, [hasil, menunggu, router, penyewa.id]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Maklumat Penyewa</CardTitle>
          <CardDescription>{penyewa.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {hasil?.ralat && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {hasil.ralat}
            </p>
          )}
          <form action={dispatch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Penuh</Label>
              <Input id="nama" name="nama" defaultValue={penyewa.name} required />
              {hasil?.medan?.nama && <p className="text-xs text-destructive">{hasil.medan.nama}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">E-mel</Label>
                <Input id="email" name="email" type="email" defaultValue={penyewa.email ?? ""} />
                {hasil?.medan?.email && <p className="text-xs text-destructive">{hasil.medan.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefon">No. Telefon</Label>
                <Input id="telefon" name="telefon" defaultValue={penyewa.phone ?? ""} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="noKad">No. Kad Pengenalan</Label>
                <Input id="noKad" name="noKad" defaultValue={penyewa.ic_no ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pekerjaan">Pekerjaan</Label>
                <Input id="pekerjaan" name="pekerjaan" defaultValue={penyewa.occupation ?? ""} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="namaKecemasan">Kontak Kecemasan (nama)</Label>
                <Input
                  id="namaKecemasan"
                  name="namaKecemasan"
                  defaultValue={penyewa.emergency_contact ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefonKecemasan">Telefon Kecemasan</Label>
                <Input
                  id="telefonKecemasan"
                  name="telefonKecemasan"
                  defaultValue={penyewa.emergency_phone ?? ""}
                />
              </div>
            </div>

            <Button type="submit" disabled={menunggu}>
              {menunggu ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
