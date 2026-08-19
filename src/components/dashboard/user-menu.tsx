"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const LABEL_ROLE: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  LANDLORD: "Tuan Rumah",
  STAFF: "Staf",
  TENANT: "Penyewa",
};

export function UserMenu({
  nama,
  email,
  role,
  avatarSrc,
  profilHref,
}: {
  nama: string;
  email: string;
  role: string;
  avatarSrc?: string | null;
  profilHref?: string;
}) {
  const initial = nama.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt=""
              className="size-8 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initial}
            </span>
          )}
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight">{nama}</span>
            <span className="block text-xs text-muted-foreground">{LABEL_ROLE[role] ?? role}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-medium">{nama}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{email}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {LABEL_ROLE[role] ?? role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profilHref && (
          <>
            <DropdownMenuItem asChild>
              <Link href={profilHref}>
                <UserRound className="mr-2 size-4" />
                Profil Saya
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 size-4" />
          Log Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
