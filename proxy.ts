import { withAuth } from "next-auth/middleware";
import { isAdminToken } from "@/lib/admin-auth";

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized: ({ token }) => isAdminToken(token),
  },
});

export const config = {
  matcher: ["/admin/((?!login).*)"],
};
