"use client";

import { Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";

interface NumberStepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  className?: string;
  width?: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function NumberStepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
  width = 124,
}: NumberStepperProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const dec = () => onChange(clamp(value - step, min, max));
  const inc = () => onChange(clamp(value + step, min, max));

  return (
    <div
      className={`inline-flex items-center bg-white rounded-md h-8 select-none overflow-hidden ${className ?? ""}`}
      style={{ width }}
    >
      <button
        type="button"
        aria-label="Уменьшить"
        onClick={dec}
        disabled={value <= min}
        className="h-8 w-8 shrink-0 inline-flex items-center justify-center text-icon hover:text-iconHover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Minus size={14} strokeWidth={1.6} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        size={1}
        value={text}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d-]/g, "");
          setText(raw);
          const n = Number(raw);
          if (!Number.isNaN(n)) onChange(clamp(n, min, max));
        }}
        onBlur={() => setText(String(value))}
        className="flex-1 min-w-0 w-full h-8 text-center bg-transparent text-[13px] focus:outline-none px-0"
      />
      <button
        type="button"
        aria-label="Увеличить"
        onClick={inc}
        disabled={value >= max}
        className="h-8 w-8 shrink-0 inline-flex items-center justify-center text-icon hover:text-iconHover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus size={14} strokeWidth={1.6} />
      </button>
    </div>
  );
}
