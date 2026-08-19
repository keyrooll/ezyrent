import { Check } from "lucide-react";
import { tukarPaparan } from "@/lib/aksi-paparan";
import type { PilihanPaparan } from "@/lib/sesi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Penukar paparan peranan — muncul hanya jika user berdaftar untuk
 * lebih daripada satu peranan (landlord / staf / penyewa).
 */
export function PenukarPaparan({
  senarai,
  tajuk,
  huraian,
}: {
  senarai: PilihanPaparan[];
  tajuk: string;
  huraian: string;
}) {
  if (senarai.length < 2) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{tajuk}</CardTitle>
        <CardDescription>{huraian}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {senarai.map((s) => (
            <form key={s.kod} action={tukarPaparan.bind(null, s.kod)}>
              <Button
                type="submit"
                variant={s.semasa ? "default" : "outline"}
                size="sm"
                disabled={s.semasa}
              >
                {s.semasa && <Check className="mr-1.5 size-3.5" />}
                {s.label}
              </Button>
            </form>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
