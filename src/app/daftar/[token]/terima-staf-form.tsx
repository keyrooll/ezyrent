"use client";

import { useActionState } from "react";
import { terimaJemputan, type HasilTerimaJemputan } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const awalan: HasilTerimaJemputan = {};

export function TerimaJemputanStafForm({ token, email }: { token: string; email: string }) {
  const tindakan = terimaJemputan.bind(null, token);
  const [hasil, dispatch, menunggu] = useActionState(tindakan, awalan);

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Terima Jemputan Staf</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Anda dijemput sebagai staf untuk {email}. Daftar akaun untuk mula.
      </p>

      {hasil?.ralat && (
        <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {hasil.ralat}
        </p>
      )}

      <form action={dispatch} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nama">Nama Penuh</Label>
          <Input id="nama" name="nama" placeholder="cth: Ahmad Ali" required />
          {hasil?.medan?.nama && <p className="text-xs text-destructive">{hasil.medan.nama}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefon">No. Telefon (pilihan)</Label>
          <Input id="telefon" name="telefon" placeholder="012-3456789" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="katalaluan">Kata Laluan</Label>
          <Input id="katalaluan" name="katalaluan" type="password" minLength={8} required />
          {hasil?.medan?.katalaluan && (
            <p className="text-xs text-destructive">{hasil.medan.katalaluan}</p>
          )}
        </div>

        <Button type="submit" disabled={menunggu} className="w-full">
          {menunggu ? "Mendaftar..." : "Daftar Akaun Staf"}
        </Button>
      </form>
    </div>
  );
}
