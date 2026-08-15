"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ciptaStaf, type HasilStaf } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const awalan: HasilStaf = {};

export function StafForm() {
  const router = useRouter();
  const borang = useRef<HTMLFormElement>(null);
  const [hasil, tindakan, menunggu] = useActionState(ciptaStaf, awalan);

  useEffect(() => {
    if (hasil?.berjaya && !menunggu) {
      toast.success("Akaun staf berjaya dicipta");
      borang.current?.reset();
      router.refresh();
    }
  }, [hasil, menunggu, router]);

  return (
    <form ref={borang} action={tindakan} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nama">Nama Penuh</Label>
        <Input id="nama" name="nama" placeholder="cth: Nurul Aina" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mel</Label>
        <Input id="email" name="email" type="email" placeholder="staf@contoh.my" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="katalaluan">Kata Laluan</Label>
        <Input id="katalaluan" name="katalaluan" type="password" minLength={8} required />
      </div>

      {hasil?.ralat && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{hasil.ralat}</p>}

      <Button type="submit" disabled={menunggu}>
        {menunggu ? "Mencipta..." : "Cipta Staf"}
      </Button>
    </form>
  );
}
