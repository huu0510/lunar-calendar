"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm font-semibold text-gold-soft underline-offset-2 hover:underline"
    >
      Đăng xuất
    </button>
  );
}
