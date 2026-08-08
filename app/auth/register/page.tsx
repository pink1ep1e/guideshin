import { Suspense } from "react";
import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";
import { isGoogleAuthEnabled } from "@/lib/auth";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Регистрация | ${SITE_NAME}` },
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="container-page flex flex-1 items-center justify-center py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Загрузка…</div>}>
        <RegisterForm googleEnabled={isGoogleAuthEnabled} />
      </Suspense>
    </div>
  );
}
