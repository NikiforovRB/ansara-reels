"use client";

import { useEffect, useRef, useState } from "react";
import { Save, Loader2, Check } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface SaveBarProps {
  dirty: boolean;
  onSave: () => Promise<void>;
}

type Status = "idle" | "saving" | "saved" | "error";

export function SaveBar({ dirty, onSave }: SaveBarProps) {
  const [status, setStatus] = useState<Status>("idle");
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (dirty) setStatus("idle");
  }, [dirty]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const visible = dirty || status === "saving" || status === "saved" || status === "error";
  if (!visible) return null;

  async function handleClick() {
    if (status === "saving") return;
    setStatus("saving");
    try {
      await onSave();
      setStatus("saved");
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className={twMerge(
        "fixed bottom-6 right-6 z-[200]",
        "flex items-center gap-3",
      )}
    >
      {status === "saving" && (
        <span className="inline-flex items-center gap-2 text-icon text-sm">
          <Loader2 size={16} strokeWidth={1.6} className="animate-spin" />
          Сохраняем…
        </span>
      )}
      {status === "saved" && !dirty && (
        <span className="inline-flex items-center gap-2 text-emerald-600 text-sm">
          <Check size={16} strokeWidth={2} />
          Изменения успешно сохранены
        </span>
      )}
      {status === "error" && (
        <span className="inline-flex items-center gap-2 text-red-500 text-sm">
          Не удалось сохранить
        </span>
      )}
      {dirty && (
        <button
          type="button"
          onClick={handleClick}
          disabled={status === "saving"}
          className={twMerge(
            "h-10 px-4 rounded-md inline-flex items-center gap-2 text-white",
            "bg-accent hover:bg-[#0a55bd] transition-colors",
            "shadow-[0_8px_24px_rgba(15,104,228,0.25)]",
            status === "saving" && "opacity-70 cursor-wait",
          )}
        >
          <Save size={16} strokeWidth={1.6} />
          Сохранить изменения
        </button>
      )}
    </div>
  );
}
