import Link from "next/link";
import { DesktopNav, MobileNav } from "@/components/MobileNav";
import { SignOutButton } from "@/components/SignOutButton";

export function AppShell({
  user,
  children,
}: {
  user: { name: string | null; email: string } | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full">
      <header className="bg-indigo text-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-gold-soft">VIỆT NAM</p>
            <p className="font-serif text-2xl leading-none font-semibold">Lịch âm</p>
          </Link>
          <DesktopNav />
          <div className="text-right text-sm">
            {user ? (
              <div className="flex flex-col items-end gap-1">
                <span className="max-w-40 truncate text-paper/90">{user.name || user.email}</span>
                <SignOutButton />
              </div>
            ) : (
              <Link href="/login" className="font-semibold text-gold-soft">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
        <div className="h-1 bg-cinnabar" />
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pt-5 pb-24 md:pb-12">{children}</main>
      <MobileNav />
    </div>
  );
}
