"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/auth" || pathname.startsWith("/auth/");

  if (isAuth) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
