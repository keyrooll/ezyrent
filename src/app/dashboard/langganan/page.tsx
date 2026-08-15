import { Check } from "lucide-react";
import { requireLandlord } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { formatRM, formatTarikh } from "@/lib/format";
import { LABEL_STATUS_LANDLORD } from "@/lib/labels";
import { naikTarafPelan } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CIRI_PELAN: Record<string, string[]> = {
  FREE: ["3 unit", "Pengurusan penyewa", "Invois & pembayaran", "Sokongan e-mel"],
  PRO: ["10 unit", "Semua ciri Percuma", "Jemputan QR penyewa", "Laporan kewangan"],
  BUSINESS: ["50 unit", "Semua ciri Pro", "Akaun staf", "Audit log"],
  PROFESSIONAL: ["200 unit", "Semua ciri Business", "Sokongan keutamaan", "API & integrasi"],
};

export default async function LanggananPage() {
  const { db, landlordId } = await requireLandlord();

  const [landlord, pelan, jumlahUnit] = await Promise.all([
    prisma.landlord.findUnique({ where: { id: landlordId } }),
    prisma.subscriptionPlan.findMany({ where: { is_active: true }, orderBy: { price_myr: "asc" } }),
    db.unit.count(),
  ]);

  if (!landlord) return null;
  const pelanSemasa = pelan.find((p) => p.code === landlord.plan_code);
  const peratus = landlord.unit_limit > 0 ? Math.min(100, Math.round((jumlahUnit / landlord.unit_limit) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Langganan</h1>
        <p className="text-sm text-muted-foreground">Urus pelan dan had unit akaun anda.</p>
      </div>

      {/* Pelan semasa + penggunaan unit */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">
                  Pelan {pelanSemasa?.name ?? landlord.plan_code}
                </p>
                <Badge
                  variant="outline"
                  className={
                    landlord.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-amber-500/10 text-amber-700"
                  }
                >
                  {LABEL_STATUS_LANDLORD[landlord.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {landlord.status === "TRIAL" && landlord.trial_ends_at
                  ? `Percubaan tamat pada ${formatTarikh(landlord.trial_ends_at)}`
                  : landlord.status === "ACTIVE"
                    ? "Pelan aktif"
                    : "Akaun digantung"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold">{formatRM(pelanSemasa?.price_myr ?? 0)}</p>
              <p className="text-xs text-muted-foreground">sebulan</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Penggunaan unit</span>
              <span className="font-medium">
                {jumlahUnit} / {landlord.unit_limit} unit
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  peratus >= 90 ? "bg-destructive" : peratus >= 70 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${peratus}%` }}
              />
            </div>
            {peratus >= 90 && (
              <p className="mt-2 text-sm text-destructive">
                Anda hampir mencapai had unit — naik taraf pelan untuk tambah lebih banyak unit.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pilihan pelan */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pelan.map((p) => {
          const semasa = p.code === landlord.plan_code;
          return (
            <Card key={p.id} className={cn("flex flex-col", semasa && "border-primary ring-1 ring-primary")}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name}
                  {semasa && (
                    <Badge className="bg-primary text-primary-foreground">Pelan Semasa</Badge>
                  )}
                </CardTitle>
                <p className="text-2xl font-semibold">
                  {formatRM(p.price_myr)}
                  <span className="text-sm font-normal text-muted-foreground">/bulan</span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="flex-1 space-y-2 text-sm">
                  {(CIRI_PELAN[p.code] ?? []).map((c) => (
                    <li key={c} className="flex items-center gap-2">
                      <Check className="size-4 shrink-0 text-emerald-600" />
                      {c}
                    </li>
                  ))}
                </ul>
                {!semasa && (
                  <form action={naikTarafPelan.bind(null, p.code)}>
                    <Button type="submit" className="w-full" variant={Number(p.price_myr) > 0 ? "default" : "outline"}>
                      {Number(p.price_myr) > 0 ? "Naik Taraf" : "Tukar ke Percuma"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Nota: Pembayaran sebenar akan didayakan pada fasa seterusnya. Buat masa ini, pertukaran pelan diaktifkan serta-merta.
      </p>
    </div>
  );
}
