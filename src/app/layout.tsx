import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Noto_Serif } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { currentUser } from "@/lib/session";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const serif = Noto_Serif({
  subsets: ["vietnamese", "latin"],
  weight: ["600", "700"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Lịch âm", template: "%s · Lịch âm" },
  description: "Lịch âm Việt Nam, ngày lễ, ngày giỗ và nhắc qua Telegram, Zalo.",
};

export const viewport: Viewport = {
  themeColor: "#1b2836",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="min-h-full font-sans text-ink antialiased">
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
