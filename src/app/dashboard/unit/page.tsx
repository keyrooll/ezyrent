import Link from "next/link";
import { Plus } from "lucide-react";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { formatRM } from "@/lib/format";
import { LABEL_UNIT } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

/** Warna badge ikut status unit */
const WARNA_UNIT: Record<string, string> = {
  VACANT: "bg-emerald-500/10 text-emerald-700",
  OCCUPIED: "bg-blue-500/10 text-blue-700",
  MAINTENANCE: "bg-amber-500/10 text-amber-700",
  RESERVED: "bg-purple-500/10 text-purple-700",
};

export default async function UnitPage() {
  const { user, db } = await requireLandlord();
  const bolehTambah = user.role !== "STAFF";
  const skop = await skopHartanahStaf(db, user);

  const senarai = await db.unit.findMany({
    where: skop ? { property_id: { in: skop } } : {},
    include: { property: { select: { name: true } } },
    orderBy: [{ property: { name: "asc" } }, { unit_no: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Unit</h1>
          <p className="text-sm text-muted-foreground">{senarai.length} unit keseluruhan</p>
        </div>
        {bolehTambah && (
          <Button asChild>
            <Link href="/dashboard/unit/baru">
              <Plus className="mr-2 size-4" />
              Tambah Unit
            </Link>
          </Button>
        )}
      </div>

      {senarai.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          Belum ada unit. Tambah hartanah dahulu, kemudian daftarkan unit.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Unit</TableHead>
                <TableHead>Hartanah</TableHead>
                <TableHead className="text-right">Sewa</TableHead>
                <TableHead className="text-right">Deposit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senarai.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/unit/${u.id}`} className="text-primary hover:underline">
                      {u.unit_no}
                    </Link>
                  </TableCell>
                  <TableCell>{u.property.name}</TableCell>
                  <TableCell className="text-right">{formatRM(u.rent_amount)}</TableCell>
                  <TableCell className="text-right">{formatRM(u.deposit_amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={WARNA_UNIT[u.status]}>
                      {LABEL_UNIT[u.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
