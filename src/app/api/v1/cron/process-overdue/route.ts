import { prosesOverdue } from "@/lib/invois";

/**
 * Cron: tandakan invois PENDING yang lepas tempoh sebagai OVERDUE.
 * Lindungi dengan CRON_SECRET (lihat vercel.json / .env).
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ralat: "Tidak dibenarkan" }, { status: 401 });
  }

  const dikemas = await prosesOverdue();
  return Response.json({ ok: true, dikemas });
}
