import Link from "next/link";
import { Bell } from "lucide-react";
import { requireLandlord } from "@/lib/sesi";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireLandlord();

  // Bilangan notifikasi belum dibaca untuk loceng header
  const belumBaca = await prisma.notification.count({
    where: { user_id: user.id, is_read: false },
  });

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 border-r bg-card px-3 py-4 md:block">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            E
          </span>
          <span className="text-lg font-semibold tracking-tight">EzyRent</span>
        </Link>
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 md:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                E
              </span>
              <span className="font-semibold">EzyRent</span>
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
              <UserMenu nama={user.name ?? "Pengguna"} email={user.email ?? ""} role={user.role} />
            </div>
          </div>
          {/* Nav mobile */}
          <div className="border-t px-4 py-2 md:hidden">
            <Sidebar />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
