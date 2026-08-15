# EZYRENT — Smart Property Management Platform

Master product specification. Versi 1.0 — 15 Ogos 2026.

---

## 1. KONSEP EZYRENT

EzyRent ialah platform SaaS untuk mengurus hartanah sewa secara menyeluruh. Ia direka untuk landlord yang mempunyai beberapa rumah/unit sewa dan juga boleh digunakan oleh property manager atau syarikat yang menguruskan banyak property.

Konsep utama EzyRent:

> Properties. Tenants. Rent. Maintenance. Everything in one place.

EzyRent bukan sekadar aplikasi untuk merekod bayaran sewa. Ia merupakan property operating system yang menggabungkan pengurusan property, tenant, tenancy agreement, rental, payment, maintenance, expenses, documents, staff, KPI, reports dan subscription dalam satu platform.

Platform ini dibina sebagai multi-tenant SaaS — satu sistem EzyRent boleh digunakan oleh ramai landlord tetapi data setiap landlord diasingkan sepenuhnya.

Contoh:

```
EZRENT PLATFORM
│
├── LANDLORD A
│   ├── Staff A1
│   ├── Staff A2
│   ├── Property 1
│   │   └── Units
│   │       └── Tenants
│   ├── Property 2
│   └── Property 3
│
├── LANDLORD B
│   ├── Staff B1
│   ├── Property 4
│   └── Property 5
│
└── LANDLORD C
    └── Properties
```

Landlord A tidak boleh melihat atau mengakses data Landlord B.

---

## 2. USER ROLES

EzyRent mempunyai empat role utama.

### 2.1 Super Admin

Pemilik/platform operator EzyRent.

Boleh: manage semua landlord, manage semua user, manage staff, view semua property, view semua tenant, manage subscription, manage pricing plan, suspend/reactivate/terminate account, change subscription plan, view platform KPI, view system logs, handle customer support, login as landlord untuk tujuan support, manage system settings.

### 2.2 Landlord

Landlord ialah customer EzyRent yang membayar subscription.

Boleh: add/edit/archive property, add unit, manage tenant, invite tenant, generate tenant QR, create tenancy, manage rental, view/verify payment, view overdue, manage maintenance, manage expenses, manage documents, add staff, assign staff, set staff permission, view reports, view KPI, manage subscription.

### 2.3 Staff / Property Manager

Staff bekerja di bawah landlord. Staff hanya boleh melihat dan mengurus property yang diberikan kepada mereka.

Boleh: view assigned property, manage assigned unit, manage tenant, record/verify payment mengikut permission, manage maintenance, upload documents, follow up overdue tenant, update maintenance status, view KPI berkaitan kerja mereka.

Staff tidak boleh secara automatik melihat semua data landlord. Permission ditentukan oleh landlord.

### 2.4 Tenant

Tenant ialah penyewa. Tenant boleh: register melalui QR/link, view property/unit/tenancy/rental, view payment history, upload payment proof, view receipt, view tenancy agreement, view documents, report maintenance issue, upload photo/video, track maintenance status, receive notification.

Tenant tidak perlu membayar subscription EzyRent.

---

## 3. PROPERTY STRUCTURE

```
PROPERTY → UNIT → TENANCY → TENANT
```

Contoh: Vista Apartment → A-01-01, A-01-02, ... ; Taman Putra House → HOUSE-01.

Ini membolehkan EzyRent digunakan untuk terrace house, semi-D, bungalow, condo, apartment, room rental, shoplot, office, multiple-unit building dan property management company.

---

## 4. PROPERTY MANAGEMENT

Setiap property mempunyai profile: name, type, address, city, state, postcode, country, lat/lng, description, photos, status (Active/Inactive/Archived), units, staff assignment, documents.

## 5. UNIT MANAGEMENT

Setiap unit: unit number, floor, bedrooms, bathrooms, furnishing, parking, monthly rental, deposit, due date, status (Vacant/Occupied/Maintenance/Reserved), photos, notes.

Dashboard menunjukkan: total units, occupied, vacant, occupancy rate, expected rental, collected rental, outstanding rental.

