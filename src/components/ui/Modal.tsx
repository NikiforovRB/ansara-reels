"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 420,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center px-4"
      style={{ background: "rgba(15, 17, 21, 0.55)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={twMerge(
          "bg-white rounded-lg shadow-xl w-full flex flex-col",
          className,
        )}
        style={{ maxWidth: `${width}px` }}
      >
        {(title || true) && (
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="text-[16px] font-medium">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="text-icon hover:text-iconHover transition-colors"
            >
              <X size={18} strokeWidth={1.6} />
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 pb-4 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
