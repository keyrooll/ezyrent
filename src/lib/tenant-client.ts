import { prisma } from "@/lib/prisma";

/**
 * Isolasi multi-tenant: semua jadual bisnes mesti diskop kepada landlord_id.
 *
 * scopedClient(landlordId) mengembalikan PrismaClient extension yang:
 *  - auto-suntik `landlord_id` pada semua operasi create/upsert
 *  - auto-filter `where` pada semua operasi baca/kemas kini/padam
 *
 * Model global (tanpa landlord_id) dikecualikan: User, Notification,
 * SubscriptionPlan, AuditLog (AuditLog ada landlord_id nullable — filter manual).
 * "Landlord" juga dikecualikan — ia sendiri ialah root tenant, diakses terus
 * guna id dari sesi.
 *
 * Nota: jenis `args` dalam $allModels ialah union semua model, jadi cast
 * diperlukan untuk suntikan field — kawalan sebenar adalah set SCOPED_MODELS
 * di atas (runtime), bukan jenis TypeScript.
 */
const SCOPED_MODELS = new Set([
  "Property",
  "Unit",
  "Tenant",
  "Tenancy",
  "RentInvoice",
  "Payment",
  "Invitation",
  "Staff",
  "PropertyStaff",
  "Document",
  "Subscription",
  "ProfileUpdateRequest",
  "UtilityBil",
  "MaintenanceRequest",
  "Expense",
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SebarangArgs = any;

export function scopedClient(landlordId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !SCOPED_MODELS.has(model)) {
            return query(args);
          }
          const a = args as SebarangArgs;

          switch (operation) {
            // Tulis: paksa landlord_id yang betul
            case "create":
              return query({ ...a, data: { ...a.data, landlord_id: landlordId } });
            case "createMany": {
              const data = a.data as object[] | object;
              const baris = (Array.isArray(data) ? data : [data]).map((d) => ({
                ...d,
                landlord_id: landlordId,
              }));
              return query({ ...a, data: Array.isArray(data) ? baris : baris[0] });
            }
            case "upsert":
              return query({
                ...a,
                where: { ...(a.where ?? {}), landlord_id: landlordId },
                create: { ...(a.create ?? {}), landlord_id: landlordId },
              });
            case "update":
              return query({
                ...a,
                where: { ...(a.where ?? {}), landlord_id: landlordId },
                // pastikan kemas kini tidak menukar landlord_id
                data: { ...(a.data ?? {}), landlord_id: undefined },
              });
            case "updateMany":
            case "deleteMany":
              return query({ ...a, where: { ...(a.where ?? {}), landlord_id: landlordId } });
            case "delete":
              return query({ ...a, where: { ...(a.where ?? {}), landlord_id: landlordId } });

            // Baca: filter wajib (findUnique, findFirst, findMany, count,
            // aggregate, groupBy, dan varian OrThrow)
            default:
              return query({ ...a, where: { ...(a.where ?? {}), landlord_id: landlordId } });
          }
        },
      },
    },
  });
}
