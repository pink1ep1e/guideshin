import { redirect } from "next/navigation";

/** Старый логин AdminUser → обычный вход сайта с ролью admin. */
export default function AdminLoginPage() {
  redirect("/auth/login?callbackUrl=/admin");
}
