"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Save,
} from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";
import { Modal } from "@/components/ui/Modal";
import { reelsCountLabel } from "@/lib/i18n";

export interface DashboardProject {
  id: string;
  name: string;
  slug: string;
  reelsCount: number;
}

interface Props {
  initial: DashboardProject[];
}

export function ProjectsList({ initial }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState<DashboardProject[]>(initial);
  const [editing, setEditing] = useState<DashboardProject | null>(null);
  const [deleting, setDeleting] = useState<DashboardProject | null>(null);

  if (projects.length === 0) {
    return (
      <div className="bg-surface rounded-lg p-10 text-center text-icon">
        <Plus size={28} strokeWidth={1.4} className="mx-auto mb-3" />
        <p>У вас пока нет проектов. Создайте первый.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((project) => (
          <li key={project.id} className="bg-surface rounded-lg p-5 flex flex-col gap-4">
            <Link
              href={`/projects/${project.id}/view`}
              className="block group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[16px] font-medium truncate group-hover:text-iconHover transition-colors">
                  {project.name}
                </span>
                <ExternalLink
                  size={16}
                  strokeWidth={1.4}
                  className="text-icon shrink-0 mt-1 group-hover:text-iconHover transition-colors"
                />
              </div>
              <div className="mt-2 text-[12px] text-icon flex items-center gap-3">
                <span>{reelsCountLabel(project.reelsCount)}</span>
                <span>·</span>
                <span>/{project.slug}</span>
              </div>
            </Link>
            <div className="flex items-center gap-1 -mb-2">
              <IconButton
                icon={Pencil}
                size="sm"
                onClick={() => setEditing(project)}
              >
                Редактировать
              </IconButton>
              <IconButton
                icon={Trash2}
                size="sm"
                onClick={() => setDeleting(project)}
              >
                Удалить
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      <EditModal
        project={editing}
        onClose={() => setEditing(null)}
        onSaved={(p) => {
          setProjects((prev) =>
            prev.map((x) => (x.id === p.id ? { ...x, name: p.name } : x)),
          );
          setEditing(null);
          router.refresh();
        }}
      />
      <DeleteModal
        project={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={(id) => {
          setProjects((prev) => prev.filter((x) => x.id !== id));
          setDeleting(null);
          router.refresh();
        }}
      />
    </>
  );
}

function EditModal({
  project,
  onClose,
  onSaved,
}: {
  project: DashboardProject | null;
  onClose: () => void;
  onSaved: (p: DashboardProject) => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) setName(project.name);
  }, [project]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("save_failed");
      onSaved({ ...project, name: name.trim() });
      setName("");
    } catch {
      setError("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setName("");
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={!!project}
      onClose={handleClose}
      title="Переименовать проект"
      footer={
        <>
          <IconButton onClick={handleClose} type="button">
            Отмена
          </IconButton>
          <button
            type="submit"
            form="edit-project-form"
            disabled={saving || !name.trim()}
            className="h-10 px-4 rounded-md inline-flex items-center gap-2 text-white bg-accent hover:bg-[#0a55bd] transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} strokeWidth={1.6} className="animate-spin" />
            ) : (
              <Save size={16} strokeWidth={1.6} />
            )}
            Сохранить
          </button>
        </>
      }
    >
      <form id="edit-project-form" onSubmit={handleSave}>
        <TextField
          variant="surface"
          label="Название проекта"
          autoFocus
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    </Modal>
  );
}

function DeleteModal({
  project,
  onClose,
  onDeleted,
}: {
  project: DashboardProject | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setConfirm("");
    setError(null);
    onClose();
  }

  async function handleDelete() {
    if (!project) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete_failed");
      onDeleted(project.id);
      setConfirm("");
    } catch {
      setError("Не удалось удалить");
    } finally {
      setDeleting(false);
    }
  }

  const expectedConfirm = project?.name ?? "";
  const canDelete = confirm.trim() === expectedConfirm.trim();

  return (
    <Modal
      open={!!project}
      onClose={handleClose}
      title="Удалить проект"
      footer={
        <>
          <IconButton onClick={handleClose} type="button">
            Отмена
          </IconButton>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || !canDelete}
            className="h-10 px-4 rounded-md inline-flex items-center gap-2 text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 size={16} strokeWidth={1.6} className="animate-spin" />
            ) : (
              <Trash2 size={16} strokeWidth={1.6} />
            )}
            Удалить навсегда
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="inline-flex gap-2 text-[13px] text-icon">
          <AlertTriangle
            size={16}
            strokeWidth={1.6}
            className="text-red-500 shrink-0 mt-0.5"
          />
          <p>
            Будут удалены {project?.reelsCount ?? 0} рилсов и все загруженные
            файлы (фоны, видео при наведении, основные видео) из S3. Действие
            необратимо.
          </p>
        </div>
        <TextField
          variant="surface"
          label={`Введите "${expectedConfirm}" для подтверждения`}
          autoFocus
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </Modal>
  );
}