## 6. TENANT MANAGEMENT

Tenant profile: name, email, phone, IC/passport, DOB, occupation, emergency contact, emergency phone, profile photo, current property/unit, tenancy, rental, payment history, documents, maintenance history. Data sensitif seperti IC perlu dilindungi dan access dikawal mengikut permission.

## 7. TENANT QR REGISTRATION

Flow: Landlord/Staff → Select Unit → Invite Tenant → Generate QR → Tenant Scan → Property/Unit Information → Tenant Register → Accept Invitation → Tenant Linked.

## 8. TENANCY MANAGEMENT

Tenancy ialah kontrak antara tenant dengan unit — entity tersendiri kerana satu unit boleh mempunyai ramai tenant sepanjang sejarah.

Data: tenant, property, unit, start date, end date, monthly rent, security deposit, utility deposit, due day, agreement, status (Draft/Active/Ending/Expired/Terminated).

## 9. TENANCY RENEWAL

Landlord tekan "Renew Tenancy" — system pre-fill data lama, rental baru boleh diubah. Semua history lama kekal.

## 10. MOVE-OUT MANAGEMENT

Move-out checklist: property inspection, meter reading, keys returned, outstanding rental, utility outstanding, damage assessment, deposit calculation.

Contoh: Security Deposit RM3,000 − Damage RM300 − Utility RM120 = Refund RM2,580. Selepas tenancy ditutup: Unit → VACANT.

---

## 11. RENTAL MANAGEMENT

Rental engine: setiap active tenancy menghasilkan monthly rental invoice secara automatik. Status invoice: Pending, Partial, Paid, Overdue, Cancelled, Waived.

## 12. PAYMENT MANAGEMENT

V1 menggunakan payment proof/manual verification.

Flow: Tenant → Upload Bank Transfer Receipt → Payment Pending → Staff/Landlord Verify → Payment Verified → Invoice Updated → Receipt Generated.

Payment: amount, date, method (Bank transfer, Cash, FPX, DuitNow, Card, Other), reference, payment proof, status, verified by, verified date. Online payment gateway ialah Phase 2.

## 13. PARTIAL PAYMENT

EzyRent menyokong partial payment. Contoh: Invoice RM1,500 → Payment 1 RM500 → Payment 2 RM1,000 → Invoice PAID. Jika baru RM500 → PARTIAL, balance RM1,000.

## 14. OVERDUE MANAGEMENT

Overdue: jumlah tenant + outstanding. Filter: 1–7 hari, 8–30 hari, 31–60 hari, 60+ hari. Setiap overdue boleh dihantar reminder.

---

## 15–19. MAINTENANCE / ISSUE MANAGEMENT

- Tenant tekan "Report Issue". Category: Plumbing, Electrical, Air Conditioning, Furniture, Appliance, Structural, Cleaning, Security, Other. Input: description, photo, video, priority.
- Workflow status: NEW → ASSIGNED → IN PROGRESS → WAITING → COMPLETED. WAITING = tunggu spare part/contractor/tenant/approval.
- Ticket: ticket number, property, unit, tenant, category, priority, description, assigned staff, reported/started/completed date, estimated/actual cost, attachments, comments, activity timeline.
- Desktop: kanban drag & drop. Mobile: tabs (All | New | Progress | Waiting | Done).
- Timeline: contoh 10:35 tenant report → 10:42 staff assigned → 11:15 contractor contacted → 14:30 technician arrived → 16:20 repair completed.
- Maintenance boleh hasilkan expense (labour + parts) → masuk property financial report.

## 20. EXPENSE MANAGEMENT

Category: Maintenance, Utility, Tax, Insurance, Management, Renovation, Other. Data: property, unit, maintenance ticket (jika berkaitan), category, description, amount, date, vendor, receipt, created by.

## 21–22. DOCUMENT MANAGEMENT & SECURITY

