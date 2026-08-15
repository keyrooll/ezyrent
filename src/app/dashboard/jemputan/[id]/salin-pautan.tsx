"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SalinPautan({ pautan }: { pautan: string }) {
  const [disalin, setDisalin] = useState(false);

  async function salin() {
    try {
      await navigator.clipboard.writeText(pautan);
      setDisalin(true);
      setTimeout(() => setDisalin(false), 2000);
    } catch {
      // Clipboard tidak tersedia — abaikan
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={salin} className="shrink-0">
      {disalin ? <Check className="mr-1 size-4 text-emerald-600" /> : <Copy className="mr-1 size-4" />}
      {disalin ? "Disalin" : "Salin"}
    </Button>
  );
}
