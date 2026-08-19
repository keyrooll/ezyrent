import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { requirePenyewa } from "@/lib/sesi";
import { formatRM, formatTarikh } from "@/lib/format";
import { LABEL_INVOIS, LABEL_PEMBAYARAN, LABEL_KAEDAH } from "@/lib/labels";
import { BayaranForm } from "./bayaran-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

const WARNA_INVOIS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700",
  PARTIAL: "bg-purple-500/10 text-purple-700",
  PAID: "bg-emerald-500/10 text-emerald-700",
  OVERDUE: "bg-red-500/10 text-red-700",
  CANCELLED: "bg-zinc-500/10 text-zinc-700",
  WAIVED: "bg-zinc-500/10 text-zinc-700",
};

const WARNA_BAYARAN: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700",
  VERIFIED: "bg-emerald-500/10 text-emerald-700",
  REJECTED: "bg-red-500/10 text-red-700",
};

export default async function PenyewaInvoisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, tenantId } = await requirePenyewa();

  const invois = await db.rentInvoice.findUnique({
    where: { id },
    include: {
      tenant: { select: { name: true } },
      unit: { include: { property: { select: { name: true } } } },
      payments: {
        include: { documents: { select: { id: true, original_name: true } } },
        orderBy: { created_at: "desc" },
      },
    },
  });

  // Invois mesti milik penyewa sendiri
  if (!invois || invois.tenant_id !== tenantId) notFound();

  const baki = Number(invois.amount) - Number(invois.paid_amount);

  return (
    <div className="space-y-6">
      <Link
        href="/penyewa/invois"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Semua Invois
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{invois.invoice_no}</h1>
            <Badge variant="outline" className={WARNA_INVOIS[invois.status]}>
              {LABEL_INVOIS[invois.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {invois.unit.property.name} • Unit {invois.unit.unit_no}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/penyewa/invois/${invois.id}/resit`} target="_blank" rel="noreferrer">
            <Printer className="mr-2 size-4" />
            Cetak Resit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Maklumat Invois</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div className="col-span-2 grid gap-3 sm:col-span-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-primary/5 px-4 py-3 ring-1 ring-primary/20">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nama Penyewa</dt>
                    <dd className="text-xl font-bold text-primary">{invois.tenant.name}</dd>
                  </div>
                  <div className="rounded-lg bg-primary/5 px-4 py-3 ring-1 ring-primary/20">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hartanah</dt>
                    <dd className="text-base font-bold text-primary">
                      {invois.unit.property.name} ({invois.unit.unit_no})
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tempoh</dt>
                  <dd className="font-medium">
                    {formatTarikh(invois.period_start)} – {formatTarikh(invois.period_end)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tarikh Due</dt>
                  <dd className="font-medium">{formatTarikh(invois.due_date)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Amaun</dt>
                  <dd className="font-medium">{formatRM(invois.amount)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Dibayar</dt>
                  <dd className="font-medium">{formatRM(invois.paid_amount)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Baki</dt>
                  <dd className="font-medium">{formatRM(baki)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sejarah Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {invois.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tiada pembayaran direkodkan.</p>
              ) : (
                invois.payments.map((p) => (
                  <div key={p.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {formatRM(p.amount)} • {LABEL_KAEDAH[p.method]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTarikh(p.created_at)}
                          {p.status === "REJECTED" && p.rejection_reason && (
                            <span className="text-destructive"> • Sebab: {p.rejection_reason}</span>
                          )}
                        </p>
                        {p.documents.length > 0 && (
                          <p className="text-xs text-muted-foreground">Bukti: {p.documents[0].original_name}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={WARNA_BAYARAN[p.status]}>
                        {LABEL_PEMBAYARAN[p.status]}
                      </Badge>
                    </div>
                    <Separator className="mt-4 last:hidden" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Buat Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {baki > 0 ? (
              <BayaranForm invoiceId={invois.id} baki={baki} />
            ) : (
              <p className="text-sm text-muted-foreground">Invois ini telah dilunaskan. Terima kasih!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
