import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { withPrisma } from "@/prisma/prisma-client";

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await withPrisma((prisma) =>
          prisma.user.findUnique({ where: { email } }),
        );
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          kind: "user" as const,
        };
      },
    }),
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin",
      credentials: {
        userName: { label: "Логин", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.userName || !credentials?.password) return null;

        const admin = await withPrisma((prisma) =>
          prisma.adminUser.findUnique({
            where: { userName: credentials.userName },
          }),
        );
        if (!admin) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          admin.password,
        );
        if (!isValid) return null;

        return {
          id: String(admin.id),
          name: admin.userName,
          email: null,
          kind: "admin" as const,
          role: admin.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return true;

      const email = user.email.trim().toLowerCase();
      await withPrisma(async (prisma) => {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: user.name ?? existing.name,
              image: user.image ?? existing.image,
              emailVerified: existing.emailVerified ?? new Date(),
            },
          });
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: "google",
                providerAccountId: account.providerAccountId,
              },
            },
            create: {
              userId: existing.id,
              type: account.type,
              provider: "google",
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state as string | undefined,
            },
            update: {
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              id_token: account.id_token,
            },
          });
          user.id = existing.id;
          return;
        }

        const created = await prisma.user.create({
          data: {
            email,
            name: user.name,
            image: user.image,
            emailVerified: new Date(),
            accounts: {
              create: {
                type: account.type,
                provider: "google",
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | undefined,
              },
            },
          },
        });
        user.id = created.id;
      });

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const kind =
          ((user as { kind?: "user" | "admin" }).kind ?? "user") as
            | "user"
            | "admin";
        token.kind = kind;
        token.role = (user as { role?: string }).role;
        token.uid = user.id;
        if (user.email) token.email = user.email;

        if (account?.provider === "google" && user.email) {
          token.kind = "user";
          const dbUser = await withPrisma((prisma) =>
            prisma.user.findUnique({
              where: { email: user.email!.toLowerCase() },
              select: { id: true },
            }),
          );
          if (dbUser) {
            token.uid = dbUser.id;
            token.sub = dbUser.id;
          }
        } else if (kind === "user" && user.id) {
          token.sub = user.id;
        }
      } else if (
        token.kind !== "admin" &&
        typeof token.email === "string" &&
        token.email
      ) {
        const uid = String(token.uid || token.sub || "");
        // Google sub часто чисто числовой / длинный — чиним на cuid из БД
        const looksForeign = !uid || /^\d+$/.test(uid) || uid.length > 36;
        if (looksForeign) {
          const dbUser = await withPrisma((prisma) =>
            prisma.user.findUnique({
              where: { email: token.email!.toLowerCase() },
              select: { id: true },
            }),
          );
          if (dbUser) {
            token.uid = dbUser.id;
            token.sub = dbUser.id;
            token.kind = "user";
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) || (token.sub as string);
        session.user.kind = (token.kind as "user" | "admin") || "user";
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
};

export const isGoogleAuthEnabled = googleConfigured;
