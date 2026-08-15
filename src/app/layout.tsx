import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "EzyRent — Platform Pengurusan Hartanah",
  description: "Urus hartanah sewa, penyewa dan kutipan sewa dalam satu platform.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ms" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        {children}
      </body>
    </html>
  );
}