Central document system untuk tenant (IC, tenancy agreement, deposit receipt, payment receipts), property, tenancy, payment (proof, receipt), maintenance (photo, video, contractor invoice). Access dikawal mengikut role, landlord, property, unit, tenant, permission. Tenant A tidak boleh buka dokumen Tenant B.

---

## 23–26. LANDLORD DASHBOARD & ANALYTICS

- KPI top: Properties, Occupied, Vacant, Occupancy %, Expected Rental, Collected, Outstanding, Overdue.
- Attention Required: 🔴 overdue payments, 🟠 maintenance tickets, 🟡 agreements expiring 30 hari, ⚪ vacant units. Setiap item boleh diklik.
- Graphs: Rental Collection (Expected vs Collected), 12-Month Income Trend, Collection Rate, Occupancy Rate, Income vs Expense, Property Performance ranking, Maintenance Trend, Outstanding Trend, Expense Breakdown, Tenant Rental Ranking.
- Property performance table: Units, Occupancy, Expected, Collection %, Expenses, Net.

## 27–28. STAFF MANAGEMENT & KPI

Landlord boleh add/invite staff, assign property/tenant, set role, set granular permission (contoh: Property view/edit, Tenant view/edit, Rent view/record payment, Maintenance view/create/assign/complete, Financial view), deactivate staff.

Staff KPI: complaints handled, response time, completion time, overdue follow-up, properties managed, tenants managed, maintenance completed.

## 29–32. TENANT PORTAL

- Tenant UI ringkas: "Good Morning, Ahmad 👋" + MY HOME (property, unit, monthly rent, status bulan ini) + NEXT PAYMENT + quick actions (Pay Rent, Report Issue, Agreement, Documents).
- Payment: senarai bulan, amount, status, due; payment history (month, amount, date, status, receipt).
- Maintenance: create issue, upload photo/video, view status/comments/timeline, completion notification.
- Agreement: start/end date, monthly rent, deposit, due date, dokumen agreement.

## 33–35. NOTIFICATION & REMINDER

- Tenant: rental due soon/today/overdue, payment verified, maintenance updated, agreement expiring.
- Staff: new maintenance, payment pending verification, assigned task, overdue tenant.
- Landlord: overdue payment, new maintenance, agreement expiring, vacant unit, subscription renewal, payment received.
- Automatic rental reminders: 3 hari sebelum / due date / overdue. Configurable oleh landlord. WhatsApp automation = Phase 2.
- Agreement expiry reminder: 90/60/30/7 hari. Button "Renew Tenancy".

## 36. REPORTS

V1: Rental Report (expected/collected/pending/outstanding/overdue), Property Report (occupancy/rental/expenses/net), Tenant Report (active/vacant/expiry), Maintenance Report (status + cost). Export: Excel, CSV (PDF kemudian).

---

## 37–43. SUBSCRIPTION BUSINESS MODEL

| Plan | Harga | Had unit aktif | Sasaran |
|---|---|---|---|
| FREE | RM0 | 3 | Cuba EzyRent |
| PRO | RM29/bln | 10 | Small landlord |
| BUSINESS | RM79/bln | 50 | Property investor (recommended) |
| PROFESSIONAL | RM199/bln | 200 | Property manager |
| ENTERPRISE | Custom | 200+ | Syarikat besar |

- Billing berdasarkan active unit, bukan property (lebih adil: 5 rumah = 5 unit; 1 apartment = 100 unit).
- Annual plan: Pro RM290/thn, Business RM790/thn, Professional RM1,990/thn (~2 bulan percuma).
- 14-day free trial dengan full Business features. Selepas trial: upgrade atau continue Free.
- Lifecycle: REGISTER → TRIAL (14 hari) → ACTIVE → PAYMENT DUE → GRACE PERIOD → SUSPENDED → REACTIVATE. Data tidak dipadam apabila subscription gagal.
- Suspended account: tidak boleh add property/tenant/rental baru, masih boleh login, view/download data, bayar subscription, contact support.
- Revenue streams: subscription, payment processing, AI add-on, WhatsApp add-on, tenant screening, extra storage, maintenance marketplace, enterprise/white-label, API/integration.

