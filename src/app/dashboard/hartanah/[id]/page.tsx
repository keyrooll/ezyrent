import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Plus } from "lucide-react";
import { requireLandlord } from "@/lib/sesi";
import { formatRM } from "@/lib/format";
import { LABEL_JENIS_HARTANAH, LABEL_HARTANAH, LABEL_UNIT } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const WARNA_UNIT: Record<string, string> = {
  VACANT: "bg-emerald-500/10 text-emerald-700",
  OCCUPIED: "bg-blue-500/10 text-blue-700",
  MAINTENANCE: "bg-amber-500/10 text-amber-700",
  RESERVED: "bg-purple-500/10 text-purple-700",
};

export default async function HartanahDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await requireLandlord();

  const harta = await db.property.findUnique({
    where: { id },
    include: {
      units: { orderBy: { unit_no: "asc" } },
    },
  });

  if (!harta) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/hartanah"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Semua Hartanah
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{harta.name}</h1>
            <Badge variant="outline">{LABEL_HARTANAH[harta.status]}</Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {harta.street}, {harta.postcode} {harta.city}, {harta.state}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{LABEL_JENIS_HARTANAH[harta.type]}</p>
          {harta.description && <p className="mt-2 max-w-xl text-sm">{harta.description}</p>}
        </div>
        <Button asChild>
          <Link href={`/dashboard/unit/baru?hartanah=${harta.id}`}>
            <Plus className="mr-2 size-4" />
            Tambah Unit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Unit ({harta.units.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {harta.units.length === 0 ? (
            <p className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              Tiada unit lagi dalam hartanah ini.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Unit</TableHead>
                  <TableHead className="text-right">Sewa</TableHead>
                  <TableHead className="text-right">Deposit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {harta.units.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.unit_no}</TableCell>
                    <TableCell className="text-right">{formatRM(u.rent_amount)}</TableCell>
                    <TableCell className="text-right">{formatRM(u.deposit_amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={WARNA_UNIT[u.status]}>
                        {LABEL_UNIT[u.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
