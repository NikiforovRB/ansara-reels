"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

export function LogoutButton() {
  return (
    <IconButton
      icon={LogOut}
      size="sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Выйти
    </IconButton>
  );
}
