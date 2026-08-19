import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/** Halaman utama ikut role */
const RUMAH_IKUT_ROLE: Record<string, string> = {
  SUPER_ADMIN: "/admin",
  LANDLORD: "/dashboard",
  STAFF: "/dashboard",
  TENANT: "/penyewa",
};

export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user;

  // Belum log masuk → halaman login (halaman login & daftar dibenarkan)
  if (!user) {
    if (nextUrl.pathname === "/login" || nextUrl.pathname.startsWith("/daftar")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  const rumah = RUMAH_IKUT_ROLE[user.role] ?? "/login";

  // Sudah log masuk tetapi buka /login → pulang ke dashboard masing-masing
  if (nextUrl.pathname === "/login" || nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL(rumah, nextUrl));
  }

  // Kawasan diasingkan di peringkat halaman (requireLandlord / requirePenyewa /
  // requireSuperAdmin) — kerana paparan peranan (view_role) disemak dari DB
  // dan middleware hanya nampak role dalam JWT.
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/penyewa/:path*", "/login", "/"],
};
