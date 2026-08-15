import { describe, it, expect } from "vitest";
import {
  LABEL_INVOIS,
  LABEL_PEMBAYARAN,
  LABEL_KAEDAH,
  LABEL_TENANCY,
  LABEL_UNIT,
  LABEL_HARTANAH,
  LABEL_JENIS_HARTANAH,
  LABEL_PENYEWA,
  LABEL_JEMPUTAN,
  LABEL_STATUS_LANDLORD,
} from "@/lib/labels";

describe("Label Bahasa Melayu", () => {
  it("semua label tidak kosong", () => {
    const semua = [
      ...Object.values(LABEL_INVOIS),
      ...Object.values(LABEL_PEMBAYARAN),
      ...Object.values(LABEL_KAEDAH),
      ...Object.values(LABEL_TENANCY),
      ...Object.values(LABEL_UNIT),
      ...Object.values(LABEL_HARTANAH),
      ...Object.values(LABEL_JENIS_HARTANAH),
      ...Object.values(LABEL_PENYEWA),
      ...Object.values(LABEL_JEMPUTAN),
      ...Object.values(LABEL_STATUS_LANDLORD),
    ];
    for (const label of semua) {
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });

  it("status invois utama ada label", () => {
    expect(LABEL_INVOIS.PENDING).toBe("Belum Bayar");
    expect(LABEL_INVOIS.PAID).toBe("Dibayar");
    expect(LABEL_INVOIS.OVERDUE).toBe("Tertunggak");
  });

  it("status pembayaran utama ada label", () => {
    expect(LABEL_PEMBAYARAN.PENDING).toBe("Menunggu Sah");
    expect(LABEL_PEMBAYARAN.VERIFIED).toBe("Disahkan");
    expect(LABEL_PEMBAYARAN.REJECTED).toBe("Ditolak");
  });

  it("kaedah pembayaran lengkap", () => {
    for (const k of ["BANK_TRANSFER", "CASH", "FPX", "DUITNOW", "CARD", "OTHER"]) {
      expect(LABEL_KAEDAH[k as keyof typeof LABEL_KAEDAH]).toBeTruthy();
    }
  });
});
