import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Brand className="h-40" />
        <p className="text-sm text-muted-foreground">Platform Pengurusan Hartanah Sewa</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
