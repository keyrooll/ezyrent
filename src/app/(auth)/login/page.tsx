"use client";

import Link from "next/link";
import { useActionState } from "react";
import { logMasuk, type HasilLogin } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const awalan: HasilLogin = {};

export default function LoginPage() {
  const [hasil, tindakan, menunggu] = useActionState(logMasuk, awalan);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Masuk</CardTitle>
        <CardDescription>Masuk ke akaun EzyRent anda</CardDescription>
      </CardHeader>
      <CardContent>
        {hasil?.ralat && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {hasil.ralat}
          </p>
        )}
        <form action={tindakan} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mel</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@contoh.my"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="katalaluan">Kata Laluan</Label>
            <Input
              id="katalaluan"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={menunggu}>
            {menunggu ? "Sedang log masuk..." : "Log Masuk"}
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
