import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireLandlord, requirePenyewa } from "@/lib/sesi";

const KATEGORI_PENYEWA = ["TENANT_IC", "TENANCY_AGREEMENT", "UTILITY_BILL"];

/**
 * Hidangkan dokumen (bukti bayaran dll.).
 * Landlord/staf: semua dokumen milik landlord semasa.
 * Penyewa: hanya dokumen sendiri (tenant_id padan) dalam kategori yang dibenarkan.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let db: Awaited<ReturnType<typeof requireLandlord>>["db"];
  let pemilikTenant: string | null = null;
  try {
    ({ db } = await requireLandlord());
  } catch {
    const sesi = await requirePenyewa();
    db = sesi.db;
    pemilikTenant = sesi.tenantId;
  }

  const dokumen = await db.document.findUnique({ where: { id } });
  if (!dokumen) return NextResponse.json({ ralat: "Dokumen tidak dijumpai." }, { status: 404 });

  // Penyewa hanya boleh akses dokumen sendiri (IC, perjanjian, bil utiliti)
  if (pemilikTenant) {
    if (dokumen.tenant_id !== pemilikTenant || !KATEGORI_PENYEWA.includes(dokumen.category)) {
      return NextResponse.json({ ralat: "Akses ditolak." }, { status: 403 });
    }
  }

  const mutlak = path.resolve(process.cwd(), dokumen.stored_path);
  const akar = path.resolve(process.cwd(), "uploads");
  if (!mutlak.startsWith(akar)) {
    return NextResponse.json({ ralat: "Laluan tidak sah." }, { status: 403 });
  }

  try {
    const data = await fs.readFile(mutlak);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": dokumen.mime_type,
        "Content-Disposition": `inline; filename="${dokumen.original_name.replace(/["\\]/g, "")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ ralat: "Fail tidak dijumpai." }, { status: 404 });
  }
}
