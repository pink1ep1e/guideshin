import { Suspense } from "react";
import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";
import { isGoogleAuthEnabled } from "@/lib/auth";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Регистрация | ${SITE_NAME}` },
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <AuthShell
      artEyebrow="Новый аккаунт"
      artTitle="Сохраните молитвы в облаке"
      artText="Никнейм увидите в кабинете. Импорт с ПК, телефона или paimon.moe — в пару шагов."
      highlights={[
        { title: "Облако", text: "История молитв не пропадёт" },
        { title: "Гарант", text: "Pity по всем баннерам" },
        { title: "Импорт", text: "ПК, телефон или paimon.moe" },
      ]}
      showMascot
    >
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        }
      >
        <RegisterForm googleEnabled={isGoogleAuthEnabled} />
      </Suspense>
    </AuthShell>
  );
}
