"use client";

import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function TolakPembayaranDialog({ tindakan }: { tindakan: (fd: FormData) => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive">
          <X className="mr-1 size-4" />
          Tolak
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tolak Pembayaran</DialogTitle>
          <DialogDescription>
            Nyatakan sebab penolakan. Penyewa akan dimaklumkan melalui notifikasi.
          </DialogDescription>
        </DialogHeader>
        <form action={tindakan} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sebab">Sebab Penolakan</Label>
            <Input id="sebab" name="sebab" placeholder="cth: Bukti tidak jelas" />
          </div>
          <Button type="submit" variant="destructive" className="w-full">
            Tolak Pembayaran
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
