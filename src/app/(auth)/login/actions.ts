"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { CredentialsSignin } from "next-auth";

export type HasilLogin = { ralat?: string };

/**
 * Log masuk melalui server action — set cookie sesi di server dan
 * redirect secara relatif supaya host semasa (localhost, IP LAN, domain)
 * dihormati. Borang kekal berfungsi walaupun JS belum hydrate (HP).
 */
export async function logMasuk(_sebelum: HasilLogin, formData: FormData): Promise<HasilLogin> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ralat: "Sila isi e-mel dan kata laluan." };

  // redirect: false — URL pulangan Auth.js sentiasa localhost:3000,
  // jadi kita redirect sendiri secara relatif
  let url: string;
  try {
    url = await signIn("credentials", { email, password, redirect: false });
  } catch (ralat) {
    if (ralat instanceof CredentialsSignin) {
      return { ralat: "E-mel atau kata laluan tidak sah." };
    }
    throw ralat;
  }
  if (url.includes("error=")) {
    return { ralat: "E-mel atau kata laluan tidak sah." };
  }

  // Middleware & pengawal sesi akan halakan ikut peranan pengguna
  redirect("/dashboard");
}
