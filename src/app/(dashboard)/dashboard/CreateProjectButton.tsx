"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";

export function CreateProjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Не удалось создать проект");
      return;
    }
    const { project } = (await res.json()) as { project: { id: string } };
    setOpen(false);
    setName("");
    router.push(`/projects/${project.id}/content`);
    router.refresh();
  }

  return (
    <>
      <IconButton icon={Plus} onClick={() => setOpen(true)}>
        Создать проект
      </IconButton>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
            className="bg-white rounded-lg p-6 w-full max-w-sm flex flex-col gap-4"
          >
            <h2 className="text-lg font-medium">Новый проект</h2>
            <TextField
              variant="surface"
              label="Название"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <IconButton onClick={() => setOpen(false)} type="button">
                Отмена
              </IconButton>
              <IconButton
                icon={Plus}
                type="submit"
                loading={loading}
                variant="accent"
              >
                Создать
              </IconButton>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
