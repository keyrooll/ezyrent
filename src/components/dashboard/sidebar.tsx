"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, DoorOpen, Users, FileText, Wallet, Send } from "lucide-react";
import { cn } from "@/lib/utils";

/** Item navigasi sidebar — halaman ditambah ikut fasa pembangunan */
const NAV = [
  { href: "/dashboard", label: "Papan Pemuka", ikon: LayoutDashboard },
  { href: "/dashboard/hartanah", label: "Hartanah", ikon: Building2 },
  { href: "/dashboard/unit", label: "Unit", ikon: DoorOpen },
  { href: "/dashboard/penyewa", label: "Penyewa", ikon: Users },
  { href: "/dashboard/invois", label: "Invois", ikon: FileText },
  { href: "/dashboard/pembayaran", label: "Pembayaran", ikon: Wallet },
  { href: "/dashboard/jemputan", label: "Jemputan", ikon: Send },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {NAV.map(({ href, label, ikon: Ikon }) => {
        const aktif = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              aktif && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            <Ikon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
