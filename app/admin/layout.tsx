import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/shared";
import { AdminPasteProvider } from "@/components/admin/AdminPasteContext";
import { AdminDeleteProvider } from "@/components/admin/AdminDeleteContext";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <AdminPasteProvider>
        <AdminDeleteProvider>{children}</AdminDeleteProvider>
      </AdminPasteProvider>
    </AuthSessionProvider>
  );
}
