"use client";

import { useActionState } from "react";
import { terimaJemputan, type HasilTerimaJemputan } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const awalan: HasilTerimaJemputan = {};

export function TerimaJemputanForm({
  token,
  email,
  unitLabel,
}: {
  token: string;
  email: string;
  unitLabel: string;
}) {
  const [hasil, tindakan, menunggu] = useActionState(terimaJemputan.bind(null, token), awalan);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anda Dijemput Menyewa</CardTitle>
        <CardDescription>
          {unitLabel}
          <span className="block">Lengkapkan maklumat untuk mengaktifkan akaun penyewa anda.</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasil?.ralat && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{hasil.ralat}</p>
        )}
        <form action={tindakan} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mel</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Penuh</Label>
            <Input id="nama" name="nama" placeholder="Nama mengikut kad pengenalan" required />
            {hasil?.medan?.nama && <p className="text-xs text-destructive">{hasil.medan.nama}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">No. Telefon</Label>
            <Input id="telefon" name="telefon" placeholder="012-3456789" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="katalaluan">Kata Laluan</Label>
            <Input
              id="katalaluan"
              name="katalaluan"
              type="password"
              placeholder="Minima 8 aksara"
              minLength={8}
              required
            />
            {hasil?.medan?.katalaluan && (
              <p className="text-xs text-destructive">{hasil.medan.katalaluan}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={menunggu}>
            {menunggu ? "Mengaktifkan..." : "Aktifkan Akaun"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
