"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ciptaHartanah, type HasilHartanah } from "../actions";
import { NEGERI_MALAYSIA } from "@/lib/constants";
import { LABEL_JENIS_HARTANAH } from "@/lib/labels";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const awalan: HasilHartanah = {};

export default function HartanahBaruPage() {
  const router = useRouter();
  const [hasil, tindakan, menunggu] = useActionState(ciptaHartanah, awalan);

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
          <CardTitle>Tambah Hartanah</CardTitle>
          <CardDescription>Maklumat asas hartanah sewa anda</CardDescription>
        </CardHeader>
        <CardContent>
          {hasil?.ralat && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{hasil.ralat}</p>
          )}
          <form action={tindakan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Hartanah</Label>
              <Input id="nama" name="nama" placeholder="cth: Condo Sri Hartamas" required />
              {hasil?.medan?.nama && <p className="text-xs text-destructive">{hasil.medan.nama}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jenis">Jenis Hartanah</Label>
              <select
                id="jenis"
                name="jenis"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue="TERRACE"
              >
                {Object.entries(LABEL_JENIS_HARTANAH).map(([nilai, label]) => (
                  <option key={nilai} value={nilai}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jalan">Alamat</Label>
              <Input id="jalan" name="jalan" placeholder="cth: Jalan Sri Hartamas 1" required />
              {hasil?.medan?.jalan && <p className="text-xs text-destructive">{hasil.medan.jalan}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bandar">Bandar</Label>
                <Input id="bandar" name="bandar" placeholder="Kuala Lumpur" required />
                {hasil?.medan?.bandar && <p className="text-xs text-destructive">{hasil.medan.bandar}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="negeri">Negeri</Label>
                <select
                  id="negeri"
                  name="negeri"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Pilih negeri
                  </option>
                  {NEGERI_MALAYSIA.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                {hasil?.medan?.negeri && <p className="text-xs text-destructive">{hasil.medan.negeri}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="poskod">Poskod</Label>
                <Input id="poskod" name="poskod" placeholder="50480" inputMode="numeric" required />
                {hasil?.medan?.poskod && <p className="text-xs text-destructive">{hasil.medan.poskod}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan (pilihan)</Label>
              <Textarea id="keterangan" name="keterangan" rows={3} placeholder="Nota tambahan..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gambar">Gambar Hartanah (pilihan)</Label>
              <Input
                id="gambar"
                name="gambar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="h-8 w-auto max-w-64 text-xs"
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG atau WEBP — maksimum 5MB. Gambar ini akan dipaparkan di dashboard staf dan portal penyewa.
              </p>
            </div>

            <Button type="submit" disabled={menunggu}>
              {menunggu ? "Menyimpan..." : "Simpan Hartanah"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
