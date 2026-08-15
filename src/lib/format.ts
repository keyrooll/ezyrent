/** Buang ruang tidak putus (U+00A0/U+202F) yang dimasukkan ICU Node — konsisten dengan browser */
function bersih(s: string): string {
  return s.replace(/[  ]/g, " ");
}

/** Format wang MYR: 1500 → "RM1,500.00" */
export function formatRM(nilai: number | string | { toString(): string } | null | undefined): string {
  const n = Number(nilai ?? 0);
  return bersih(new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(n)).replace("RM ", "RM");
}

/** Format tarikh penuh: "5 Ogos 2026" */
export function formatTarikh(t: Date | string | null | undefined): string {
  if (!t) return "—";
  return bersih(new Intl.DateTimeFormat("ms-MY", { day: "numeric", month: "long", year: "numeric" }).format(new Date(t)));
}

/** Format tarikh pendek: "05/08/2026" */
export function formatTarikhPendek(t: Date | string | null | undefined): string {
  if (!t) return "—";
  return bersih(new Intl.DateTimeFormat("ms-MY", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(t)));
}

/** Nombor dalam gaya Malaysia: 1500 → "1,500" */
export function formatNombor(n: number): string {
  return bersih(new Intl.NumberFormat("ms-MY").format(n));
}
