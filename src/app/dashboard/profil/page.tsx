import { requireLandlord, pilihanPaparan } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { PenukarPaparan } from "@/components/dashboard/penukar-paparan";
import { ProfilForm } from "./profil-form";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const { user, db } = await requireLandlord();

  // Ambil avatar & telefon dari DB — token JWT tidak menyimpan nilai ini
  const [pengguna, pending, staf, paparan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, phone: true, avatar_url: true, role: true },
    }),
    user.role === "STAFF"
      ? db.profileUpdateRequest.findFirst({
          where: { user_id: user.id, status: "PENDING" },
        })
      : null,
    user.role === "STAFF"
      ? prisma.staff.findUnique({
          where: { user_id: user.id },
          select: {
            emergency_contact: true,
            emergency_phone: true,
            emergency_address: true,
            emergency_relationship: true,
          },
        })
      : null,
    pilihanPaparan(user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil Saya</h1>
        <p className="text-sm text-muted-foreground">
          {user.role === "STAFF"
            ? "Kemaskini maklumat akaun anda — perubahan perlu kelulusan tuan rumah"
            : "Kemaskini maklumat akaun anda"}
        </p>
      </div>

      <PenukarPaparan
        tajuk="Paparan"
        huraian="Anda berdaftar untuk lebih daripada satu peranan. Pilih paparan yang anda mahu gunakan."
        senarai={paparan}
      />

      <ProfilForm
        id={user.id}
        nama={pengguna?.name ?? user.name ?? ""}
        email={pengguna?.email ?? ""}
        telefon={pengguna?.phone ?? ""}
        avatarUrl={pengguna?.avatar_url ?? null}
        ialahStaf={user.role === "STAFF"}
        kecemasan={{
          nama: staf?.emergency_contact ?? "",
          telefon: staf?.emergency_phone ?? "",
          alamat: staf?.emergency_address ?? "",
          hubungan: staf?.emergency_relationship ?? "",
        }}
        pending={pending}
      />
    </div>
  );
}
