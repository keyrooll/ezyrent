"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ciptaUnit, type HasilUnit } from "../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const awalan: HasilUnit = {};

type Props = { senaraiHartanah: { id: string; nama: string }[]; pilihanAwal?: string };

export function UnitForm({ senaraiHartanah, pilihanAwal }: Props) {
  const router = useRouter();
  const [hasil, tindakan, menunggu] = useActionState(ciptaUnit, awalan);

  // Berjaya → toast + kembali ke senarai unit
  useEffect(() => {
    if (hasil?.berjaya && !menunggu) {
      toast.success("Unit berjaya ditambah");
      router.push("/dashboard/unit");
      router.refresh();
    }
  }, [hasil, menunggu, router]);

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
          <CardTitle>Tambah Unit</CardTitle>
          <CardDescription>Daftarkan unit dalam hartanah anda</CardDescription>
        </CardHeader>
        <CardContent>
          {hasil?.ralat && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{hasil.ralat}</p>
          )}
          <form action={tindakan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hartanahId">Hartanah</Label>
              <select
                id="hartanahId"
                name="hartanahId"
                defaultValue={pilihanAwal}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                {senaraiHartanah.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="noUnit">No. Unit</Label>
                <Input id="noUnit" name="noUnit" placeholder="cth: A-01-03" required />
                {hasil?.medan?.noUnit && <p className="text-xs text-destructive">{hasil.medan.noUnit}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tingkat">Tingkat (pilihan)</Label>
                <Input id="tingkat" name="tingkat" placeholder="cth: 1" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="keluasan">Keluasan (m²)</Label>
                <Input id="keluasan" name="keluasan" type="number" min="1" placeholder="cth: 80" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bilik">Bilik Tidur</Label>
                <Input id="bilik" name="bilik" type="number" min="0" max="20" placeholder="3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bilikAir">Bilik Air</Label>
                <Input id="bilikAir" name="bilikAir" type="number" min="0" max="20" placeholder="2" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sewa">Sewa Bulanan (RM)</Label>
                <Input id="sewa" name="sewa" type="number" step="0.01" min="1" placeholder="1500.00" required />
                {hasil?.medan?.sewa && <p className="text-xs text-destructive">{hasil.medan.sewa}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit">Deposit (RM)</Label>
                <Input id="deposit" name="deposit" type="number" step="0.01" min="0" placeholder="3000.00" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nota">Nota (pilihan)</Label>
              <Textarea id="nota" name="nota" rows={2} placeholder="Nota tambahan..." />
            </div>

            <Button type="submit" disabled={menunggu}>
              {menunggu ? "Menyimpan..." : "Simpan Unit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
