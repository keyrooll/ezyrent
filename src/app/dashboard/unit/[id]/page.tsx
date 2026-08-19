import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { formatRM, formatTarikh, formatTarikhPendek } from "@/lib/format";
import { LABEL_UNIT, LABEL_TENANCY } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BilUnitForm } from "./bil-unit-form";
import { EditBilUnitDialog, PadamBilUnitDialog } from "./bil-unit-actions";

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

const STATUS_BIL: Record<string, { label: string; kelas: string }> = {
  UNPAID: { label: "Belum Dibayar", kelas: "bg-red-500/10 text-red-700" },
  PENDING_PROOF: { label: "Menunggu Pengesahan", kelas: "bg-amber-500/10 text-amber-700" },
  PAID: { label: "Disahkan", kelas: "bg-emerald-500/10 text-emerald-700" },
};

const BULAN_MELAYU = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember",
];

function formatBulan(bulan: string) {
  const [tahun, bln] = bulan.split("-");
  return `${BULAN_MELAYU[Number(bln) - 1] ?? bln} ${tahun}`;
}

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
      invoices: {
        where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        orderBy: { due_date: "asc" },
        take: 1,
        select: { due_date: true, invoice_no: true, amount: true },
      },
      maintenance_requests: {
        orderBy: { created_at: "desc" },
        take: 5,
      },
      utility_bils: {
        orderBy: [{ bulan: "desc" }, { created_at: "desc" }],
        include: { tenant: { select: { name: true } } },
      },
    },
  });

  if (!unit || (skop && !skop.includes(unit.property_id))) notFound();

  const tenancy = unit.tenancies[0] ?? null;
  const penyewa = tenancy?.tenant ?? null;
  const invoisSeterusnya = unit.invoices[0] ?? null;

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
                  Perjanjian: {formatTarikh(tenancy.start_date)}
                  {" – "}
                  {formatTarikh(tenancy.end_date)}
                </p>
                <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Jatuh Tempoh Sewa</p>
                  <p>
                    Hari jatuh tempoh:{" "}
                    <span className="font-semibold">{tenancy.rent_due_day} haribulan</span>
                  </p>
                  {invoisSeterusnya ? (
                    <p className="text-muted-foreground">
                      Invois seterusnya: {formatTarikhPendek(invoisSeterusnya.due_date)} ·{" "}
                      {formatRM(invoisSeterusnya.amount)}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Tiada invois tertunggak.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Unit ini kosong. Belum ada penyewa yang menyewa unit ini.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Utiliti */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Utiliti ({unit.utility_bils.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {penyewa ? (
            <div className="max-w-sm">
              <BilUnitForm unitId={unit.id} tenantId={penyewa.id} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tiada penyewa aktif — bil utiliti perlu ditambah dari halaman Utiliti.
            </p>
          )}

          {unit.utility_bils.length === 0 ? (
            <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Tiada bil utiliti untuk unit ini.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Bulan</th>
                    <th className="px-3 py-2.5 font-medium">Penyewa</th>
                    <th className="px-3 py-2.5 font-medium">Amaun</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 text-right font-medium">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {unit.utility_bils.map((bil) => {
                    const info = STATUS_BIL[bil.status] ?? STATUS_BIL.UNPAID;
                    return (
                      <tr key={bil.id}>
                        <td className="whitespace-nowrap px-3 py-2.5 font-medium">
                          {formatBulan(bil.bulan)}
                        </td>
                        <td className="px-3 py-2.5">{bil.tenant.name}</td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          {formatRM(Number(bil.amount))}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={info.kelas}>
                            {info.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <EditBilUnitDialog
                              bilId={bil.id}
                              bulan={bil.bulan}
                              amaun={Number(bil.amount)}
                            />
                            <PadamBilUnitDialog bilId={bil.id} label={formatBulan(bil.bulan)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
