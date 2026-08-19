import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { formatRM, formatTarikh } from "@/lib/format";
import { LABEL_UNIT, LABEL_TENANCY } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const WARNA_UNIT: Record<string, string> = {
  VACANT: "bg-emerald-500/10 text-emerald-700",
  OCCUPIED: "bg-blue-500/10 text-blue-700",
  MAINTENANCE: "bg-amber-500/10 text-amber-700",
  RESERVED: "bg-purple-500/10 text-purple-700",
};

const WARNA_STATUS_MAINTENANCE: Record<string, string> = {
  COMPLAIN: "bg-red-500/10 text-red-700",
  IN_PROGRESS: "bg-amber-500/10 text-amber-700",
  COMPLETED: "bg-emerald-500/10 text-emerald-700",
};

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);

  const unit = await db.unit.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true } },
      tenancies: {
        where: { status: "ACTIVE" },
        take: 1,
        include: { tenant: { select: { id: true, name: true, phone: true } } },
      },
      maintenance_requests: {
        orderBy: { created_at: "desc" },
        take: 5,
      },
    },
  });

  if (!unit || (skop && !skop.includes(unit.property_id))) notFound();

  const penyewa = unit.tenancies[0]?.tenant ?? null;

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/hartanah/${unit.property_id}`}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {unit.property.name}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Unit {unit.unit_no}
            </h1>
            <Badge variant="outline" className={WARNA_UNIT[unit.status]}>
              {LABEL_UNIT[unit.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {unit.property.name} · {unit.floor ? `Tingkat ${unit.floor} · ` : ""}
            {unit.size_sqm ? `${unit.size_sqm} m²` : "Keluasan tiada"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Maklumat unit */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Maklumat Unit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Baris label="Sewa bulanan" nilai={formatRM(unit.rent_amount)} />
            <Baris label="Deposit" nilai={formatRM(unit.deposit_amount)} />
            <Baris
              label="Bilik / Bilik Air"
              nilai={
                unit.bedrooms != null || unit.bathrooms != null
                  ? `${unit.bedrooms ?? "—"} / ${unit.bathrooms ?? "—"}`
                  : null
              }
            />
            <Baris label="Nota" nilai={unit.notes} />
          </CardContent>
        </Card>

        {/* Penyewa semasa */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Penyewa Semasa</CardTitle>
          </CardHeader>
          <CardContent>
            {penyewa ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/penyewa/${penyewa.id}`}
                    className="flex items-center gap-2 font-medium text-primary hover:underline"
                  >
                    <Users className="size-4" />
                    {penyewa.name}
                  </Link>
                  <Badge variant="outline">{LABEL_TENANCY.ACTIVE}</Badge>
                </div>
                <p className="text-muted-foreground">Telefon: {penyewa.phone ?? "—"}</p>
                <p className="text-muted-foreground">
                  Perjanjian: {formatTarikh(unit.tenancies[0].start_date)}
                  {" – "}
                  {formatTarikh(unit.tenancies[0].end_date)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Unit ini kosong. Belum ada penyewa yang menyewa unit ini.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aduan maintenance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Aduan Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          {unit.maintenance_requests.length === 0 ? (
            <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Tiada aduan untuk unit ini.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {unit.maintenance_requests.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{formatTarikh(m.created_at)}</p>
                  </div>
                  <Badge variant="outline" className={WARNA_STATUS_MAINTENANCE[m.status]}>
                    {m.status === "COMPLAIN"
                      ? "Aduan Baru"
                      : m.status === "IN_PROGRESS"
                        ? "Dalam Proses"
                        : "Selesai"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Baris({ label, nilai }: { label: string; nilai?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{nilai || "—"}</span>
    </div>
  );
}
