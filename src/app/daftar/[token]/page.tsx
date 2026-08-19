import { prisma } from "@/lib/prisma";
import { TerimaJemputanForm } from "./terima-form";
import { TerimaJemputanStafForm } from "./terima-staf-form";

export const dynamic = "force-dynamic";

export default async function DaftarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const jemputan = await prisma.invitation.findUnique({
    where: { token },
    include: { unit: { include: { property: true } } },
  });

  const sah = jemputan && jemputan.status === "PENDING" && jemputan.expires_at > new Date();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
          E
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">EzyRent</h1>
      </div>
      <div className="w-full max-w-sm">
        {!sah ? (
          <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold">Jemputan Tidak Sah</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pautan ini tidak sah atau telah tamat tempoh (24 jam). Sila minta tuan rumah menghantar
              jemputan baharu.
            </p>
          </div>
        ) : jemputan.role === "STAFF" ? (
          <TerimaJemputanStafForm token={token} email={jemputan.tenant_email} />
        ) : (
          <TerimaJemputanForm
            token={token}
            email={jemputan.tenant_email}
            unitLabel={`${jemputan.unit!.property.name} — ${jemputan.unit!.unit_no}`}
          />
        )}
      </div>
    </div>
  );
}
