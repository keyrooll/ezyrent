import Link from "next/link";
import { requireSuperAdmin } from "@/lib/sesi";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSuperAdmin();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold tracking-tight">
              EzyRent <span className="text-xs font-normal text-muted-foreground">Admin</span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/admin"
                className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Papan Pemuka
              </Link>
            </nav>
          </div>
          <UserMenu nama={user.name ?? "Admin"} email={user.email ?? ""} role={user.role} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
