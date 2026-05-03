"use client";

import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import type { LucideIcon } from "lucide-react";

type Variant = "ghost" | "accent";
type Size = "sm" | "md";

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const SIZE: Record<Size, string> = {
  sm: "h-8 px-2 text-sm gap-1.5",
  md: "h-10 px-3 text-[15px] gap-2",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      icon: Icon,
      iconRight: IconRight,
      variant = "ghost",
      size = "md",
      className,
      children,
      loading,
      disabled,
      ...rest
    },
    ref,
  ) {
    const base =
      "inline-flex items-center select-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const variantCls =
      variant === "ghost"
        ? "text-icon hover:text-iconHover bg-transparent"
        : "text-white bg-accent hover:bg-[#0a55bd] rounded-md";
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(base, SIZE[size], variantCls, className)}
        {...rest}
      >
        {Icon && <Icon size={size === "sm" ? 16 : 18} strokeWidth={1.6} />}
        {children && <span>{children}</span>}
        {IconRight && (
          <IconRight size={size === "sm" ? 16 : 18} strokeWidth={1.6} />
        )}
      </button>
    );
  },
);
