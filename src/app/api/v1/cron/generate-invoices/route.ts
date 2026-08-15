import { janaInvoisBulanan } from "@/lib/invois";

/**
 * Cron: jana invois sewa bulanan.
 * Lindungi dengan CRON_SECRET (lihat vercel.json / .env).
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ralat: "Tidak dibenarkan" }, { status: 401 });
  }

  const dicipta = await janaInvoisBulanan();
  return Response.json({ ok: true, dicipta });
}
