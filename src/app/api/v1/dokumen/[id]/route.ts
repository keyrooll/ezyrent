import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireLandlord } from "@/lib/sesi";

/** Hidangkan dokumen (bukti bayaran dll.) — terhad kepada landlord/staf sahaja */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await requireLandlord();

  const dokumen = await db.document.findUnique({ where: { id } });
  if (!dokumen) return NextResponse.json({ ralat: "Dokumen tidak dijumpai." }, { status: 404 });

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
