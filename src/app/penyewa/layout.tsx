import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { UserMenu } from "@/components/dashboard/user-menu";
import { requirePenyewa } from "@/lib/sesi";

export default async function PenyewaLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requirePenyewa();

  const pautan = [
    { href: "/penyewa", label: "Papan Pemuka" },
    { href: "/penyewa/invois", label: "Invois" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/penyewa" className="font-semibold tracking-tight">
              EzyRent
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
          <UserMenu nama={user.name ?? "Penyewa"} email={user.email ?? ""} role={user.role} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      <Toaster richColors />
    </div>
  );
}
