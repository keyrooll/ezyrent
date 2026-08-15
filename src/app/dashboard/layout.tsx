import Link from "next/link";
import { requireLandlord } from "@/lib/sesi";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireLandlord();

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
            <UserMenu nama={user.name ?? "Pengguna"} email={user.email ?? ""} role={user.role} />
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
