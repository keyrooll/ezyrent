"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ciptaPenyewaan, type HasilPenyewaan } from "../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const awalan: HasilPenyewaan = {};

type Props = {
  unit: { id: string; label: string; hartaId: string; sewa: number; deposit: number }[];
  penyewa: { id: string; nama: string }[];
};

export function PenyewaanForm({ unit, penyewa }: Props) {
  const router = useRouter();
  const [hasil, tindakan, menunggu] = useActionState(ciptaPenyewaan, awalan);
  const [unitId, setUnitId] = useState(unit[0]?.id ?? "");

  // Isi auto sewa & deposit apabila unit dipilih
  const unitTerpilih = unit.find((u) => u.id === unitId);

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) {
      toast.success("Penyewaan berjaya dicipta");
      router.push("/dashboard/penyewaan");
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
          <CardTitle>Penyewaan Baru</CardTitle>
          <CardDescription>Pautkan penyewa kepada unit dengan terma sewa</CardDescription>
        </CardHeader>
        <CardContent>
          {hasil?.ralat && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{hasil.ralat}</p>
          )}
          <form action={tindakan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitId">Unit</Label>
              <select
                id="unitId"
                name="unitId"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                {unit.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantId">Penyewa</Label>
              <select
                id="tenantId"
                name="tenantId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                {penyewa.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tarikhMula">Tarikh Mula</Label>
                <Input id="tarikhMula" name="tarikhMula" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarikhTamat">Tarikh Tamat (pilihan)</Label>
                <Input id="tarikhTamat" name="tarikhTamat" type="date" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sewa">Sewa (RM)</Label>
                <Input
                  key={`sewa-${unitId}`}
                  id="sewa"
                  name="sewa"
                  type="number"
                  step="0.01"
                  min="1"
                  defaultValue={unitTerpilih?.sewa}
                  required
                />
                {hasil?.medan?.sewa && <p className="text-xs text-destructive">{hasil.medan.sewa}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit">Deposit (RM)</Label>
                <Input
                  key={`deposit-${unitId}`}
                  id="deposit"
                  name="deposit"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={unitTerpilih?.deposit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hariDue">Hari Due (bulanan)</Label>
                <Input id="hariDue" name="hariDue" type="number" min="1" max="28" defaultValue={1} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue="ACTIVE"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="DRAFT">Draf</option>
              </select>
            </div>

            <Button type="submit" disabled={menunggu}>
              {menunggu ? "Menyimpan..." : "Simpan Penyewaan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
