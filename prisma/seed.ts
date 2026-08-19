import {
  PrismaClient,
  PropertyType,
  UnitStatus,
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  TenancyStatus,
  DocCategory,
  MaintenanceStatus,
  ExpenseCategory,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

const PASSWORD = "Admin123!";

// 1x1 PNG transparan sebagai bukti bayaran demo
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function date(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d));
}

async function upsertUser(email: string, name: string, role: "SUPER_ADMIN" | "LANDLORD" | "STAFF" | "TENANT", hash: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role, password_hash: hash },
  });
}

async function upsertProperty(landlordId: string, name: string, data: {
  type: PropertyType; street: string; city: string; state: string; postcode: string;
}) {
  const existing = await prisma.property.findFirst({ where: { landlord_id: landlordId, name } });
  if (existing) return existing;
  return prisma.property.create({ data: { landlord_id: landlordId, name, ...data } });
}

async function upsertUnit(landlordId: string, propertyId: string, unitNo: string, data: {
  rent: number; deposit: number; status: UnitStatus; bedrooms?: number; bathrooms?: number; floor?: string;
}) {
  const existing = await prisma.unit.findFirst({ where: { landlord_id: landlordId, property_id: propertyId, unit_no: unitNo } });
  if (existing) return existing;
  return prisma.unit.create({
    data: {
      landlord_id: landlordId,
      property_id: propertyId,
      unit_no: unitNo,
      floor: data.floor,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      rent_amount: data.rent,
      deposit_amount: data.deposit,
      status: data.status,
    },
  });
}

async function upsertTenant(landlordId: string, name: string, data: {
  email?: string; phone?: string; ic_no?: string; occupation?: string;
  emergency_contact?: string; emergency_phone?: string; user_id?: string | null;
}) {
  const existing = await prisma.tenant.findFirst({ where: { landlord_id: landlordId, name } });
  if (existing) return existing;
  return prisma.tenant.create({ data: { landlord_id: landlordId, name, ...data } });
}

