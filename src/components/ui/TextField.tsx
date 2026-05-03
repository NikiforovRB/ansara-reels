"use client";

import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  variant?: "white" | "surface";
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    { label, hint, error, className, id, variant = "white", ...rest },
    ref,
  ) {
    const inputId = id || rest.name;
    return (
      <label htmlFor={inputId} className="block">
        {label && (
          <span className="text-[13px] text-icon block mb-1.5">{label}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            "w-full h-10 px-3 rounded-md text-[15px]",
            "placeholder:text-icon transition-colors",
            variant === "surface" ? "bg-surface" : "bg-white",
            error && "ring-1 ring-red-500/50",
            className,
          )}
          {...rest}
        />
        {(hint || error) && (
          <span
            className={twMerge(
              "block mt-1 text-[12px]",
              error ? "text-red-500" : "text-icon",
            )}
          >
            {error || hint}
          </span>
        )}
      </label>
    );
  },
);
