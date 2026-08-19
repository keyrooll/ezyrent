import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Pencil } from "lucide-react";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { formatRM, formatTarikh } from "@/lib/format";
import { LABEL_PENYEWA, LABEL_TENANCY } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BorangDokumen } from "./borang-dokumen";
import { sahkanBilUtility, tolakBilUtility } from "../../utiliti/actions";

export const dynamic = "force-dynamic";

const KATEGORI_DOKUMEN = [
  { kod: "TENANT_IC", nama: "Kad Pengenalan" },
  { kod: "TENANCY_AGREEMENT", nama: "Perjanjian Sewaan" },
  { kod: "UTILITY_BILL", nama: "Bil Air / Elektrik" },
] as const;

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

export default async function PenyewaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);

  const penyewa = await db.tenant.findUnique({
    where: { id },
    include: {
      tenancies: {
        orderBy: { start_date: "desc" },
        include: { unit: { include: { property: { select: { name: true } } } } },
      },
      documents: { orderBy: { created_at: "desc" } },
      utility_bils: { orderBy: { created_at: "desc" } },
    },
  });

  // Staf terhad hanya boleh lihat penyewa yang menyewa unit dalam skop mereka
  if (
    !penyewa ||
    (skop && !penyewa.tenancies.some((t) => skop.includes(t.unit.property_id)))
  ) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/penyewa"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Semua Penyewa
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{penyewa.name}</h1>
            <Badge variant="outline">{LABEL_PENYEWA[penyewa.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Didaftarkan pada {formatTarikh(penyewa.created_at)}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/penyewa/${penyewa.id}/edit`}>
            <Pencil className="mr-2 size-4" />
            Edit Maklumat
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Maklumat peribadi */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Maklumat Penyewa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Baris label="E-mel" nilai={penyewa.email} />
            <Baris label="No. Telefon" nilai={penyewa.phone} />
            <Baris label="No. Kad Pengenalan" nilai={penyewa.ic_no} />
            <Baris label="Pekerjaan" nilai={penyewa.occupation} />
            <Baris label="Kontak Kecemasan" nilai={penyewa.emergency_contact} />
            <Baris label="Telefon Kecemasan" nilai={penyewa.emergency_phone} />
            <Baris label="Hubungan" nilai={penyewa.emergency_relationship} />
            <Baris label="Alamat Kecemasan" nilai={penyewa.emergency_address} />
          </CardContent>
        </Card>

        {/* Penyewaan */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Penyewaan ({penyewa.tenancies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {penyewa.tenancies.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tiada penyewaan aktif.</p>
            ) : (
              <ul className="space-y-3">
                {penyewa.tenancies.map((t) => (
                  <li key={t.id} className="rounded-md border px-3 py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/dashboard/unit/${t.unit_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {t.unit.property.name} — {t.unit.unit_no}
                      </Link>
                      <Badge variant="outline">{LABEL_TENANCY[t.status]}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      Sewa {formatRM(t.rent_amount)}/bulan · Mula {formatTarikh(t.start_date)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dokumen */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dokumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {KATEGORI_DOKUMEN.map((k) => {
            const senarai = penyewa.documents.filter((d) => d.category === k.kod);
            return (
              <section key={k.kod} className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-medium">{k.nama}</h3>
                  <BorangDokumen tenantId={penyewa.id} kategori={k.kod} />
                </div>
                {senarai.length === 0 ? (
                  <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    Tiada dokumen lagi.
                  </p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {senarai.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <a
                          href={`/api/v1/dokumen/${d.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 items-center gap-2 text-primary hover:underline"
                        >
                          <FileText className="size-4 shrink-0" />
                          <span className="truncate">{d.original_name}</span>
                        </a>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatTarikh(d.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </CardContent>
      </Card>

      {/* Bil Utiliti — staff/landlord semak bukti & sahkan */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Bil Utiliti ({penyewa.utility_bils.length})</CardTitle>
          <CardDescription>
            Tambah bil melalui bahagian &quot;Bil Air / Elektrik&quot; di atas. Semak bukti
            pembayaran dan sahkan untuk mengeset bil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {penyewa.utility_bils.length === 0 ? (
            <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              Tiada bil utiliti lagi.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {penyewa.utility_bils.map((bil) => {
                const info = STATUS_BIL[bil.status] ?? STATUS_BIL.UNPAID;
                const bukti = penyewa.documents.find(
                  (d) => d.utility_bil_id === bil.id && d.category === "UTILITY_BILL"
                );
                return (
                  <li
                    key={bil.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {formatBulan(bil.bulan)} · {formatRM(Number(bil.amount))}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={info.kelas}>
                          {info.label}
                        </Badge>
                        {bukti && (
                          <Link
                            href={`/api/v1/dokumen/${bukti.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <FileText className="size-3.5" />
                            Bukti
                          </Link>
                        )}
                      </div>
                    </div>
                    {bil.status === "PENDING_PROOF" && (
                      <div className="flex shrink-0 gap-2">
                        <form action={sahkanBilUtility.bind(null, bil.id)}>
                          <Button type="submit" size="sm">
                            Sahkan
                          </Button>
                        </form>
                        <form action={tolakBilUtility.bind(null, bil.id)}>
                          <Button type="submit" size="sm" variant="outline">
                            Tolak
                          </Button>
                        </form>
                      </div>
                    )}
                  </li>
                );
              })}
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
