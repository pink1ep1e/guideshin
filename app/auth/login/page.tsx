import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import { isGoogleAuthEnabled } from "@/lib/auth";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Вход | ${SITE_NAME}` },
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="container-page flex flex-1 items-center justify-center py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Загрузка…</div>}>
        <LoginForm googleEnabled={isGoogleAuthEnabled} />
      </Suspense>
    </div>
  );
}
