import Link from "next/link";
import { Plus, MapPin } from "lucide-react";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { LABEL_JENIS_HARTANAH, LABEL_HARTANAH } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HartanahPage() {
  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);
  const bolehTambah = user.role !== "STAFF";

  const senarai = await db.property.findMany({
    where: skop ? { id: { in: skop } } : {},
    include: { _count: { select: { units: true } } },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hartanah</h1>
          <p className="text-sm text-muted-foreground">{senarai.length} hartanah didaftarkan</p>
        </div>
        {bolehTambah && (
          <Button asChild>
            <Link href="/dashboard/hartanah/baru">
              <Plus className="mr-2 size-4" />
              Tambah Hartanah
            </Link>
          </Button>
        )}
      </div>

      {senarai.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {bolehTambah
                ? "Belum ada hartanah. Tambah hartanah pertama anda untuk bermula."
                : "Belum ada hartanah. Tuan rumah belum menambah hartanah lagi."}
            </p>
            {bolehTambah && (
              <Button asChild>
                <Link href="/dashboard/hartanah/baru">
                  <Plus className="mr-2 size-4" />
                  Tambah Hartanah
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {senarai.map((h) => (
            <Link key={h.id} href={`/dashboard/hartanah/${h.id}`}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                {h.image_path && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/v1/hartanah/gambar/${h.id}`}
                    alt={h.name}
                    className="h-36 w-full object-cover"
                  />
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{h.name}</CardTitle>
                    <Badge variant="outline">{LABEL_HARTANAH[h.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" />
                    {h.street}, {h.postcode} {h.city}, {h.state}
                  </p>
                  <p>
                    {LABEL_JENIS_HARTANAH[h.type]} • {h._count.units} unit
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
