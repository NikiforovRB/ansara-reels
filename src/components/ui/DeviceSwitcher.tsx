"use client";

import { Monitor, Smartphone } from "lucide-react";
import { twMerge } from "tailwind-merge";

export type Device = "desktop" | "mobile";

interface DeviceSwitcherProps {
  value: Device;
  onChange: (v: Device) => void;
  className?: string;
}

export function DeviceSwitcher({ value, onChange, className }: DeviceSwitcherProps) {
  return (
    <div
      className={twMerge(
        "inline-flex items-center bg-surface rounded-full p-1 select-none",
        className,
      )}
    >
      <Segment
        active={value === "desktop"}
        onClick={() => onChange("desktop")}
        icon={<Monitor size={15} strokeWidth={1.6} />}
      >
        Десктоп
      </Segment>
      <Segment
        active={value === "mobile"}
        onClick={() => onChange("mobile")}
        icon={<Smartphone size={15} strokeWidth={1.6} />}
      >
        Мобильный
      </Segment>
    </div>
  );
}

function Segment({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={twMerge(
        "h-8 px-3 rounded-full text-[13px] inline-flex items-center gap-1.5 transition-all",
        active
          ? "bg-white text-iconHover shadow-[0_1px_2px_rgba(15,17,21,0.08)]"
          : "text-icon hover:text-iconHover",
      )}
      data-active={active || undefined}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
