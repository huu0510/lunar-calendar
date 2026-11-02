import type { Metadata } from "next";
import { Converter } from "@/components/Converter";
import { todayInVietnam } from "@/lib/dates";

export const metadata: Metadata = { title: "Đổi ngày" };
export const dynamic = "force-dynamic";

export default function ConvertPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Đổi ngày</h1>
        <p className="mt-1 text-sm text-muted">Dương lịch sang âm lịch và ngược lại, theo múi giờ Việt Nam.</p>
      </div>
      <Converter today={todayInVietnam()} />
    </div>
  );
}
