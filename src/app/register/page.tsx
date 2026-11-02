import type { Metadata } from "next";
import { RegisterForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h1 className="font-serif text-3xl font-semibold">Đăng ký</h1>
      <p className="mt-1 mb-4 text-sm text-muted">Tạo tài khoản để lưu ngày giỗ và đặt lời nhắc.</p>
      <RegisterForm />
    </div>
  );
}
