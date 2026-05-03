"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "email_taken") {
          setError("Этот email уже используется");
        } else if (body.error === "invalid_input") {
          setError("Проверьте email и пароль (минимум 8 символов)");
        } else {
          setError("Не удалось создать аккаунт");
        }
        return;
      }
      const sign = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!sign || sign.error) {
        setError("Аккаунт создан, но не удалось войти автоматически");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-2xl font-medium mb-2">Регистрация</h1>
        <TextField
          variant="surface"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          variant="surface"
          label="Пароль"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="Минимум 8 символов"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex items-center justify-between mt-2">
          <Link
            href="/login"
            className="text-icon hover:text-iconHover text-sm transition-colors"
          >
            Уже есть аккаунт
          </Link>
          <IconButton
            icon={UserPlus}
            type="submit"
            loading={loading}
            variant="accent"
          >
            Создать
          </IconButton>
        </div>
      </form>
    </main>
  );
}
