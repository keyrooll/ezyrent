import Link from "next/link";
import { Plus } from "lucide-react";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { formatRM } from "@/lib/format";
import { LABEL_PENYEWA } from "@/lib/labels";
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

const PILIHAN_URUTAN = [
  { nilai: "baru", label: "Terbaru" },
  { nilai: "nama", label: "Nama (A–Z)" },
  { nilai: "tunggakan", label: "Tunggakan Tertinggi" },
];

const PILIHAN_STATUS = [
  { nilai: "", label: "Semua Status" },
  { nilai: "ACTIVE", label: "Aktif" },
  { nilai: "INACTIVE", label: "Tidak Aktif" },
];

export default async function PenyewaPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; hartanah?: string; urutan?: string }>;
}) {
  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);
  const { status, hartanah, urutan } = (await searchParams) ?? {};
  const bolehTambah = user.role !== "STAFF";

  const sahStatus = status === "ACTIVE" || status === "INACTIVE" ? status : null;

  const [senaraiHartanah, senarai, tunggakanBaris] = await Promise.all([
    db.property.findMany({
      where: skop ? { id: { in: skop } } : {},
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.tenant.findMany({
      where: {
        ...(sahStatus ? { status: sahStatus } : {}),
        ...(skop ? { tenancies: { some: { unit: { property_id: { in: skop } } } } } : {}),
      },
      include: {
        _count: { select: { tenancies: true } },
        tenancies: {
          include: { unit: { select: { property: { select: { id: true, name: true } } } } },
        },
      },
      orderBy: { created_at: "desc" },
    }),
    // Tunggakan sewa: invois belum selesai dikumpul ikut penyewa
    db.rentInvoice.groupBy({
      by: ["tenant_id"],
      where: {
        status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
        ...(skop ? { unit: { property_id: { in: skop } } } : {}),
      },
      _sum: { amount: true, paid_amount: true },
    }),
  ]);

  const petaTunggakan = new Map(
    tunggakanBaris.map((b) => [
      b.tenant_id,
      Number(b._sum.amount ?? 0) - Number(b._sum.paid_amount ?? 0),
    ])
  );

  // Tapisan hartanah mesti dalam skop staf (kalau ada skop)
  const tapisHartanah = hartanah && (!skop || skop.includes(hartanah)) ? hartanah : null;

  const senaraiTapis = senarai
    .filter((t) => !tapisHartanah || t.tenancies.some((tn) => tn.unit.property.id === tapisHartanah))
    .sort((a, b) => {
      if (urutan === "nama") return a.name.localeCompare(b.name, "ms");
      if (urutan === "tunggakan")
        return (petaTunggakan.get(b.id) ?? 0) - (petaTunggakan.get(a.id) ?? 0);
      return b.created_at.getTime() - a.created_at.getTime();
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Penyewa</h1>
          <p className="text-sm text-muted-foreground">{senaraiTapis.length} penyewa</p>
        </div>
        {bolehTambah && (
          <Button asChild>
            <Link href="/dashboard/penyewa/baru">
              <Plus className="mr-2 size-4" />
              Tambah Penyewa
            </Link>
          </Button>
        )}
      </div>

      {/* Tapisan & susunan */}
      <form method="GET" className="flex flex-wrap items-center gap-2">
        <select
          name="hartanah"
          defaultValue={tapisHartanah ?? ""}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Semua Hartanah</option>
          {senaraiHartanah.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={sahStatus ?? ""}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {PILIHAN_STATUS.map((p) => (
            <option key={p.nilai} value={p.nilai}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          name="urutan"
          defaultValue={urutan ?? "baru"}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {PILIHAN_URUTAN.map((p) => (
            <option key={p.nilai} value={p.nilai}>
              Susunan: {p.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Tapis
        </button>
      </form>

      {senaraiTapis.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          Tiada penyewa dijumpai.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Hartanah</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead className="text-right">Tunggakan</TableHead>
                <TableHead>Penyewaan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senaraiTapis.map((t) => {
                const namaHartanah = [...new Set(t.tenancies.map((tn) => tn.unit.property.name))];
                const paparanHartanah =
                  namaHartanah.length > 0
                    ? namaHartanah[0] + (namaHartanah.length > 1 ? ` +${namaHartanah.length - 1}` : "")
                    : "—";
                const tunggakan = petaTunggakan.get(t.id) ?? 0;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/penyewa/${t.id}`}
                        className="text-primary hover:underline"
                      >
                        {t.name}
                      </Link>
                      <span className="block text-xs text-muted-foreground">{t.email ?? "—"}</span>
                    </TableCell>
                    <TableCell>{paparanHartanah}</TableCell>
                    <TableCell className="whitespace-nowrap">{t.phone ?? "—"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {tunggakan > 0 ? (
                        <span className="font-semibold text-red-600">{formatRM(tunggakan)}</span>
                      ) : (
                        <span className="text-emerald-600">Lunas</span>
                      )}
                    </TableCell>
                    <TableCell>{t._count.tenancies}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{LABEL_PENYEWA[t.status]}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
