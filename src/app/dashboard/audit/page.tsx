import { requireLandlord } from "@/lib/sesi";
import { formatTarikh } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const LABEL_TINDAKAN: Record<string, string> = {
  "payment.verify": "Sahkan pembayaran",
  "payment.reject": "Tolak pembayaran",
  "invitation.create": "Cipta jemputan",
  "invitation.revoke": "Batalkan jemputan",
  "tenancy.create": "Cipta penyewaan",
  "unit.create": "Cipta unit",
  "tenant.create": "Cipta penyewa",
  "property.create": "Cipta hartanah",
};

export default async function AuditPage() {
  const { db, landlordId } = await requireLandlord();

  const log = await db.auditLog.findMany({
    where: { landlord_id: landlordId },
    include: { actor: { select: { name: true } } },
    orderBy: { created_at: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Rekod tindakan penting dalam akaun anda.</p>
      </div>

      {log.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          Tiada rekod audit lagi.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarikh</TableHead>
                <TableHead>Pelaku</TableHead>
                <TableHead>Tindakan</TableHead>
                <TableHead>Entiti</TableHead>
                <TableHead>Butiran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap">{formatTarikh(l.created_at)}</TableCell>
                  <TableCell>{l.actor.name}</TableCell>
                  <TableCell>{LABEL_TINDAKAN[l.action] ?? l.action}</TableCell>
                  <TableCell className="text-muted-foreground">{l.entity_type}</TableCell>
                  <TableCell className="max-w-60 truncate text-muted-foreground">
                    {l.meta ? JSON.stringify(l.meta) : "—"}
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
