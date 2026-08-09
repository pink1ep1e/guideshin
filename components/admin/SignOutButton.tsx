"use client";

import { signOut } from "next-auth/react";

export default function AdminSignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/login?callbackUrl=/admin" })}
      className="ui-btn-secondary"
    >
      Выйти
    </button>
  );
}
