"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  FileText,
  Wallet,
  Send,
  ScrollText,
  UserCog,
  CreditCard,
  Wrench,
  ClipboardCheck,
  Zap,
  ReceiptText,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Item navigasi sidebar — halaman ditambah ikut fasa pembangunan */
const NAV = [
  { href: "/dashboard", label: "Dashboard", ikon: LayoutDashboard },
  { href: "/dashboard/hartanah", label: "Hartanah", ikon: Building2 },
  { href: "/dashboard/unit", label: "Unit", ikon: DoorOpen },
  { href: "/dashboard/penyewa", label: "Penyewa", ikon: Users },
  { href: "/dashboard/invois", label: "Invois", ikon: FileText },
  { href: "/dashboard/pembayaran", label: "Pembayaran", ikon: Wallet },
  { href: "/dashboard/utiliti", label: "Utiliti", ikon: Zap },
  { href: "/dashboard/perbelanjaan", label: "Perbelanjaan", ikon: ReceiptText },
  { href: "/dashboard/laporan", label: "Laporan", ikon: BarChart3 },
  { href: "/dashboard/jemputan", label: "Jemputan", ikon: Send },
  { href: "/dashboard/maintenance", label: "Maintenance", ikon: Wrench },
  { href: "/dashboard/audit", label: "Audit Log", ikon: ScrollText },
  // Staf hanya untuk tuan rumah — staf tidak urus staf lain
  { href: "/dashboard/staf", label: "Staf", ikon: UserCog, hanyaOwner: true },
  // Kelulusan profil — landlord & staf boleh urus
  { href: "/dashboard/kelulusan", label: "Kelulusan", ikon: ClipboardCheck },
  // Langganan hanya untuk tuan rumah — staf tidak nampak (owner yang bayar)
  { href: "/dashboard/langganan", label: "Langganan", ikon: CreditCard, hanyaOwner: true },
];

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();

  const item =
    role === "STAFF" ? NAV.filter((n) => !("hanyaOwner" in n && n.hanyaOwner)) : NAV;

  return (
    <nav className="flex w-full gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {item.map(({ href, label, ikon: Ikon }) => {
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
