"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <h1 className="font-serif text-3xl font-semibold">Có lỗi xảy ra</h1>
      <button type="button" onClick={reset} className="mt-4 font-semibold text-cinnabar">
        Thử lại
      </button>
    </div>
  );
}
