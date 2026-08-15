import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      landlordId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    landlordId?: string | null;
  }
}

// Auth.js v5 menggunakan @auth/core di belakang tabir — augment juga di situ
declare module "@auth/core/jwt" {
  interface JWT {
    role?: UserRole;
    landlordId?: string | null;
  }
}
