import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { CredentialsSignin } from "@auth/core/errors";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { UserRole } from "@/prisma/generated/prisma/enums";

const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          throw new CredentialsSignin("Please provide both email and password.");
        }

        const user = await prisma.user.findFirst({
          where: { email },
        });

        if (!user || !user.password) {
          throw new CredentialsSignin("Invalid email or password.");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new CredentialsSignin("Invalid email or password.");
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email ?? undefined,
          image: user.profileImage ?? undefined,
          role: user.role,
          username: user.username ?? undefined,
          onboarded: user.onboarded,
          banned: user.banned,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      // Banned check for all providers
      if ((user as any).banned) {
        return false;
      }
      if (account?.provider === "google" && user.email) {
        const existingUser = await prisma.user.findFirst({
          where: { email: user.email },
        });
        if (existingUser?.banned) {
          return false;
        }
        if (!existingUser) {
          try {
            const username = user.email.split("@")[0] + "_" + Date.now();
            await prisma.user.create({
              data: {
                id: randomUUID(),
                name: user.name || "Google User",
                email: user.email,
                username: username,
                role: "NONE",
                onboarded: false,
              },
            });
          } catch (error) {
            console.error("Error saving Google user:", error);
            return false;
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
        token.onboarded = user.onboarded;
        token.image = user.image ?? token.image;
      } else if (token.email) {
        const dbUser = await prisma.user.findFirst({
          where: { email: token.email },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.username = dbUser.username;
          token.onboarded = dbUser.onboarded;
          token.image = dbUser.profileImage ?? token.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as UserRole | undefined;
        session.user.username = token.username as string | undefined;
        session.user.onboarded = token.onboarded as boolean | undefined;
        session.user.image = (token.image as string | undefined) ?? session.user.image;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
