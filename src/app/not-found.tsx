import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <h1 className="font-serif text-3xl font-semibold">Không tìm thấy trang</h1>
      <Link href="/" className="mt-4 inline-block font-semibold text-cinnabar">
        Về lịch tháng
      </Link>
    </div>
  );
}
