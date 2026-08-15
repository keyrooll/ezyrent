import Link from "next/link";
import { Plus } from "lucide-react";
import { requireLandlord } from "@/lib/sesi";
import { formatRM, formatTarikh } from "@/lib/format";
import { LABEL_TENANCY } from "@/lib/labels";
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

const WARNA: Record<string, string> = {
  DRAFT: "bg-zinc-500/10 text-zinc-700",
  ACTIVE: "bg-emerald-500/10 text-emerald-700",
  ENDED: "bg-zinc-500/10 text-zinc-700",
  TERMINATED: "bg-red-500/10 text-red-700",
};

export default async function PenyewaanPage() {
  const { db } = await requireLandlord();

  const senarai = await db.tenancy.findMany({
    include: {
      unit: { select: { unit_no: true, property: { select: { name: true } } } },
      tenant: { select: { name: true } },
      _count: { select: { invoices: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Penyewaan</h1>
          <p className="text-sm text-muted-foreground">{senarai.length} rekod penyewaan</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/penyewaan/baru">
            <Plus className="mr-2 size-4" />
            Penyewaan Baru
          </Link>
        </Button>
      </div>

      {senarai.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          Belum ada penyewaan. Daftarkan unit dan penyewa dahulu.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Penyewa</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Tempoh</TableHead>
                <TableHead className="text-right">Sewa</TableHead>
                <TableHead>Invois</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senarai.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.tenant.name}</TableCell>
                  <TableCell>
                    {t.unit.property.name}
                    <span className="block text-xs text-muted-foreground">{t.unit.unit_no}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatTarikh(t.start_date)}
                    {t.end_date && <> – {formatTarikh(t.end_date)}</>}
                  </TableCell>
                  <TableCell className="text-right">{formatRM(t.rent_amount)}</TableCell>
                  <TableCell>{t._count.invoices}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={WARNA[t.status]}>
                      {LABEL_TENANCY[t.status]}
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
