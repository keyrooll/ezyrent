import { CheckCheck } from "lucide-react";
import { requireLandlord } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { formatTarikh } from "@/lib/format";
import { tandaSemuaBaca, tandaBaca } from "./actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotifikasiPage() {
  const { user } = await requireLandlord();

  const senarai = await prisma.notification.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    take: 50,
  });
  const belumBaca = senarai.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifikasi</h1>
          <p className="text-sm text-muted-foreground">
            {belumBaca > 0 ? `${belumBaca} belum dibaca` : "Semua dibaca"}
          </p>
        </div>
        {belumBaca > 0 && (
          <form action={tandaSemuaBaca}>
            <Button type="submit" variant="outline" size="sm">
              <CheckCheck className="mr-1.5 size-4" />
              Tanda Semua Dibaca
            </Button>
          </form>
        )}
      </div>

      {senarai.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          Tiada notifikasi lagi.
        </p>
      ) : (
        <div className="space-y-2">
          {senarai.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start justify-between gap-4 rounded-lg border px-4 py-3",
                !n.is_read && "border-primary/40 bg-primary/5"
              )}
            >
              <div>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatTarikh(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <form action={tandaBaca.bind(null, n.id)}>
                  <Button type="submit" variant="ghost" size="sm">
                    Tanda Dibaca
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
