import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { requireLandlord } from "@/lib/sesi";
import { formatTarikhPendek } from "@/lib/format";
import { LABEL_JEMPUTAN } from "@/lib/labels";
import { batalkanJemputan } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SalinPautan } from "./salin-pautan";

export const dynamic = "force-dynamic";

const WARNA: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700",
  ACCEPTED: "bg-emerald-500/10 text-emerald-700",
  EXPIRED: "bg-zinc-500/10 text-zinc-700",
  REVOKED: "bg-red-500/10 text-red-700",
};

export default async function JemputanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await requireLandlord();

  const jemputan = await db.invitation.findUnique({
    where: { id },
    include: {
      unit: { select: { unit_no: true, property: { select: { name: true } } } },
      tenant: { select: { name: true } },
    },
  });

  if (!jemputan) notFound();

  const pautan = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/daftar/${jemputan.token}`;
  const aktif = jemputan.status === "PENDING" && jemputan.expires_at > new Date();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/dashboard/jemputan"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Semua Jemputan
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Jemputan Penyewa</CardTitle>
            <Badge variant="outline" className={WARNA[jemputan.status]}>
              {LABEL_JEMPUTAN[jemputan.status]}
            </Badge>
          </div>
          <CardDescription>
            {jemputan.tenant_email} • {jemputan.unit.property.name} ({jemputan.unit.unit_no})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {aktif ? (
            <>
              {/* Kod QR untuk dikongsi kepada penyewa */}
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6">
                <QRCodeSVG value={pautan} size={192} level="M" />
                <p className="text-xs text-muted-foreground">Imbas untuk daftar sebagai penyewa</p>
              </div>

              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs">{pautan}</code>
                <SalinPautan pautan={pautan} />
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Luput pada {formatTarikhPendek(jemputan.expires_at)}</span>
                <form action={batalkanJemputan.bind(null, jemputan.id)}>
                  <Button type="submit" variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    Batalkan Jemputan
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {jemputan.status === "ACCEPTED" && jemputan.tenant
                ? `Jemputan ini telah diterima oleh ${jemputan.tenant.name}.`
                : "Jemputan ini tidak lagi aktif."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