## 44. FUTURE MAINTENANCE MARKETPLACE (Phase 3)

Tenant report aircond rosak → staff pilih "Assign Contractor" → senarai contractor dengan harga + rating → EzyRent ambil commission.

## 45–49. AI FEATURES (Phase 2/3)

- EzyRent AI assistant: "Berapa rental belum bayar?", "Property mana paling untung?", "Siapa tenant paling kerap lewat?".
- AI Document Reader: extract start/end date, rental, deposit, due date, special terms dari agreement. AI tidak boleh ubah critical DB data tanpa validation.
- AI Receipt Reader: detect amount, date, reference, sender, possible tenant match. Staff masih verify.
- AI Maintenance Classification: kategori + priority automatik.
- AI Financial Insight: analisis collection, vacancy, expenses, profitability.

---

## 50–51. TECH STACK & ARCHITECTURE

Cadangan spec asal: Next.js + React (frontend), NestJS (backend), PostgreSQL, Prisma, Redis + BullMQ, Cloudflare R2/AWS S3, managed auth, Vercel, Sentry, GitHub, OpenAI API, PWA (V1 mobile), React Native/Expo (future).

**Keputusan M1 (2026-08-15):** Next.js 15 full-stack (App Router) — tiada NestJS berasingan; PostgreSQL 16 (Docker); Prisma 6; Auth.js v5; Tailwind v4 + shadcn/ui; Recharts; qrcode.react; UI Bahasa Melayu.

Architecture:

```
WEB (Landlord/Staff) · MOBILE/PWA (Tenant) · ADMIN PORTAL
                        ↓
                      API
                        ↓
        PostgreSQL · Redis/Queue · Storage
                        ↓
        Email · Payment · WhatsApp (Phase 2) · AI (Phase 2/3)
```

## 52–54. DATABASE & MULTI-TENANT SECURITY

Core tables V1: users, landlords, staff, properties, property_staff, units, tenants, tenancies, rent_invoices, payments, maintenance_tickets, maintenance_attachments, maintenance_activities, expenses, documents, notifications, subscription_plans, subscriptions, subscription_payments, audit_logs.

Setiap major business table perlu ada `landlord_id`. Setiap request: Authenticate → Identify User → Identify Role → Identify Landlord → Check Permission → Check Resource Ownership → Execute. Landlord A tidak boleh manipulate resource Landlord B walaupun URL/API ID ditukar secara manual.

## 55. API STRUCTURE

`/api/v1/` — auth (register, login, me), properties CRUD + units, tenants, invitations, tenancies (+renew, +terminate), rent/invoices, payments (+verify, +reject), maintenance/tickets (+assign, +status), documents, subscription, notifications, search. Dokumentasi OpenAPI/Swagger.

## 56–57. SECURITY & AUDIT LOG

Wajib: password hashing, authentication, RBAC + permission-based access, landlord data isolation, document access control, audit log, rate limiting, input validation, file validation, secure upload, database backup, HTTPS, session management, sensitive data protection. DB guna UTC; frontend guna Asia/Kuala_Lumpur.

Audit log contoh: Ali UPDATE_RENTAL Unit A-03 RM1,500 → RM1,600 15 Aug 2026 10:42 AM.

---

## 58–74. UI/UX DESIGN

- Design: modern, clean, professional, data-focused, mobile-friendly, premium SaaS feel.
- Brand personality: Simple + Smart + Trustworthy + Modern. Tagline: "Smart way to manage your property."
- Design system: Inter, page title 32px, section 20–24px, KPI 28–36px, body 14–16px, label 12–13px. Rounded cards, clean whitespace, minimal shadows, status badges, responsive.
- Status colour: Green (Paid/Active/Occupied/Completed), Amber (Pending/Due soon/Waiting/Expiring), Red (Overdue/Failed/Emergency/Suspended), Blue (Action/In Progress), Grey (Vacant/Archived/Inactive). Label wajib, bukan warna sahaja.
- Navigation: Landlord (Dashboard, Properties, Tenants, Rent & Payments, Maintenance, Documents, Staff, Reports, Notifications, Settings); Admin; Staff; Tenant (Home, My Property, Rent, Maintenance, Documents, Notifications, Profile).
- Dashboard UI, property page, unit page, tenant page, rent page, maintenance page, reports page — desktop table + mobile card.
- Global search: ⌘K (tenant, property, unit, invoice, maintenance, document).
- Empty states + wizard forms (contoh Add Property: 1 Property → 2 Units → 3 Rental → 4 Review).
- Quick actions: + Add Property, + Add Tenant, + Record Payment, + Maintenance Ticket, + Add Expense.

