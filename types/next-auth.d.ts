import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      username?: string;
      onboarded?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    username?: string;
    onboarded?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    username?: string;
    onboarded?: boolean;
  }
}
