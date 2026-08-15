import { requireSuperAdmin } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { formatRM, formatTarikh } from "@/lib/format";
import { LABEL_STATUS_LANDLORD } from "@/lib/labels";
import { tukarStatusLandlord } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default async function AdminPage() {
  await requireSuperAdmin();

  const [jumlahLandlord, jumlahUnit, tenancyAktif, senarai] = await Promise.all([
    prisma.landlord.count(),
    prisma.unit.count(),
    prisma.tenancy.count({ where: { status: "ACTIVE" } }),
    prisma.landlord.findMany({
      include: { owner: { select: { name: true, email: true } } },
      orderBy: { created_at: "desc" },
    }),
  ]);

  const jumlahSewa = tenancyAktif; // proksi MRR: jumlah tenancy aktif (rent snapshot di Tenancy)
  const mrr = await prisma.tenancy.aggregate({ where: { status: "ACTIVE" }, _sum: { rent_amount: true } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Papan Pemuka Admin</h1>
        <p className="text-sm text-muted-foreground">Gambaran keseluruhan platform EzyRent.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Landlord</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{jumlahLandlord}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Jumlah Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{jumlahUnit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Tenancy Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{jumlahSewa}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Sewa Bulanan (MRR)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatRM(mrr._sum.rent_amount ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Perniagaan</TableHead>
              <TableHead>Pemilik</TableHead>
              <TableHead>Pelan</TableHead>
              <TableHead className="text-right">Had Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trial Tamat</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {senarai.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.business_name}</TableCell>
                <TableCell>
                  {l.owner.name}
                  <span className="block text-xs text-muted-foreground">{l.owner.email}</span>
                </TableCell>
                <TableCell>{l.plan_code}</TableCell>
                <TableCell className="text-right">{l.unit_limit}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      l.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-700"
                        : l.status === "SUSPENDED"
                          ? "bg-red-500/10 text-red-700"
                          : "bg-amber-500/10 text-amber-700"
                    }
                  >
                    {LABEL_STATUS_LANDLORD[l.status]}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {l.trial_ends_at ? formatTarikh(l.trial_ends_at) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {l.status === "SUSPENDED" ? (
                    <form action={tukarStatusLandlord.bind(null, l.id, "ACTIVE")}>
                      <Button type="submit" size="sm" variant="outline">
                        Aktifkan
                      </Button>
                    </form>
                  ) : l.status === "TRIAL" || l.status === "ACTIVE" ? (
                    <form action={tukarStatusLandlord.bind(null, l.id, "SUSPENDED")}>
                      <Button type="submit" size="sm" variant="outline" className="text-destructive hover:text-destructive">
                        Gantung
                      </Button>
                    </form>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
