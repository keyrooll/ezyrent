"use client";

import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { padamExpense } from "./actions";

export function PadamExpenseDialog({ id, keterangan }: { id: string; keterangan: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Padam Perbelanjaan</DialogTitle>
          <DialogDescription>
            Anda pasti mahu padam &quot;{keterangan}&quot;? Tindakan ini tidak boleh dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <form action={padamExpense.bind(null, id)} className="flex justify-end gap-2">
          <Button type="submit" variant="destructive">
            Padam
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
