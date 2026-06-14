"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

export function LogoutButton({
  variant,
}: {
  variant?: "onDark";
}) {
  return (
    <IconButton
      icon={LogOut}
      size="sm"
      className={
        variant === "onDark"
          ? "text-white/70 hover:text-white"
          : undefined
      }
      onClick={() => {
        const home =
          typeof window !== "undefined"
            ? `${window.location.origin}/`
            : "/";
        void signOut({ callbackUrl: home });
      }}
    >
      Выйти
    </IconButton>
  );
}
