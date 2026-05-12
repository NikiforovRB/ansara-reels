"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

export function LogoutButton() {
  return (
    <IconButton
      icon={LogOut}
      size="sm"
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
