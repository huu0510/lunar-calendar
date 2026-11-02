"use client";

import { useState } from "react";
import { createRecipient } from "@/app/recipients/actions";
import { inputClass, labelClass, primaryButton } from "@/components/styles";

export function RecipientForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-3 rounded-3xl border border-line bg-white p-5 shadow-sm"
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await createRecipient(formData);
        if (result?.error) {
          setError(result.error);
          setPending(false);
        }
      }}
    >
      <h2 className="font-serif text-xl font-semibold">Thêm người nhận</h2>
      <label className={labelClass}>
        Tên
        <input className={inputClass} name="name" required maxLength={80} />
      </label>
      <label className={labelClass}>
        Kênh
        <select className={inputClass} name="channel" defaultValue="TELEGRAM">
          <option value="TELEGRAM">Telegram</option>
          <option value="ZALO">Zalo</option>
        </select>
      </label>
      <label className={labelClass}>
        Chat ID hoặc User ID
        <input className={inputClass} name="externalId" required inputMode="numeric" />
      </label>
      {error ? <p className="text-sm font-medium text-cinnabar">{error}</p> : null}
      <button className={primaryButton} type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu người nhận"}
      </button>
    </form>
  );
}
