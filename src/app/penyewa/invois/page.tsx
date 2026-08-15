import Link from "next/link";
import { requirePenyewa } from "@/lib/sesi";
import { formatRM, formatTarikh } from "@/lib/format";
import { LABEL_INVOIS } from "@/lib/labels";
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
  PENDING: "bg-amber-500/10 text-amber-700",
  PARTIAL: "bg-purple-500/10 text-purple-700",
  PAID: "bg-emerald-500/10 text-emerald-700",
  OVERDUE: "bg-red-500/10 text-red-700",
  CANCELLED: "bg-zinc-500/10 text-zinc-700",
  WAIVED: "bg-zinc-500/10 text-zinc-700",
};

export default async function PenyewaInvoisPage() {
  const { db, tenantId } = await requirePenyewa();

  const senarai = await db.rentInvoice.findMany({
    where: { tenant_id: tenantId },
    orderBy: { period_start: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invois Saya</h1>
        <p className="text-sm text-muted-foreground">{senarai.length} invois</p>
      </div>

      {senarai.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          Tiada invois lagi.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Invois</TableHead>
                <TableHead>Tempoh</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Amaun</TableHead>
                <TableHead className="text-right">Dibayar</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senarai.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <Link href={`/penyewa/invois/${i.id}`} className="font-medium hover:underline">
                      {i.invoice_no}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatTarikh(i.period_start)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatTarikh(i.due_date)}</TableCell>
                  <TableCell className="text-right">{formatRM(i.amount)}</TableCell>
                  <TableCell className="text-right">{formatRM(i.paid_amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={WARNA[i.status]}>
                      {LABEL_INVOIS[i.status]}
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
