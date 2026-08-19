import { Check, X } from "lucide-react";
import { requireLandlord } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { formatTarikh } from "@/lib/format";
import { lulusForm, tolakForm } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function KelulusanPage() {
  const { user, db } = await requireLandlord();

  // Staf hanya urus permohonan penyewa; permohonan staf hanya untuk landlord
  const permohonan = await db.profileUpdateRequest.findMany({
    where: {
      status: "PENDING",
      ...(user.role === "STAFF" ? { jenis: "TENANT" } : {}),
    },
    orderBy: { created_at: "desc" },
  });

  // Nama pemohon
  const idsPengguna = [...new Set(permohonan.map((p) => p.user_id))];
  const pengguna = await prisma.user.findMany({
    where: { id: { in: idsPengguna } },
    select: { id: true, name: true },
  });
  const petaNama = new Map(pengguna.map((u) => [u.id, u.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kelulusan Profil</h1>
        <p className="text-sm text-muted-foreground">
          Permohonan kemaskini profil daripada penyewa &amp; staf
        </p>
      </div>

      {permohonan.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Tiada permohonan menunggu kelulusan.
          </CardContent>
        </Card>
      ) : (
        permohonan.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">
                  {petaNama.get(p.user_id) ?? "Pemohon"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{p.jenis === "TENANT" ? "Penyewa" : "Staf"}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTarikh(p.created_at)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Nama</dt>
                  <dd className="font-medium">{p.nama}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Telefon</dt>
                  <dd className="font-medium">{p.telefon ?? "—"}</dd>
                </div>
                {(p.jenis === "TENANT" || p.jenis === "STAFF") && (
                  <>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Kontak kecemasan</dt>
                      <dd className="font-medium">{p.emergency_contact ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Telefon kecemasan</dt>
                      <dd className="font-medium">{p.emergency_phone ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Hubungan</dt>
                      <dd className="font-medium">{p.emergency_relationship ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Alamat</dt>
                      <dd className="font-medium">{p.emergency_address ?? "—"}</dd>
                    </div>
                  </>
                )}
              </dl>

              <div className="flex gap-2">
                <form action={lulusForm}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit" size="sm">
                    <Check className="mr-2 size-4" />
                    Lulus
                  </Button>
                </form>
                <form action={tolakForm}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit" size="sm" variant="outline">
                    <X className="mr-2 size-4" />
                    Tolak
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
