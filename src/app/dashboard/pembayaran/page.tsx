import Link from "next/link";
import { Check } from "lucide-react";
import { requireLandlord } from "@/lib/sesi";
import { formatRM, formatTarikh } from "@/lib/format";
import { LABEL_PEMBAYARAN, LABEL_KAEDAH, type PaymentStatus } from "@/lib/labels";
import { sahkanPembayaran, tolakPembayaran } from "../invois/actions";
import { TolakPembayaranDialog } from "@/components/dashboard/tolak-pembayaran-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  VERIFIED: "bg-emerald-500/10 text-emerald-700",
  REJECTED: "bg-red-500/10 text-red-700",
};

const PILIHAN_STATUS: { nilai: string; label: string }[] = [
  { nilai: "", label: "Semua Status" },
  ...Object.entries(LABEL_PEMBAYARAN).map(([nilai, label]) => ({ nilai, label })),
];

export default async function PembayaranPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const { db } = await requireLandlord();
  const { status } = (await searchParams) ?? {};
  const sahStatus = (Object.keys(LABEL_PEMBAYARAN) as string[]).includes(status ?? "");

  const senarai = await db.payment.findMany({
    where: sahStatus ? { status: status as PaymentStatus } : undefined,
    include: {
      tenant: { select: { name: true } },
      invoice: { select: { id: true, invoice_no: true } },
      documents: { select: { id: true, original_name: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pembayaran</h1>
          <p className="text-sm text-muted-foreground">{senarai.length} pembayaran</p>
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
          Tiada pembayaran dijumpai.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarikh</TableHead>
                <TableHead>Penyewa</TableHead>
                <TableHead>Invois</TableHead>
                <TableHead>Kaedah</TableHead>
                <TableHead className="text-right">Amaun</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senarai.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap">{formatTarikh(p.created_at)}</TableCell>
                  <TableCell>
                    {p.tenant.name}
                    {p.documents.length > 0 && (
                      <Link
                        href={`/api/v1/dokumen/${p.documents[0].id}`}
                        target="_blank"
                        className="block text-xs text-muted-foreground underline underline-offset-2"
                      >
                        {p.documents[0].original_name}
                      </Link>
                    )}
                    {p.status === "REJECTED" && p.rejection_reason && (
                      <span className="block text-xs text-destructive">{p.rejection_reason}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/invois/${p.invoice.id}`} className="font-medium hover:underline">
                      {p.invoice.invoice_no}
                    </Link>
                  </TableCell>
                  <TableCell>{LABEL_KAEDAH[p.method]}</TableCell>
                  <TableCell className="text-right">{formatRM(p.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={WARNA[p.status]}>
                      {LABEL_PEMBAYARAN[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === "PENDING" && (
                      <div className="flex items-center justify-end gap-2">
                        <form action={sahkanPembayaran.bind(null, p.id)}>
                          <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                            <Check className="mr-1 size-4" />
                            Sahkan
                          </Button>
                        </form>
                        <TolakPembayaranDialog tindakan={tolakPembayaran.bind(null, p.id)} />
                      </div>
                    )}
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
