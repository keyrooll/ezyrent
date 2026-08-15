"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { daftarLandlord, type RalatDaftar } from "./actions";

const awalan: RalatDaftar = {};

export default function DaftarPage() {
  const [hasil, tindakan, menunggu] = useActionState(daftarLandlord, awalan);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Akaun</CardTitle>
        <CardDescription>Percuma 30 hari • Tiada kad kredit diperlukan</CardDescription>
      </CardHeader>
      <CardContent>
        {hasil?.ralat && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{hasil.ralat}</p>
        )}
        <form action={tindakan} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Penuh</Label>
            <Input id="nama" name="nama" placeholder="Ahmad Razali" required />
            {hasil?.medan?.nama && <p className="text-xs text-destructive">{hasil.medan.nama}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="namaPerniagaan">Nama Perniagaan</Label>
            <Input id="namaPerniagaan" name="namaPerniagaan" placeholder="ABC Property Sdn Bhd" required />
            {hasil?.medan?.namaPerniagaan && (
              <p className="text-xs text-destructive">{hasil.medan.namaPerniagaan}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mel</Label>
            <Input id="email" name="email" type="email" placeholder="nama@contoh.my" required />
            {hasil?.medan?.email && <p className="text-xs text-destructive">{hasil.medan.email}</p>}
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
            {menunggu ? "Mendaftar..." : "Daftar Akaun"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Sudah ada akaun?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Log Masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
