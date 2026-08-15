"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ciptaJemputan, type HasilJemputan } from "../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const awalan: HasilJemputan = {};

export function JemputanForm({ unit }: { unit: { id: string; label: string }[] }) {
  const router = useRouter();
  const [hasil, tindakan, menunggu] = useActionState(ciptaJemputan, awalan);

  // Ada ralat sahaja yang kembali ke sini — kejayaan redirect dalam action
  useEffect(() => {
    if (hasil?.berjaya && !menunggu) {
      toast.success("Jemputan dicipta");
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
          <CardTitle>Jemputan Baru</CardTitle>
          <CardDescription>
            Penyewa akan menerima pautan untuk daftar sendiri. Anda juga boleh kongsikan kod QR.
          </CardDescription>
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
              <Label htmlFor="email">E-mel Penyewa</Label>
              <Input id="email" name="email" type="email" placeholder="nama@contoh.my" required />
              {hasil?.medan?.email && <p className="text-xs text-destructive">{hasil.medan.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefon">No. Telefon (pilihan)</Label>
              <Input id="telefon" name="telefon" placeholder="012-3456789" />
            </div>

            <Button type="submit" disabled={menunggu}>
              {menunggu ? "Mencipta..." : "Cipta Jemputan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
