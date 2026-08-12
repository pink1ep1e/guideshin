import { Suspense } from "react";
import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { isGoogleAuthEnabled } from "@/lib/auth";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Вход | ${SITE_NAME}` },
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Загрузка…</p>}>
        <LoginForm googleEnabled={isGoogleAuthEnabled} />
      </Suspense>
    </AuthShell>
  );
}
