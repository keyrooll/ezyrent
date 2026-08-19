import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { Brand } from "@/components/brand";
import { UserMenu } from "@/components/dashboard/user-menu";
import { requirePenyewa } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { VERSI } from "@/lib/versi";

export default async function PenyewaLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requirePenyewa();

  const pengguna = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatar_url: true },
  });

  const pautan = [
    { href: "/penyewa", label: "Dashboard" },
    { href: "/penyewa/invois", label: "Invois" },
    { href: "/penyewa/aduan", label: "Aduan" },
    { href: "/penyewa/dokumen", label: "Dokumen" },
  ];

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/penyewa" className="flex flex-col items-start">
              <Brand className="h-10" />
              <span className="mt-0.5 text-[10px] leading-none text-muted-foreground">
                v{VERSI}
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {pautan.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {p.label}
                </Link>
              ))}
            </nav>
          </div>
          <UserMenu
            nama={user.name ?? "Penyewa"}
            email={user.email ?? ""}
            role={user.role}
            profilHref="/penyewa/profil"
            avatarSrc={pengguna?.avatar_url ? `/api/v1/avatar/${user.id}` : null}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Copy right of Ezyhome Solution 2026
      </footer>
      <Toaster richColors />
    </div>
  );
}
