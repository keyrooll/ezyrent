import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Hidangkan avatar pengguna — hanya pemilik avatar atau super admin */
export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const sesi = await auth();
  if (!sesi?.user) return NextResponse.json({ ralat: "Tidak dibenarkan." }, { status: 401 });

  if (sesi.user.id !== userId && sesi.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ralat: "Tidak dibenarkan." }, { status: 403 });
  }

  const pengguna = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar_url: true },
  });
  if (!pengguna?.avatar_url) return NextResponse.json({ ralat: "Tiada avatar." }, { status: 404 });

  const mutlak = path.resolve(process.cwd(), pengguna.avatar_url);
  const akar = path.resolve(process.cwd(), "uploads");
  if (!mutlak.startsWith(akar)) {
    return NextResponse.json({ ralat: "Laluan tidak sah." }, { status: 403 });
  }

  try {
    const data = await fs.readFile(mutlak);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ ralat: "Fail tidak dijumpai." }, { status: 404 });
  }
}
