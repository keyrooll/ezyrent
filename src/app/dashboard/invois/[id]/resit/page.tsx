import { notFound } from "next/navigation";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { formatRM, formatTarikh } from "@/lib/format";
import { LABEL_KAEDAH } from "@/lib/labels";
import { Brand } from "@/components/brand";
import { CetakAutomatik } from "@/components/dashboard/cetak-automatik";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ResitInvoisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);

  const invois = await db.rentInvoice.findUnique({
    where: { id },
    include: {
      tenant: true,
      unit: { include: { property: { select: { name: true } } } },
      payments: {
        where: { status: "VERIFIED" },
        orderBy: { verified_at: "asc" },
      },
    },
  });

  if (!invois || (skop && !skop.includes(invois.unit.property_id))) notFound();

  const baki = Number(invois.amount) - Number(invois.paid_amount);

  return (
    <div className="mx-auto max-w-2xl p-4 print:p-0">
      <CetakAutomatik />
      <div className="rounded-lg border bg-card p-8 print:rounded-none print:border-0 print:p-0">
        {/* Kepala resit — logo EzyRent */}
        <div className="flex items-start justify-between gap-4 border-b pb-6">
          <Brand className="h-16" />
          <div className="text-right">
            <p className="text-lg font-bold uppercase tracking-wide">Resit Rasmi</p>
            <p className="text-sm text-muted-foreground">{invois.invoice_no}</p>
            <p className="text-xs text-muted-foreground">{formatTarikh(new Date())}</p>
          </div>
        </div>

        {/* Maklumat resit */}
        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Diterima Daripada
            </p>
            <p className="text-lg font-bold">{invois.tenant.name}</p>
            <p className="text-muted-foreground">{invois.tenant.phone ?? "—"}</p>
            <p className="text-muted-foreground">{invois.tenant.email ?? "—"}</p>
          </div>
          <div className="space-y-1 text-sm sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Hartanah
            </p>
            <p className="text-lg font-bold">
              {invois.unit.property.name} ({invois.unit.unit_no})
            </p>
          </div>
        </div>

        {/* Butiran bayaran */}
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Perkara</th>
                <th className="px-3 py-2 text-right font-medium">Amaun</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-3 py-2">
                  <p className="font-medium">Sewa Tempoh</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTarikh(invois.period_start)} – {formatTarikh(invois.period_end)}
                  </p>
                </td>
                <td className="px-3 py-2 text-right font-medium">{formatRM(invois.amount)}</td>
              </tr>
              {invois.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium">
                      Bayaran {LABEL_KAEDAH[p.method] ?? p.method}
                      {p.verified_at && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({formatTarikh(p.verified_at)})
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-700">
                    − {formatRM(p.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/30 font-semibold">
                <td className="px-3 py-2">Baki</td>
                <td className="px-3 py-2 text-right">{formatRM(Math.max(0, baki))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <Badge variant="outline">{invois.status}</Badge>
          <div className="text-right text-sm">
            <p className="text-muted-foreground">Dijana oleh EzyRent</p>
            <p className="font-medium">Terima kasih kerana menggunakan EzyRent</p>
          </div>
        </div>
      </div>
    </div>
  );
}
