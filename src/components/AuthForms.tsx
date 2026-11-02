"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/app/register/actions";
import { inputClass, labelClass, primaryButton } from "@/components/styles";

export function LoginForm({ callbackUrl, initialError }: { callbackUrl: string; initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? "");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const form = new FormData(event.currentTarget);
        const result = await signIn("credentials", {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          redirect: false,
        });
        setPending(false);
        if (result?.error) {
          setError("Email hoặc mật khẩu không đúng.");
          return;
        }
        router.push(callbackUrl);
        router.refresh();
      }}
    >
      <label className={labelClass}>
        Email
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </label>
      <label className={labelClass}>
        Mật khẩu
        <input className={inputClass} name="password" type="password" autoComplete="current-password" required />
      </label>
      {error ? <p className="text-sm font-medium text-cinnabar">{error}</p> : null}
      <button className={`${primaryButton} w-full`} type="submit" disabled={pending}>
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
      <p className="text-sm text-muted">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-semibold text-cinnabar">
          Đăng ký
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const form = new FormData(event.currentTarget);
        const result = await registerUser(form);
        if (!result.ok) {
          setError(result.error);
          setPending(false);
          return;
        }
        const signed = await signIn("credentials", {
          email: result.email,
          password: String(form.get("password") ?? ""),
          redirect: false,
        });
        setPending(false);
        if (signed?.error) {
          router.push("/login");
          return;
        }
        router.push("/events");
        router.refresh();
      }}
    >
      <label className={labelClass}>
        Tên
        <input className={inputClass} name="name" autoComplete="name" />
      </label>
      <label className={labelClass}>
        Email
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </label>
      <label className={labelClass}>
        Mật khẩu
        <input className={inputClass} name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      {error ? <p className="text-sm font-medium text-cinnabar">{error}</p> : null}
      <button className={`${primaryButton} w-full`} type="submit" disabled={pending}>
        {pending ? "Đang tạo…" : "Tạo tài khoản"}
      </button>
      <p className="text-sm text-muted">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-cinnabar">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
