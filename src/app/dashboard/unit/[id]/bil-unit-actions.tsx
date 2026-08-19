"use client";

import { useActionState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { kemaskiniBilUnit, padamBilUnit, type HasilBilUnit } from "./actions";

const awalan: HasilBilUnit = {};

/** Dialog kemas kini bil utiliti (bulan + amaun) */
export function EditBilUnitDialog({
  bilId,
  bulan,
  amaun,
}: {
  bilId: string;
  bulan: string;
  amaun: number;
}) {
  const [hasil, tindakan, menunggu] = useActionState(kemaskiniBilUnit, awalan);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost" aria-label="Kemaskini bil">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kemaskini Bil Utiliti</DialogTitle>
          <DialogDescription>Ubah bulan atau amaun bil.</DialogDescription>
        </DialogHeader>
        <form action={tindakan} className="space-y-4">
          {hasil?.ralat && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {hasil.ralat}
            </p>
          )}

          <input type="hidden" name="bilId" value={bilId} />

          <div className="space-y-2">
            <Label htmlFor={`bulan-${bilId}`}>Bulan</Label>
            <Input id={`bulan-${bilId}`} name="bulan" type="month" defaultValue={bulan} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`amaun-${bilId}`}>Amaun (RM)</Label>
            <Input
              id={`amaun-${bilId}`}
              name="amaun"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={amaun.toFixed(2)}
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={menunggu}>
              {menunggu ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Dialog padam bil utiliti */
export function PadamBilUnitDialog({ bilId, label }: { bilId: string; label: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          aria-label="Padam bil"
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Padam Bil Utiliti</DialogTitle>
          <DialogDescription>
            Anda pasti mahu padam bil {label}? Tindakan ini tidak boleh dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <form action={padamBilUnit.bind(null, bilId)} className="flex justify-end gap-2">
          <Button type="submit" variant="destructive">
            Padam
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
