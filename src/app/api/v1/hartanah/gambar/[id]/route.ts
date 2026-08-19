import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Hidangkan gambar hartanah — landlord/staf/penyewa dalam skop landlord yang sama */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesi = await auth();
  if (!sesi?.user) return NextResponse.json({ ralat: "Tidak dibenarkan." }, { status: 401 });

  const harta = await prisma.property.findUnique({
    where: { id },
    select: { landlord_id: true, image_path: true },
  });
  if (!harta?.image_path) return NextResponse.json({ ralat: "Tiada gambar." }, { status: 404 });

  // Super admin atau sesi dalam landlord yang sama sahaja
  if (sesi.user.role !== "SUPER_ADMIN" && sesi.user.landlordId !== harta.landlord_id) {
    return NextResponse.json({ ralat: "Tidak dibenarkan." }, { status: 403 });
  }

  const mutlak = path.resolve(process.cwd(), harta.image_path);
  const akar = path.resolve(process.cwd(), "uploads");
  if (!mutlak.startsWith(akar)) {
    return NextResponse.json({ ralat: "Laluan tidak sah." }, { status: 403 });
  }

  try {
    const data = await fs.readFile(mutlak);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ ralat: "Fail tidak dijumpai." }, { status: 404 });
  }
}
