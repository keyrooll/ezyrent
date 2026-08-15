export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
          E
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">EzyRent</h1>
        <p className="text-sm text-muted-foreground">Platform Pengurusan Hartanah Sewa</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
