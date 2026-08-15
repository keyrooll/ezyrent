import Link from "next/link";
import { Plus } from "lucide-react";
import { requireLandlord } from "@/lib/sesi";
import { formatTarikhPendek } from "@/lib/format";
import { LABEL_JEMPUTAN } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const WARNA: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700",
  ACCEPTED: "bg-emerald-500/10 text-emerald-700",
  EXPIRED: "bg-zinc-500/10 text-zinc-700",
  REVOKED: "bg-red-500/10 text-red-700",
};

export default async function JemputanPage() {
  const { db } = await requireLandlord();

  const senarai = await db.invitation.findMany({
    include: {
      unit: { select: { unit_no: true, property: { select: { name: true } } } },
      tenant: { select: { name: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jemputan Penyewa</h1>
          <p className="text-sm text-muted-foreground">
            Jemput penyewa daftar sendiri melalui pautan / kod QR
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jemputan/baru">
            <Plus className="mr-2 size-4" />
            Jemputan Baru
          </Link>
        </Button>
      </div>

      {senarai.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          Belum ada jemputan.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mel</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Dicipta</TableHead>
                <TableHead>Luput</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senarai.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>
                    <Link href={`/dashboard/jemputan/${j.id}`} className="font-medium hover:underline">
                      {j.tenant_email}
                    </Link>
                    {j.tenant && <span className="block text-xs text-muted-foreground">{j.tenant.name}</span>}
                  </TableCell>
                  <TableCell>
                    {j.unit.property.name}
                    <span className="block text-xs text-muted-foreground">{j.unit.unit_no}</span>
                  </TableCell>
                  <TableCell>{formatTarikhPendek(j.created_at)}</TableCell>
                  <TableCell>{formatTarikhPendek(j.expires_at)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={WARNA[j.status]}>
                      {LABEL_JEMPUTAN[j.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
