import { describe, it, expect } from "vitest";
import { formatRM, formatTarikh, formatTarikhPendek, formatNombor } from "@/lib/format";

describe("formatRM", () => {
  it("format wang dalam Ringgit Malaysia", () => {
    expect(formatRM(1500)).toBe("RM1,500.00");
    expect(formatRM(0)).toBe("RM0.00");
    expect(formatRM(1299.5)).toBe("RM1,299.50");
  });

  it("terima Decimal/string/null", () => {
    expect(formatRM("600.00")).toBe("RM600.00");
    expect(formatRM(null)).toBe("RM0.00");
  });
});

describe("formatTarikh", () => {
  it("format tarikh panjang Bahasa Melayu", () => {
    const d = new Date("2026-08-05T12:00:00+08:00");
    expect(formatTarikh(d)).toBe("5 Ogos 2026");
  });

  it("null menjadi sempang", () => {
    expect(formatTarikh(null)).toBe("—");
  });
});

describe("formatTarikhPendek", () => {
  it("format dd/mm/yyyy", () => {
    const d = new Date("2026-08-05T12:00:00+08:00");
    expect(formatTarikhPendek(d)).toBe("05/08/2026");
  });
});

describe("formatNombor", () => {
  it("pemisah ribuan gaya Malaysia", () => {
    expect(formatNombor(1500)).toBe("1,500");
    expect(formatNombor(10)).toBe("10");
  });
});
