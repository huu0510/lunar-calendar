import type { Metadata } from "next";
import { LoginForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallback(params.callbackUrl);
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h1 className="font-serif text-3xl font-semibold">Đăng nhập</h1>
      <p className="mt-1 mb-4 text-sm text-muted">Mỗi người chỉ thấy sự kiện và người nhận của mình.</p>
      <LoginForm callbackUrl={callbackUrl} initialError={params.error} />
    </div>
  );
}

function safeCallback(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/events";
  return value;
}
