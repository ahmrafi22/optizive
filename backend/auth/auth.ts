import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { CredentialsSignin } from "@auth/core/errors";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

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
          role: user.role,
          username: user.username,
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
      // Handle Google sign-in
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await prisma.user.findFirst({
            where: { email: user.email },
          });

          if (!existingUser) {
            // Create new user with Google data
            const username = user.email.split("@")[0] + "_" + Date.now();
            await prisma.user.create({
              data: {
                id: randomUUID(),
                name: user.name || "Google User",
                email: user.email,
                username: username,
                role: "STORE_OWNER", // Default role
              },
            });
          }
        } catch (error) {
          console.error("Error saving Google user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.username = (user as { username?: string }).username;
      } else if (token.email) {
        // Fetch user data for Google users
        const dbUser = await prisma.user.findFirst({
          where: { email: token.email },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.username = dbUser.username;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as string | undefined;
        session.user.username = token.username as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
