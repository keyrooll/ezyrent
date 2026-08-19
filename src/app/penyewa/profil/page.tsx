import { requirePenyewa, pilihanPaparan } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { PenukarPaparan } from "@/components/dashboard/penukar-paparan";
import { ProfilFormPenyewa } from "./profil-form";

export const dynamic = "force-dynamic";

export default async function ProfilPenyewaPage() {
  const { user, tenantId, db } = await requirePenyewa();

  const [pengguna, penyewa, pending, paparan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, phone: true, avatar_url: true },
    }),
    db.tenant.findUnique({ where: { id: tenantId } }),
    db.profileUpdateRequest.findFirst({
      where: { tenant_id: tenantId, status: "PENDING" },
    }),
    pilihanPaparan(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil Saya</h1>
        <p className="text-sm text-muted-foreground">
          Kemaskini maklumat akaun anda — perubahan perlu kelulusan tuan rumah
        </p>
      </div>

      <PenukarPaparan
        tajuk="Paparan"
        huraian="Anda berdaftar untuk lebih daripada satu peranan. Pilih paparan yang anda mahu gunakan."
        senarai={paparan}
      />

      <ProfilFormPenyewa
        id={user.id}
        nama={pengguna?.name ?? user.name ?? ""}
        email={pengguna?.email ?? ""}
        telefon={pengguna?.phone ?? ""}
        avatarUrl={pengguna?.avatar_url ?? null}
        emergencyContact={penyewa?.emergency_contact ?? ""}
        emergencyPhone={penyewa?.emergency_phone ?? ""}
        emergencyAddress={penyewa?.emergency_address ?? ""}
        emergencyRelationship={penyewa?.emergency_relationship ?? ""}
        pending={pending}
      />
    </div>
  );
}