async function main() {
  console.log("Menyemai data EzyRent...");
  const hash = await bcrypt.hash(PASSWORD, 10);

  // ---------- Subscription plans ----------
  const plans = [
    { code: "FREE", name: "Percuma", price: 0, unitLimit: 3, features: { trial: false } },
    { code: "PRO", name: "Pro", price: 29, unitLimit: 10, features: { trial: true } },
    { code: "BUSINESS", name: "Business", price: 79, unitLimit: 50, features: { trial: true } },
    { code: "PROFESSIONAL", name: "Professional", price: 199, unitLimit: 200, features: { trial: true } },
  ];
  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: p.code },
      update: { price_myr: p.price, unit_limit: p.unitLimit },
      create: { code: p.code, name: p.name, price_myr: p.price, unit_limit: p.unitLimit, features: p.features },
    });
  }
  console.log("✓ 4 pelan langganan");

  // ---------- Super admin ----------
  await upsertUser("admin@ezyrent.my", "Admin EzyRent", "SUPER_ADMIN", hash);
  console.log("✓ Super admin: admin@ezyrent.my");

  // ---------- Demo landlord ----------
  const owner = await upsertUser("landlord@demo.my", "Ahmad Razali", "LANDLORD", hash);
  const pro = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { code: "PRO" } });
  const trialEnd = daysFromNow(30);

  const landlord =
    (await prisma.landlord.findUnique({ where: { owner_id: owner.id } })) ??
    (await prisma.landlord.create({
      data: {
        business_name: "Demo Sdn Bhd",
        email: "landlord@demo.my",
        phone: "012-3456789",
        owner_id: owner.id,
        plan_code: "PRO",
        unit_limit: pro.unit_limit,
        status: "TRIAL",
        trial_ends_at: trialEnd,
        subscriptions: {
          create: { plan_id: pro.id, status: "TRIAL", trial_ends_at: trialEnd },
        },
      },
    }));
  console.log("✓ Landlord: landlord@demo.my (Demo Sdn Bhd, trial PRO 30 hari)");

  // ---------- Demo staff ----------
  const staffUser = await upsertUser("staf@demo.my", "Ali Hassan", "STAFF", hash);
  let staff = await prisma.staff.findUnique({ where: { user_id: staffUser.id } });
  if (!staff) {
    staff = await prisma.staff.create({
      data: {
        user_id: staffUser.id,
        landlord_id: landlord.id,
        permissions: {
          properties: { view: true, edit: true },
          tenants: { view: true, edit: true },
          rent: { view: true, record: true, verify: true },
          financial: { view: false },
        },
      },
    });
  }
  console.log("✓ Staf: staf@demo.my");

  // ---------- Properties & units ----------
  const condo = await upsertProperty(landlord.id, "Condo Sri Hartamas", {
    type: PropertyType.CONDO,
    street: "Jalan Sri Hartamas 1",
    city: "Kuala Lumpur",
    state: "Wilayah Persekutuan",
    postcode: "50480",
  });
  const teres = await upsertProperty(landlord.id, "Taman Putra", {
    type: PropertyType.TERRACE,
    street: "Jalan Putra 3/2",
    city: "Shah Alam",
    state: "Selangor",
    postcode: "40100",
  });

  const condoUnits: Record<string, { rent: number; deposit: number; status: UnitStatus }> = {
    "A-01-01": { rent: 1500, deposit: 3000, status: UnitStatus.OCCUPIED },
    "A-01-02": { rent: 1500, deposit: 3000, status: UnitStatus.OCCUPIED },
    "A-01-03": { rent: 1500, deposit: 3000, status: UnitStatus.VACANT },
    "A-01-04": { rent: 1500, deposit: 3000, status: UnitStatus.MAINTENANCE },
    "A-01-05": { rent: 1500, deposit: 3000, status: UnitStatus.OCCUPIED },
    "A-01-06": { rent: 1500, deposit: 3000, status: UnitStatus.VACANT },
  };
  const teresUnits: Record<string, { rent: number; deposit: number; status: UnitStatus }> = {
    "HOUSE-01": { rent: 1200, deposit: 2400, status: UnitStatus.OCCUPIED },
    "HOUSE-02": { rent: 1200, deposit: 2400, status: UnitStatus.OCCUPIED },
    "HOUSE-03": { rent: 1200, deposit: 2400, status: UnitStatus.VACANT },
    "HOUSE-04": { rent: 1200, deposit: 2400, status: UnitStatus.RESERVED },
  };

  const unitMap = new Map<string, Awaited<ReturnType<typeof upsertUnit>>>();
  for (const [no, u] of Object.entries(condoUnits)) {
    unitMap.set(no, await upsertUnit(landlord.id, condo.id, no, { ...u, floor: "1", bedrooms: 3, bathrooms: 2 }));
  }
  for (const [no, u] of Object.entries(teresUnits)) {
    unitMap.set(no, await upsertUnit(landlord.id, teres.id, no, { ...u, bedrooms: 4, bathrooms: 3 }));
  }
  console.log("✓ 2 hartanah, 10 unit");

  // Grant staff kepada kedua-dua property
  for (const prop of [condo, teres]) {
    await prisma.propertyStaff.upsert({
      where: { staff_id_property_id: { staff_id: staff.id, property_id: prop.id } },
      update: {},
      create: { landlord_id: landlord.id, property_id: prop.id, staff_id: staff.id, can_view: true, can_edit: true },
    });
  }

  // ---------- Tenants ----------
  const tenantUser1 = await upsertUser("penyewa1@demo.my", "Ahmad Ali", "TENANT", hash);
  const tenantUser2 = await upsertUser("penyewa2@demo.my", "Siti Aminah", "TENANT", hash);

  const ahmad = await upsertTenant(landlord.id, "Ahmad Ali", {
    email: "penyewa1@demo.my", phone: "017-1112222", ic_no: "900101-10-1234",
    occupation: "Jurutera", emergency_contact: "Salmah", emergency_phone: "017-3334444",
    user_id: tenantUser1.id,
  });
  const fatimah = await upsertTenant(landlord.id, "Fatimah Zahra", {
    email: "fatimah@demo.my", phone: "016-5556666", ic_no: "920202-10-5678",
    occupation: "Guru", emergency_contact: "Zainal", emergency_phone: "016-7778888",
  });
  const ali = await upsertTenant(landlord.id, "Ali Bakar", {
    email: "ali@demo.my", phone: "013-9990000", occupation: "Peniaga",
  });
  const kamal = await upsertTenant(landlord.id, "Kamal Din", {
    email: "kamal@demo.my", phone: "019-1112222", occupation: "Pemandu",
  });
  const siti = await upsertTenant(landlord.id, "Siti Aminah", {
    email: "penyewa2@demo.my", phone: "018-3334444", occupation: "Jururawat",
    user_id: tenantUser2.id,
  });
  console.log("✓ 5 penyewa");

  // ---------- Tenancies ----------
  async function upsertTenancy(unitNo: string, tenantId: string, rent: number, deposit: number, dueDay: number, start: Date, end: Date | null) {
    const unit = unitMap.get(unitNo)!;
    const existing = await prisma.tenancy.findFirst({ where: { landlord_id: landlord.id, unit_id: unit.id, tenant_id: tenantId } });
    if (existing) return existing;
    return prisma.tenancy.create({
      data: {
        landlord_id: landlord.id, unit_id: unit.id, tenant_id: tenantId,
        start_date: start, end_date: end, rent_amount: rent, deposit_amount: deposit,
        rent_due_day: dueDay, status: TenancyStatus.ACTIVE,
      },
    });
  }

  const tAhmad = await upsertTenancy("A-01-01", ahmad.id, 1500, 3000, 5, date(2026, 1, 1), date(2026, 12, 31));
  const tFatimah = await upsertTenancy("A-01-02", fatimah.id, 1500, 3000, 5, date(2026, 3, 1), date(2027, 2, 28));
  const tAli = await upsertTenancy("A-01-05", ali.id, 1500, 3000, 7, date(2026, 2, 1), date(2027, 1, 31));
  const tKamal = await upsertTenancy("HOUSE-01", kamal.id, 1200, 2400, 1, date(2026, 5, 1), null);
  console.log("✓ 4 tenancy aktif");

  // ---------- Invoices & payments (Ogos 2026) ----------
  const periodStart = date(2026, 8, 1);
  const periodEnd = date(2026, 8, 31);

  async function upsertInvoice(tenancyId: string, tenantId: string, unitId: string, data: {
    no: string; due: Date; amount: number; status: InvoiceStatus; paid?: number;
  }) {
    const existing = await prisma.rentInvoice.findFirst({ where: { landlord_id: landlord.id, tenancy_id: tenancyId, period_start: periodStart } });
    if (existing) return existing;
    return prisma.rentInvoice.create({
      data: {
        landlord_id: landlord.id, tenancy_id: tenancyId, unit_id: unitId, tenant_id: tenantId,
        invoice_no: data.no, period_start: periodStart, period_end: periodEnd,
        due_date: data.due, amount: data.amount, paid_amount: data.paid ?? 0, status: data.status,
      },
    });
  }

  const invAhmad = await upsertInvoice(tAhmad.id, ahmad.id, unitMap.get("A-01-01")!.id, {
    no: "INV-2026-0001", due: date(2026, 8, 5), amount: 1500, status: InvoiceStatus.PENDING,
  });
  const invFatimah = await upsertInvoice(tFatimah.id, fatimah.id, unitMap.get("A-01-02")!.id, {
    no: "INV-2026-0002", due: date(2026, 8, 5), amount: 1500, status: InvoiceStatus.PAID, paid: 1500,
  });
  const invAli = await upsertInvoice(tAli.id, ali.id, unitMap.get("A-01-05")!.id, {
    no: "INV-2026-0003", due: date(2026, 8, 7), amount: 1500, status: InvoiceStatus.OVERDUE,
  });
  const invKamal = await upsertInvoice(tKamal.id, kamal.id, unitMap.get("HOUSE-01")!.id, {
    no: "INV-2026-0004", due: date(2026, 8, 1), amount: 1200, status: InvoiceStatus.PARTIAL, paid: 600,
  });
  console.log("✓ 4 invois Ogos 2026");

  // Payment: Ahmad (PENDING, bukti upload)
  let payAhmad = await prisma.payment.findFirst({ where: { landlord_id: landlord.id, invoice_id: invAhmad.id } });
  if (!payAhmad) {
    payAhmad = await prisma.payment.create({
      data: {
        landlord_id: landlord.id, invoice_id: invAhmad.id, tenant_id: ahmad.id,
        amount: 500, method: PaymentMethod.BANK_TRANSFER, reference_no: "TRF20260810",
        status: PaymentStatus.PENDING,
      },
    });
    const dir = path.join(process.cwd(), "uploads", landlord.id, payAhmad.id);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "bukti-demo.png"), TINY_PNG);
    await prisma.document.create({
      data: {
        landlord_id: landlord.id, uploader_user_id: tenantUser1.id, tenant_id: ahmad.id,
        payment_id: payAhmad.id, category: DocCategory.PAYMENT_PROOF,
        original_name: "bukti-bayaran.png", stored_path: `uploads/${landlord.id}/${payAhmad.id}/bukti-demo.png`,
        mime_type: "image/png", size_bytes: TINY_PNG.length,
      },
    });
  }

  // Payment: Fatimah (VERIFIED penuh)
  let payFatimah = await prisma.payment.findFirst({ where: { landlord_id: landlord.id, invoice_id: invFatimah.id } });
  if (!payFatimah) {
    payFatimah = await prisma.payment.create({
      data: {
        landlord_id: landlord.id, invoice_id: invFatimah.id, tenant_id: fatimah.id,
        amount: 1500, method: PaymentMethod.BANK_TRANSFER, reference_no: "TRF20260803",
        status: PaymentStatus.VERIFIED, verified_by_user_id: staffUser.id, verified_at: date(2026, 8, 4),
      },
    });
  }

  // Payment: Kamal (VERIFIED separa)
  let payKamal = await prisma.payment.findFirst({ where: { landlord_id: landlord.id, invoice_id: invKamal.id } });
  if (!payKamal) {
    payKamal = await prisma.payment.create({
      data: {
        landlord_id: landlord.id, invoice_id: invKamal.id, tenant_id: kamal.id,
        amount: 600, method: PaymentMethod.CASH, status: PaymentStatus.VERIFIED,
        verified_by_user_id: staffUser.id, verified_at: date(2026, 8, 2),
      },
    });
  }
  console.log("✓ 3 pembayaran (pending / verified penuh / verified separa)");

  // ---------- Invitation (Siti → A-01-03) ----------
  const invUnit = unitMap.get("A-01-03")!;
  let invitation = await prisma.invitation.findUnique({ where: { token: "demo-jemputan-siti" } });
  if (!invitation) {
    invitation = await prisma.invitation.create({
      data: {
        landlord_id: landlord.id, unit_id: invUnit.id, tenant_email: "penyewa2@demo.my",
        tenant_phone: "018-3334444", token: "demo-jemputan-siti", status: "PENDING",
        expires_at: hoursFromNow(24), invited_by_user_id: staffUser.id,
      },
    });
  }
  console.log("✓ Jemputan demo untuk Siti (A-01-03)");

  // ---------- Maintenance (1 setiap status) ----------
  async function upsertMaintenance(unitNo: string, tenantId: string | null, reportedBy: string, data: {
    title: string; description: string; status: MaintenanceStatus;
  }) {
    const unit = unitMap.get(unitNo)!;
    const existing = await prisma.maintenanceRequest.findFirst({
      where: { landlord_id: landlord.id, unit_id: unit.id, title: data.title },
    });
    if (existing) return existing;
    return prisma.maintenanceRequest.create({
      data: {
        landlord_id: landlord.id, unit_id: unit.id, tenant_id: tenantId,
        reported_by_user_id: reportedBy, title: data.title, description: data.description,
        status: data.status,
      },
    });
  }

  const mAhmad = await upsertMaintenance("A-01-01", ahmad.id, tenantUser1.id, {
    title: "Paip sinki bocor",
    description: "Air menitik dari bawah sinki dapur sejak semalam.",
    status: MaintenanceStatus.COMPLAIN,
  });
  const mFatimah = await upsertMaintenance("A-01-02", fatimah.id, staffUser.id, {
    title: "Kipas siling rosak",
    description: "Kipas bilik utama tidak berpusing, mungkin motor rosak.",
    status: MaintenanceStatus.IN_PROGRESS,
  });
  await upsertMaintenance("HOUSE-01", kamal.id, owner.id, {
    title: "Siling bocor selepas hujan",
    description: "Tanda air di siling ruang tamu — dibaiki dan dicat semula.",
    status: MaintenanceStatus.COMPLETED,
  });

  // Lampiran gambar pada aduan Ahmad
  const dirMaintenance = path.join(process.cwd(), "uploads", landlord.id, "maintenance", mAhmad.id);
  await fs.mkdir(dirMaintenance, { recursive: true });
  await fs.writeFile(path.join(dirMaintenance, "gambar-aduan.png"), TINY_PNG);
  await prisma.document.create({
    data: {
      landlord_id: landlord.id, uploader_user_id: tenantUser1.id, tenant_id: ahmad.id,
      maintenance_request_id: mAhmad.id, category: DocCategory.MAINTENANCE_PHOTO,
      original_name: "gambar-aduan.png",
      stored_path: `uploads/${landlord.id}/maintenance/${mAhmad.id}/gambar-aduan.png`,
      mime_type: "image/png", size_bytes: TINY_PNG.length,
    },
  });
  console.log("✓ 3 aduan maintenance (complain / in progress / completed)");

  // ---------- Bil utiliti (1 setiap status) ----------
  async function upsertUtilityBil(unitNo: string, tenantId: string, data: {
    bulan: string; amount: number; status: string; verifiedAt?: Date;
  }) {
    const unit = unitMap.get(unitNo)!;
    const existing = await prisma.utilityBil.findFirst({
      where: { landlord_id: landlord.id, tenant_id: tenantId, bulan: data.bulan },
    });
    if (existing) return existing;
    return prisma.utilityBil.create({
      data: {
        landlord_id: landlord.id, tenant_id: tenantId, unit_id: unit.id,
        bulan: data.bulan, amount: data.amount, status: data.status,
        created_by_user_id: staffUser.id,
        verified_by_user_id: data.verifiedAt ? staffUser.id : null,
        verified_at: data.verifiedAt ?? null,
      },
    });
  }

  const bilAhmad = await upsertUtilityBil("A-01-01", ahmad.id, {
    bulan: "2026-07", amount: 120.5, status: "PENDING_PROOF",
  });
  const bilFatimah = await upsertUtilityBil("A-01-02", fatimah.id, {
    bulan: "2026-08", amount: 85, status: "UNPAID",
  });
  await upsertUtilityBil("HOUSE-01", kamal.id, {
    bulan: "2026-06", amount: 95, status: "PAID", verifiedAt: date(2026, 7, 2),
  });

  // Bukti pembayaran bil Ahmad (PENDING_PROOF)
  const bilAhmadExists = await prisma.document.findFirst({
    where: { landlord_id: landlord.id, utility_bil_id: bilAhmad.id },
  });
  if (!bilAhmadExists) {
    await prisma.document.create({
      data: {
        landlord_id: landlord.id, uploader_user_id: tenantUser1.id, tenant_id: ahmad.id,
        utility_bil_id: bilAhmad.id, category: DocCategory.UTILITY_BILL,
        original_name: "bukti-bil.png", stored_path: `uploads/${landlord.id}/utiliti/${bilAhmad.id}/bukti-bil.png`,
        mime_type: "image/png", size_bytes: TINY_PNG.length,
      },
    });
  }
  console.log("✓ 3 bil utiliti (unpaid / pending proof / paid)");

  // ---------- Perbelanjaan ----------
  async function upsertExpense(data: {
    propertyId: string; unitId: string | null; maintenanceId: string | null;
    category: ExpenseCategory; description: string; amount: number;
    expenseDate: Date; vendor: string | null; byUserId: string;
  }) {
    const existing = await prisma.expense.findFirst({
      where: { landlord_id: landlord.id, description: data.description, amount: data.amount },
    });
    if (existing) return existing;
    return prisma.expense.create({
      data: {
        landlord_id: landlord.id, property_id: data.propertyId, unit_id: data.unitId,
        maintenance_request_id: data.maintenanceId, category: data.category,
        description: data.description, amount: data.amount, expense_date: data.expenseDate,
        vendor: data.vendor, created_by_user_id: data.byUserId,
      },
    });
  }

  const expBaikiPaip = await upsertExpense({
    propertyId: condo.id, unitId: unitMap.get("A-01-01")!.id, maintenanceId: mAhmad.id,
    category: ExpenseCategory.MAINTENANCE, description: "Baiki paip sinki dapur bocor",
    amount: 180, expenseDate: date(2026, 8, 10), vendor: "Ali Plumbing", byUserId: staffUser.id,
  });
  await upsertExpense({
    propertyId: condo.id, unitId: unitMap.get("A-01-02")!.id, maintenanceId: null,
    category: ExpenseCategory.UTILITY, description: "Bil elektrik Julai",
    amount: 95, expenseDate: date(2026, 7, 15), vendor: "TNB", byUserId: staffUser.id,
  });
  await upsertExpense({
    propertyId: teres.id, unitId: unitMap.get("HOUSE-01")!.id, maintenanceId: null,
    category: ExpenseCategory.INSURANCE, description: "Insurans kebakaran tahunan",
    amount: 450, expenseDate: date(2026, 6, 5), vendor: "Allianz", byUserId: owner.id,
  });
  await upsertExpense({
    propertyId: teres.id, unitId: null, maintenanceId: null,
    category: ExpenseCategory.TAX, description: "Cukai pintu separuh tahun",
    amount: 1200, expenseDate: date(2026, 6, 20), vendor: "MPKJ", byUserId: owner.id,
  });
  await upsertExpense({
    propertyId: condo.id, unitId: null, maintenanceId: null,
    category: ExpenseCategory.MANAGEMENT, description: "Yuran pengurusan bulanan",
    amount: 300, expenseDate: date(2026, 8, 1), vendor: "Agensi Pengurusan", byUserId: staffUser.id,
  });

  // Resit untuk perbelanjaan baiki paip
  const resitExpense = await prisma.document.findFirst({
    where: { landlord_id: landlord.id, expense_id: expBaikiPaip.id },
  });
  if (!resitExpense) {
    const dirExpense = path.join(process.cwd(), "uploads", landlord.id, "expense", expBaikiPaip.id);
    await fs.mkdir(dirExpense, { recursive: true });
    await fs.writeFile(path.join(dirExpense, "resit-baiki.png"), TINY_PNG);
    await prisma.document.create({
      data: {
        landlord_id: landlord.id, uploader_user_id: staffUser.id,
        expense_id: expBaikiPaip.id, category: DocCategory.EXPENSE_RECEIPT,
        original_name: "resit-baiki.png",
        stored_path: `uploads/${landlord.id}/expense/${expBaikiPaip.id}/resit-baiki.png`,
        mime_type: "image/png", size_bytes: TINY_PNG.length,
      },
    });
  }
  console.log("✓ 5 perbelanjaan demo (pelbagai kategori, 1 dengan resit)");

  // ---------- Notifications & audit ----------
  await prisma.notification.createMany({
    data: [
      { user_id: owner.id, type: "PAYMENT_UPLOADED", title: "Bukti bayaran diterima", body: "Ahmad Ali memuat naik bukti bayaran RM500 untuk invois INV-2026-0001." },
      { user_id: tenantUser1.id, type: "RENT_DUE", title: "Sewa akan tamat tempoh", body: "Sewa Ogos 2026 sebanyak RM1,500 perlu dibayar sebelum 5 Ogos." },
      { user_id: staffUser.id, type: "PAYMENT_UPLOADED", title: "Pengesahan diperlukan", body: "Pembayaran Ahmad Ali menunggu pengesahan." },
    ],
    skipDuplicates: true,
  });
  await prisma.auditLog.createMany({
    data: [
      { actor_user_id: staffUser.id, landlord_id: landlord.id, action: "payment.verify", entity_type: "payment", entity_id: payFatimah!.id, meta: { amount: 1500 } },
      { actor_user_id: staffUser.id, landlord_id: landlord.id, action: "invitation.create", entity_type: "invitation", entity_id: invitation.id, meta: { unit: "A-01-03" } },
    ],
    skipDuplicates: true,
  });

  console.log("\n✅ Seed selesai!");
  console.log("\nAkaun demo (password: Admin123!):");
  console.log("  Super Admin : admin@ezyrent.my");
  console.log("  Landlord    : landlord@demo.my");
  console.log("  Staf        : staf@demo.my");
  console.log("  Penyewa     : penyewa1@demo.my");
  console.log("  Penyewa 2   : penyewa2@demo.my (ada jemputan pending)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
