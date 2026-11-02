"use client";

export function DeleteButton({
  action,
  id,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Xóa mục này? Thao tác không hoàn tác được.")) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm font-semibold text-cinnabar">
        {label}
      </button>
    </form>
  );
}
