import Link from "next/link";
import { Banknote, FileText, ReceiptText } from "lucide-react";
import { requireLandlord, skopHartanahStaf } from "@/lib/sesi";
import { formatRM, formatTarikhPendek } from "@/lib/format";
import { LABEL_EXPENSE, type ExpenseCategory } from "@/lib/labels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpenseForm } from "./expense-form";
import { PadamExpenseDialog } from "./padam-expense-dialog";

export const dynamic = "force-dynamic";

const PILIHAN_KATEGORI = [
  { nilai: "", label: "Semua Kategori" },
  ...Object.entries(LABEL_EXPENSE).map(([nilai, label]) => ({ nilai, label })),
];

const PILIHAN_URUTAN = [
  { nilai: "baru", label: "Terbaru" },
  { nilai: "lama", label: "Terlama" },
];

export default async function PerbelanjaanPage({
  searchParams,
}: {
  searchParams?: Promise<{ kategori?: string; bulan?: string; urutan?: string }>;
}) {
  const { db, user } = await requireLandlord();
  const skop = await skopHartanahStaf(db, user);
  const { kategori, bulan, urutan } = (await searchParams) ?? {};

  const urut = urutan === "lama" ? "lama" : "baru";

  const sahKategori = (Object.keys(LABEL_EXPENSE) as string[]).includes(kategori ?? "");
  const sahBulan = /^\d{4}-\d{2}$/.test(bulan ?? "");
  const filterBulan = sahBulan
    ? (() => {
        const [thn, bln] = bulan!.split("-").map(Number);
        return { gte: new Date(thn, bln - 1, 1), lte: new Date(thn, bln, 0) };
      })()
    : undefined;

  const [expenses, properties, units, aduan] = await Promise.all([
    db.expense.findMany({
      where: {
        ...(skop ? { property_id: { in: skop } } : {}),
        ...(sahKategori ? { category: kategori as ExpenseCategory } : {}),
        ...(filterBulan ? { expense_date: filterBulan } : {}),
      },
      include: {
        property: { select: { name: true } },
        unit: { select: { unit_no: true } },
        maintenance_request: { select: { title: true } },
        documents: { where: { category: "EXPENSE_RECEIPT" }, select: { id: true, original_name: true } },
      },
      orderBy:
        urut === "lama"
          ? [{ expense_date: "asc" }, { created_at: "asc" }]
          : [{ expense_date: "desc" }, { created_at: "desc" }],
    }),
    db.property.findMany({
      where: skop ? { id: { in: skop } } : {},
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.unit.findMany({
      where: skop ? { property_id: { in: skop } } : {},
      include: { property: { select: { name: true } } },
      orderBy: [{ property: { name: "asc" } }, { unit_no: "asc" }],
    }),
    db.maintenanceRequest.findMany({
      where: skop ? { unit: { property_id: { in: skop } } } : {},
      include: { unit: { select: { unit_no: true, property: { select: { name: true } } } } },
      orderBy: { created_at: "desc" },
    }),
  ]);

  const pilihanHartanah = properties.map((p) => ({ id: p.id, label: p.name }));
  const pilihanUnit = units.map((u) => ({ id: u.id, label: `${u.property.name} ${u.unit_no}` }));
  const pilihanAduan = aduan.map((a) => ({
    id: a.id,
    label: `${a.title} (${a.unit.property.name} ${a.unit.unit_no})`,
  }));

  const jumlah = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const kad = [
    { label: "Jumlah Perbelanjaan", nilai: formatRM(jumlah), ikon: Banknote },
    { label: "Bilangan Rekod", nilai: String(expenses.length), ikon: ReceiptText },
    {
      label: "Purata",
      nilai: expenses.length ? formatRM(jumlah / expenses.length) : formatRM(0),
      ikon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Perbelanjaan</h1>
          <p className="text-sm text-muted-foreground">
            Rekod perbelanjaan hartanah — penyelenggaraan, utiliti, cukai dan lain-lain.
          </p>
        </div>
        <form method="GET" className="flex flex-wrap items-center gap-2">
          <select
            name="kategori"
            defaultValue={kategori ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {PILIHAN_KATEGORI.map((p) => (
              <option key={p.nilai} value={p.nilai}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            name="bulan"
            type="month"
            defaultValue={bulan ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
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
      </div>

      {/* Kad KPI */}
      <div className="grid gap-4 sm:grid-cols-3">
        {kad.map(({ label, nilai, ikon: Ikon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Ikon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{nilai}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tambah expense */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Tambah Perbelanjaan</CardTitle>
            <CardDescription>Kategori mengikut jenis perbelanjaan. Resit pilihan.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseForm hartanah={pilihanHartanah} unit={pilihanUnit} aduan={pilihanAduan} />
          </CardContent>
        </Card>

        {/* Senarai expense */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Senarai Perbelanjaan ({expenses.length})</CardTitle>
            <CardDescription>Jumlah: {formatRM(jumlah)}</CardDescription>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Tiada perbelanjaan dijumpai.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarikh</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Hartanah</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Amaun</TableHead>
                      <TableHead className="text-right">Tindakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((e) => {
                      const resit = e.documents[0];
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatTarikhPendek(e.expense_date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{LABEL_EXPENSE[e.category]}</Badge>
                          </TableCell>
                          <TableCell>{e.property.name}</TableCell>
                          <TableCell>{e.unit?.unit_no ?? "—"}</TableCell>
                          <TableCell>
                            <span className="block max-w-56 truncate">{e.description}</span>
                            {e.vendor && (
                              <span className="block text-xs text-muted-foreground">{e.vendor}</span>
                            )}
                            {e.maintenance_request && (
                              <span className="block text-xs text-muted-foreground">
                                Aduan: {e.maintenance_request.title}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            {formatRM(e.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {resit && (
                                <Link
                                  href={`/api/v1/dokumen/${resit.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                  title={resit.original_name}
                                >
                                  <FileText className="size-4" />
                                </Link>
                              )}
                              <PadamExpenseDialog id={e.id} keterangan={e.description} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
