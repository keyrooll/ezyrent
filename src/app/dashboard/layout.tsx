import Link from "next/link";
import { Bell } from "lucide-react";
import { requireLandlord } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Brand } from "@/components/brand";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Toaster } from "@/components/ui/sonner";
import { VERSI } from "@/lib/versi";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireLandlord();

  // Bilangan notifikasi belum dibaca untuk loceng header
  const belumBaca = await prisma.notification.count({
    where: { user_id: user.id, is_read: false },
  });

  // Avatar dari DB (token JWT tidak simpan avatar_url)
  const pengguna = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatar_url: true },
  });

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card px-3 py-4 md:flex">
        <Link href="/dashboard" className="mb-6 flex flex-col items-start px-2">
          <Brand className="h-12" />
          <span className="mt-1 text-[10px] leading-none text-muted-foreground">
            EzyRent v{VERSI}
          </span>
        </Link>
        <Sidebar role={user.role} />
        <p className="mt-auto px-2 pt-4 text-xs text-muted-foreground">
          Copy right of Ezyhome Solution 2026
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 md:px-6">
            <Link href="/dashboard" className="flex items-center md:hidden">
              <Brand className="h-9" />
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/dashboard/notifikasi"
                className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label={`Notifikasi (${belumBaca} belum dibaca)`}
              >
                <Bell className="size-4" />
                {belumBaca > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {belumBaca > 99 ? "99+" : belumBaca}
                  </span>
                )}
              </Link>
              <UserMenu
                nama={user.name ?? "Pengguna"}
                email={user.email ?? ""}
                role={user.role}
                profilHref="/dashboard/profil"
                avatarSrc={pengguna?.avatar_url ? `/api/v1/avatar/${user.id}` : null}
              />
            </div>
          </div>
          {/* Nav mobile */}
          <div className="border-t px-4 py-2 md:hidden">
            <Sidebar role={user.role} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