## 75–77. V1 MVP & PHASES

V1 lifecycle: Landlord Register → Trial/Subscription → Add Property → Add Unit → Invite Tenant → Tenant Registers via QR → Create Tenancy → Monthly Rental Generated → Tenant Pays/Uploads Proof → Landlord/Staff Verifies → Receipt → Maintenance → Reports/KPI.

V1 wajib (24 ciri): authentication, user roles, landlord account, staff, property, unit, tenant, QR tenant invite, tenancy, rental invoice, payment tracking, payment verification, maintenance ticket, kanban maintenance, documents, notifications, dashboard, KPI, reports, subscription, admin dashboard, audit log, permission system, multi-tenant security.

Phase 2 (ditangguh): online payment gateway (FPX, DuitNow, card), WhatsApp Business API, tenant screening, utility billing, property inspection, contractor management, advanced financial reports, AI document reader, AI assistant.

Phase 3: maintenance marketplace, AI financial insights, AI receipt recognition, AI maintenance classification, white-label, API marketplace, enterprise integrations.

## 78–82. MOBILE, ENVIRONMENT, PAYMENT ARCHITECTURE

- V1: Responsive Web App / PWA. Selepas traction: React Native / Expo.
- Environments: Development → Staging → Production. GitHub + CI/CD.
- Backup: daily backup DB, point-in-time recovery; storage versioning. Monitoring: API/db errors, slow request, failed jobs, payment failure, login failure (Sentry).
- Dua financial flow berasingan: EzyRent revenue (landlord → EzyRent subscription) vs landlord rental income (tenant → landlord). Ledger tidak boleh dicampur.
- Phase 2 payment flow: tenant → gateway → webhook → verify signature → invoice PAID → receipt → notification.

## 83–85. BUSINESS

- Target: small landlord (1–10 unit), property investor (10–50), property manager (50–500), property management company (500+).
- Revenue contoh @1,000 landlords: 600 Pro × RM29 + 300 Business × RM79 + 80 Professional × RM199 + 20 Enterprise × RM500 ≈ RM67,020 MRR ≈ RM804,240 ARR (belum termasuk payment fees, AI, WhatsApp, screening, marketplace, storage, white-label).
- Positioning: "Smart Property Management Platform" — bukan "rental tracking app".

## 86. FUTURE WHITE LABEL

Property management company besar guna EzyRent sebagai backend dengan branding sendiri ("ABC Property — Powered by EzyRent"). Future: custom domain, logo, colours, multiple companies, enterprise API, SSO, dedicated support.

## 87–90. LIFECYCLE, VISION & DEFINITION OF DONE

Lifecycle penuh: Register → Subscribe/Trial → Add Property → Add Unit → Invite Tenant → Tenant Register → Create Tenancy → Move In → Monthly Rent → Payment → Receipt → Maintenance → Expense → Agreement Renewal → Move Out → Deposit Settlement → Unit Vacant → New Tenant.

Product journey: Rental Management → Property Management → Property Operating System → Payment Platform → Maintenance Marketplace → AI Property Assistant → Enterprise Property Platform.

Matlamat akhir: satu platform untuk mengurus keseluruhan lifecycle property rental — dari property kosong, tenant masuk, kutipan sewa, maintenance, expenses, renewal sehingga tenant keluar dan property disewakan semula.

Core philosophy: **Know your properties. Know your tenants. Know your money. Know what needs attention. — All in one place.**
