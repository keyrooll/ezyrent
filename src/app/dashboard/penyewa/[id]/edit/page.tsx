import { notFound } from "next/navigation";
import { requireLandlord } from "@/lib/sesi";
import { PenyewaEditForm } from "./penyewa-form";

export const dynamic = "force-dynamic";

export default async function PenyewaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await requireLandlord();

  const penyewa = await db.tenant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      ic_no: true,
      occupation: true,
      emergency_contact: true,
      emergency_phone: true,
    },
  });

  if (!penyewa) notFound();

  return <PenyewaEditForm penyewa={penyewa} />;
}
