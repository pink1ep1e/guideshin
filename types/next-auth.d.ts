import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      kind: "user" | "admin";
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    kind?: "user" | "admin";
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    kind?: "user" | "admin";
    role?: string;
  }
}
