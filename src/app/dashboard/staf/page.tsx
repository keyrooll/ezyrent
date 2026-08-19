import Link from "next/link";
import { requireLandlord } from "@/lib/sesi";
import { formatTarikh } from "@/lib/format";
import { nyahaktifStaf } from "./actions";
import { StafForm } from "./staf-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function StafPage() {
  const { db, user } = await requireLandlord();
  const bolehUrus = user.role === "LANDLORD";

  const senarai = await db.staff.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { created_at: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Staf</h1>
        <p className="text-sm text-muted-foreground">
          Akaun staf boleh urus hartanah, penyewa dan pembayaran bagi pihak anda.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {senarai.length === 0 ? (
            <p className="rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
              Tiada staf lagi.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>E-mel</TableHead>
                    <TableHead>Ditambah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {senarai.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/staf/${s.id}`} className="text-primary hover:underline">
                          {s.user.name}
                        </Link>
                      </TableCell>
                      <TableCell>{s.user.email}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatTarikh(s.created_at)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={s.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-700" : "bg-zinc-500/10 text-zinc-700"}
                        >
                          {s.status === "ACTIVE" ? "Aktif" : "Digantung"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {bolehUrus && s.status === "ACTIVE" && (
                          <form action={nyahaktifStaf.bind(null, s.id)}>
                            <Button type="submit" size="sm" variant="outline" className="text-destructive hover:text-destructive">
                              Nyahaktifkan
                            </Button>
                          </form>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {bolehUrus && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Tambah Staf</CardTitle>
              <CardDescription className="text-xs">
                Atau hantar jemputan staf melalui pautan di tab Jemputan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StafForm />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
