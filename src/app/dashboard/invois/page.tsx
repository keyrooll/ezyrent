import Link from "next/link";
import { requireLandlord } from "@/lib/sesi";
import { formatRM, formatTarikh } from "@/lib/format";
import { LABEL_INVOIS, type InvoiceStatus } from "@/lib/labels";
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

const PILIHAN_STATUS: { nilai: string; label: string }[] = [
  { nilai: "", label: "Semua Status" },
  ...Object.entries(LABEL_INVOIS).map(([nilai, label]) => ({ nilai, label })),
];

export default async function InvoisPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const { db } = await requireLandlord();
  const { status } = (await searchParams) ?? {};
  const sahStatus = (Object.keys(LABEL_INVOIS) as string[]).includes(status ?? "");

  const senarai = await db.rentInvoice.findMany({
    where: sahStatus ? { status: status as InvoiceStatus } : undefined,
    include: {
      tenant: { select: { name: true } },
      unit: { select: { unit_no: true, property: { select: { name: true } } } },
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invois</h1>
          <p className="text-sm text-muted-foreground">{senarai.length} invois</p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {PILIHAN_STATUS.map((p) => (
              <option key={p.nilai} value={p.nilai}>
                {p.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Tapis
          </button>
        </form>
      </div>

      {senarai.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          Tiada invois dijumpai.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Invois</TableHead>
                <TableHead>Penyewa</TableHead>
                <TableHead>Unit</TableHead>
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
                    <Link href={`/dashboard/invois/${i.id}`} className="font-medium hover:underline">
                      {i.invoice_no}
                    </Link>
                  </TableCell>
                  <TableCell>{i.tenant.name}</TableCell>
                  <TableCell>
                    {i.unit.property.name}
                    <span className="block text-xs text-muted-foreground">{i.unit.unit_no}</span>
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
