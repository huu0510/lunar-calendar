"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";

export async function registerUser(
  formData: FormData,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Email không hợp lệ." };
  if (password.length < 8) return { ok: false, error: "Mật khẩu cần ít nhất 8 ký tự." };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "Email này đã có tài khoản." };
  await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash: await hash(password, 10),
    },
  });
  return { ok: true, email };
}
