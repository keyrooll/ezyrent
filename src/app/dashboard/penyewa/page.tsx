import Link from "next/link";
import { Plus } from "lucide-react";
import { requireLandlord } from "@/lib/sesi";
import { LABEL_PENYEWA } from "@/lib/labels";
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

export default async function PenyewaPage() {
  const { db } = await requireLandlord();

  const senarai = await db.tenant.findMany({
    include: { _count: { select: { tenancies: true } } },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Penyewa</h1>
          <p className="text-sm text-muted-foreground">{senarai.length} penyewa didaftarkan</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/penyewa/baru">
            <Plus className="mr-2 size-4" />
            Tambah Penyewa
          </Link>
        </Button>
      </div>

      {senarai.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          Belum ada penyewa.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>E-mel</TableHead>
                <TableHead>No. Kad Pengenalan</TableHead>
                <TableHead>Penyewaan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senarai.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.phone ?? "—"}</TableCell>
                  <TableCell>{t.email ?? "—"}</TableCell>
                  <TableCell>{t.ic_no ?? "—"}</TableCell>
                  <TableCell>{t._count.tenancies}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{LABEL_PENYEWA[t.status]}</Badge>
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
