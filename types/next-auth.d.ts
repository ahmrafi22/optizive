import { type DefaultSession } from "next-auth";
import { UserRole } from "@/prisma/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: UserRole;
      username?: string;
      onboarded?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    username?: string;
    onboarded?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    username?: string;
    onboarded?: boolean;
  }
}
