import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized: ({ token }) => token?.kind === "admin",
  },
});

export const config = {
  matcher: ["/admin/((?!login).*)"],
};
