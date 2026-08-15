"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [katalaluan, setKatalaluan] = useState("");
  const [ralat, setRalat] = useState("");
  const [memuat, setMemuat] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setRalat("");
    const hasil = await signIn("credentials", { redirect: false, email, password: katalaluan });
    if (hasil?.error) {
      setRalat("E-mel atau kata laluan tidak sah.");
      setMemuat(false);
      return;
    }
    // Middleware akan halakan ke dashboard ikut role
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Masuk</CardTitle>
        <CardDescription>Masuk ke akaun EzyRent anda</CardDescription>
      </CardHeader>
      <CardContent>
        {ralat && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{ralat}</p>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mel</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@contoh.my"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="katalaluan">Kata Laluan</Label>
            <Input
              id="katalaluan"
              type="password"
              autoComplete="current-password"
              value={katalaluan}
              onChange={(e) => setKatalaluan(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={memuat}>
            {memuat ? "Sedang log masuk..." : "Log Masuk"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Belum ada akaun?{" "}
          <Link href="/daftar" className="font-medium text-primary underline-offset-4 hover:underline">
            Daftar sebagai Tuan Rumah
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
