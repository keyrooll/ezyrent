import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireLandlord } from "@/lib/sesi";
import { formatTarikh } from "@/lib/format";
import { aktifkanStaf, nyahaktifStaf, tukarAssignHartanah, tukarSkopStaf } from "../actions";
import { StafEditForm } from "./staf-edit-form";
import { StafKecemasanForm } from "./staf-kecemasan-form";
import { BorangDokumenStaf } from "./borang-dokumen-staf";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const LABEL_DOKUMEN: Record<string, string> = {
  STAFF_IC: "Kad Pengenalan",
  STAFF_AGREEMENT: "Perjanjian Pekerjaan",
  OTHER: "Lain-lain",
};

const KATEGORI_DOKUMEN = ["STAFF_IC", "STAFF_AGREEMENT", "OTHER"] as const;

export default async function StafDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, db } = await requireLandlord();
  const bolehUrus = user.role === "LANDLORD";

  const staf = await db.staff.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, avatar_url: true } },
      property_grants: { include: { property: { select: { id: true, name: true } } } },
      documents: { orderBy: { created_at: "desc" } },
    },
  });

  if (!staf) notFound();

  const semuaHartanah = await db.property.findMany({ orderBy: { name: "asc" } });
  const setAssigned = new Set(staf.property_grants.map((g) => g.property_id));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/staf"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Semua Staf
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{staf.user.name}</h1>
            <Badge
              variant="outline"
              className={
                staf.status === "ACTIVE"
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-zinc-500/10 text-zinc-700"
              }
            >
              {staf.status === "ACTIVE" ? "Aktif" : "Digantung"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {staf.user.email} · Ditambah {formatTarikh(staf.created_at)}
          </p>
        </div>
        {bolehUrus &&
          (staf.status === "ACTIVE" ? (
            <form action={nyahaktifStaf.bind(null, staf.id)}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                Nyahaktifkan
              </Button>
            </form>
          ) : (
            <form action={aktifkanStaf.bind(null, staf.id)}>
              <Button type="submit" variant="outline" size="sm">
                Aktifkan Semula
              </Button>
            </form>
          ))}
      </div>

      {bolehUrus ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit Maklumat</CardTitle>
            <CardDescription>Kemaskini nama dan telefon staf</CardDescription>
          </CardHeader>
          <CardContent>
            <StafEditForm
              staffId={staf.id}
              nama={staf.user.name}
              telefon={staf.user.phone ?? ""}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maklumat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Telefon: </span>
              {staf.user.phone ?? "—"}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maklumat Kecemasan</CardTitle>
          <CardDescription>
            {bolehUrus
              ? "Kontak yang perlu dihubungi semasa kecemasan"
              : "Hubungi tuan rumah untuk mengemas kini maklumat ini"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bolehUrus ? (
            <StafKecemasanForm
              staffId={staf.id}
              nama={staf.emergency_contact ?? ""}
              telefon={staf.emergency_phone ?? ""}
              alamat={staf.emergency_address ?? ""}
              hubungan={staf.emergency_relationship ?? ""}
            />
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Nama Kontak</dt>
                <dd className="font-medium">{staf.emergency_contact ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">No. Telefon</dt>
                <dd className="font-medium">{staf.emergency_phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Hubungan</dt>
                <dd className="font-medium">{staf.emergency_relationship ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Alamat</dt>
                <dd className="font-medium">{staf.emergency_address ?? "—"}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dokumen</CardTitle>
          <CardDescription>
            IC, perjanjian pekerjaan dan dokumen lain milik staf
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {KATEGORI_DOKUMEN.map((kategori) => {
            const senarai = staf.documents.filter((d) => d.category === kategori);
            return (
              <div key={kategori} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{LABEL_DOKUMEN[kategori]}</h3>
                  {bolehUrus && <BorangDokumenStaf staffId={staf.id} kategori={kategori} />}
                </div>
                {senarai.length === 0 ? (
                  <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
                    Tiada dokumen
                  </p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {senarai.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{d.original_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTarikh(d.created_at)} ·{" "}
                            {d.size_bytes >= 1024 * 1024
                              ? `${(d.size_bytes / (1024 * 1024)).toFixed(1)} MB`
                              : `${Math.max(1, Math.round(d.size_bytes / 1024))} KB`}
                          </span>
                        </span>
                        <Link
                          href={`/api/v1/dokumen/${d.id}`}
                          className="shrink-0 text-xs font-medium text-primary hover:underline"
                        >
                          Muat Turun
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Skop Urusan</CardTitle>
              <CardDescription>
                {staf.manage_all
                  ? "Staf ini mengurus semua hartanah"
                  : "Staf ini terhad kepada hartanah tertentu sahaja"}
              </CardDescription>
            </div>
            {bolehUrus && (
              <form action={tukarSkopStaf.bind(null, staf.id, !staf.manage_all)}>
                <Button type="submit" variant="outline" size="sm">
                  {staf.manage_all ? "Hadkan kepada Hartanah Tertentu" : "Benarkan Urus Semua"}
                </Button>
              </form>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!bolehUrus && (
            <Badge variant="outline" className="mb-3">
              {staf.manage_all ? "Urus Semua Hartanah" : `${staf.property_grants.length} hartanah ditugaskan`}
            </Badge>
          )}
          {semuaHartanah.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tiada hartanah didaftarkan.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {semuaHartanah.map((h) => {
                const ditetapkan = setAssigned.has(h.id);
                return (
                  <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="font-medium">{h.name}</span>
                    {bolehUrus ? (
                      <form
                        action={tukarAssignHartanah.bind(null, staf.id, h.id, !ditetapkan)}
                      >
                        <button
                          type="submit"
                          className={
                            ditetapkan
                              ? "rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                              : "rounded-md border border-input px-2.5 py-1 text-xs hover:bg-accent"
                          }
                        >
                          {ditetapkan ? "Ditugaskan ✓" : "Tugaskan"}
                        </button>
                      </form>
                    ) : ditetapkan ? (
                      <Badge variant="outline">Ditugaskan</Badge>
                    ) : null}
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
