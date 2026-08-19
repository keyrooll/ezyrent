import { cn } from "@/lib/utils";

/**
 * Logo EzyRent — guna fail sebenar `public/logo.svg`.
 * Kawal saiz melalui className (cth "h-12 w-auto"). Lebar auto ikut nisbah.
 */
export function Brand({ className, alt = "EzyRent" }: { className?: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt={alt}
      className={cn("h-11 w-auto select-none", className)}
      draggable={false}
    />
  );
}

/** Alias untuk keserasian — logo yang sama. */
export const BrandMark = Brand;
