import { redirect } from "next/navigation";

/** Halaman utama — halakan ke log masuk (middleware urus redirect ikut role) */
export default function Home() {
  redirect("/login");
}
