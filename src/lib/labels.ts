import type {
  InvoiceStatus,
  LandlordStatus,
  PaymentMethod,
  PaymentStatus,
  PropertyStatus,
  PropertyType,
  TenancyStatus,
  TenantStatus,
  UnitStatus,
  InvitationStatus,
} from "@prisma/client";

/** Label Bahasa Melayu untuk semua enum — sumber tunggal untuk UI */
export type {
  InvoiceStatus,
  LandlordStatus,
  PaymentMethod,
  PaymentStatus,
  PropertyStatus,
  PropertyType,
  TenancyStatus,
  TenantStatus,
  UnitStatus,
  InvitationStatus,
};

export const LABEL_INVOIS: Record<InvoiceStatus, string> = {
  PENDING: "Belum Bayar",
  PARTIAL: "Bayaran Separa",
  PAID: "Dibayar",
  OVERDUE: "Tertunggak",
  CANCELLED: "Dibatalkan",
  WAIVED: "Dikecualikan",
};

export const LABEL_PEMBAYARAN: Record<PaymentStatus, string> = {
  PENDING: "Menunggu Sah",
  VERIFIED: "Disahkan",
  REJECTED: "Ditolak",
};

export const LABEL_KAEDAH: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Pindahan Bank",
  CASH: "Tunai",
  FPX: "FPX",
  DUITNOW: "DuitNow",
  CARD: "Kad",
  OTHER: "Lain-lain",
};

export const LABEL_TENANCY: Record<TenancyStatus, string> = {
  DRAFT: "Draf",
  ACTIVE: "Aktif",
  ENDED: "Tamat",
  TERMINATED: "Ditamatkan",
};

export const LABEL_UNIT: Record<UnitStatus, string> = {
  VACANT: "Kosong",
  OCCUPIED: "Berpenghuni",
  MAINTENANCE: "Penyelenggaraan",
  RESERVED: "Ditempah",
};

export const LABEL_HARTANAH: Record<PropertyStatus, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Tidak Aktif",
  ARCHIVED: "Diarkib",
};

export const LABEL_JENIS_HARTANAH: Record<PropertyType, string> = {
  APARTMENT: "Apartmen",
  CONDO: "Kondominium",
  TERRACE: "Rumah Teres",
  SEMI_D: "Semi-D",
  BUNGALOW: "Banglo",
  ROOM: "Bilik",
  SHOPLOT: "Kedai",
  OFFICE: "Pejabat",
  COMMERCIAL: "Komersial",
  OTHER: "Lain-lain",
};

export const LABEL_PENYEWA: Record<TenantStatus, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Tidak Aktif",
};

export const LABEL_JEMPUTAN: Record<InvitationStatus, string> = {
  PENDING: "Menunggu",
  ACCEPTED: "Diterima",
  EXPIRED: "Tamat Tempoh",
  REVOKED: "Dibatalkan",
};

export const LABEL_STATUS_LANDLORD: Record<LandlordStatus, string> = {
  TRIAL: "Percubaan",
  ACTIVE: "Aktif",
  SUSPENDED: "Digantung",
};
