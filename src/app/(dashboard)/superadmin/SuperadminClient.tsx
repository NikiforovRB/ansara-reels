"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Folder,
  Film,
  HardDrive,
  Plus,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";
import { Modal } from "@/components/ui/Modal";
import {
  formatBytes,
  formatDateRu,
  pluralRu,
  PROJECT_FORMS,
  VIDEO_FORMS,
} from "@/lib/i18n";

export interface AdminProject {
  id: string;
  name: string;
  videoCount: number;
  videoBytes: number;
}

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  projectCount: number;
  videoCount: number;
  videoBytes: number;
  projects: AdminProject[];
}

interface Props {
  users: AdminUser[];
  currentUserId: string;
}

export function SuperadminClient({ users, currentUserId }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [transferring, setTransferring] = useState<{
    project: AdminProject;
    fromUserId: string;
  } | null>(null);

  const totals = useMemo(
    () => ({
      users: users.length,
      projects: users.reduce((s, u) => s + u.projectCount, 0),
      videos: users.reduce((s, u) => s + u.videoCount, 0),
      bytes: users.reduce((s, u) => s + u.videoBytes, 0),
    }),
    [users],
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-medium">Суперадмин</h1>
          <p className="text-icon text-sm mt-1">
            Управление всеми пользователями платформы
          </p>
        </div>
        <IconButton icon={Plus} variant="accent" onClick={() => setCreating(true)}>
          Добавить профиль
        </IconButton>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Пользователи" value={String(totals.users)} />
        <StatCard label="Проекты" value={String(totals.projects)} />
        <StatCard label="Видео" value={String(totals.videos)} />
        <StatCard label="Объём видео" value={formatBytes(totals.bytes)} />
      </div>

      <div className="flex flex-col gap-4">
        {users.map((u) => (
          <div key={u.id} className="bg-surface rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[15px] font-medium truncate">
                  {u.email}
                </div>
                <div className="text-icon text-xs mt-0.5">
                  Зарегистрирован: {formatDateRu(u.createdAt)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1.5 text-icon">
                  <Folder size={15} strokeWidth={1.6} />
                  {u.projectCount} {pluralRu(u.projectCount, PROJECT_FORMS)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-icon">
                  <Film size={15} strokeWidth={1.6} />
                  {u.videoCount} {pluralRu(u.videoCount, VIDEO_FORMS)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-icon">
                  <HardDrive size={15} strokeWidth={1.6} />
                  {formatBytes(u.videoBytes)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-3">
              <IconButton
                icon={Pencil}
                size="sm"
                onClick={() => setEditing(u)}
              >
                Редактировать
              </IconButton>
              {u.id !== currentUserId && (
                <IconButton
                  icon={Trash2}
                  size="sm"
                  onClick={() => setDeleting(u)}
                >
                  Удалить
                </IconButton>
              )}
            </div>

            {u.projects.length > 0 ? (
              <div className="mt-4 bg-white rounded-md overflow-hidden">
                <div className="grid grid-cols-[1fr_90px_120px_120px] px-4 py-2.5 text-[11px] uppercase tracking-wide text-icon">
                  <span>Проект</span>
                  <span className="text-right">Видео</span>
                  <span className="text-right">Объём</span>
                  <span className="text-right">Действие</span>
                </div>
                {u.projects.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1fr_90px_120px_120px] items-center px-4 py-2.5 text-sm border-t border-[#eceef2]"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-right">{p.videoCount}</span>
                    <span className="text-right">
                      {formatBytes(p.videoBytes)}
                    </span>
                    <span className="flex justify-end">
                      <IconButton
                        icon={ArrowRightLeft}
                        size="sm"
                        onClick={() =>
                          setTransferring({ project: p, fromUserId: u.id })
                        }
                      >
                        Перенести
                      </IconButton>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-icon text-sm">Нет проектов.</div>
            )}
          </div>
        ))}
      </div>

      <UserModal
        mode="create"
        open={creating}
        onClose={() => setCreating(false)}
        onDone={() => {
          setCreating(false);
          router.refresh();
        }}
      />
      <UserModal
        mode="edit"
        open={!!editing}
        user={editing}
        onClose={() => setEditing(null)}
        onDone={() => {
          setEditing(null);
          router.refresh();
        }}
      />
      <DeleteUserModal
        user={deleting}
        onClose={() => setDeleting(null)}
        onDone={() => {
          setDeleting(null);
          router.refresh();
        }}
      />
      <TransferModal
        data={transferring}
        users={users}
        onClose={() => setTransferring(null)}
        onDone={() => {
          setTransferring(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-lg p-4">
      <div className="text-icon text-xs">{label}</div>
      <div className="text-2xl font-medium mt-1.5">{value}</div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  busy,
  danger,
  form,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  danger?: boolean;
  form?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || busy}
      className={`h-10 px-4 rounded-md inline-flex items-center gap-2 text-white transition-colors disabled:opacity-60 ${
        danger ? "bg-red-500 hover:bg-red-600" : "bg-accent hover:bg-[#0a55bd]"
      }`}
    >
      {busy && <Loader2 size={16} strokeWidth={1.6} className="animate-spin" />}
      {children}
    </button>
  );
}

function UserModal({
  mode,
  open,
  user,
  onClose,
  onDone,
}: {
  mode: "create" | "edit";
  open: boolean;
  user?: AdminUser | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialFor, setInitialFor] = useState<string | null>(null);

  // Sync fields when the target user changes (edit mode) or on open.
  const activeKey = mode === "edit" ? (user?.id ?? null) : "create";
  if (open && initialFor !== activeKey) {
    setInitialFor(activeKey);
    setEmail(mode === "edit" ? (user?.email ?? "") : "");
    setPassword("");
    setError(null);
  }

  function close() {
    setInitialFor(null);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let res: Response;
      if (mode === "create") {
        res = await fetch("/api/superadmin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
      } else {
        const payload: { email?: string; password?: string } = {};
        if (email.trim() && email.trim() !== user?.email) {
          payload.email = email.trim();
        }
        if (password) payload.password = password;
        if (Object.keys(payload).length === 0) {
          close();
          return;
        }
        res = await fetch(`/api/superadmin/users/${user?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (data.error === "email_taken") {
          throw new Error("Этот email уже занят");
        }
        if (data.error === "invalid_input") {
          throw new Error("Проверьте email и пароль (минимум 8 символов)");
        }
        throw new Error("Не удалось сохранить");
      }
      setInitialFor(null);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    mode === "create"
      ? email.trim().length > 0 && password.length >= 8
      : true;

  return (
    <Modal
      open={open}
      onClose={close}
      title={mode === "create" ? "Новый профиль" : "Редактировать профиль"}
      footer={
        <>
          <IconButton onClick={close} type="button">
            Отмена
          </IconButton>
          <PrimaryButton
            type="submit"
            form="superadmin-user-form"
            disabled={!canSubmit}
            busy={busy}
          >
            {mode === "create" ? "Создать" : "Сохранить"}
          </PrimaryButton>
        </>
      }
    >
      <form
        id="superadmin-user-form"
        onSubmit={submit}
        className="flex flex-col gap-3"
      >
        <TextField
          variant="surface"
          label="Email (логин)"
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          variant="surface"
          label={
            mode === "create"
              ? "Пароль (минимум 8 символов)"
              : "Новый пароль (оставьте пустым, чтобы не менять)"
          }
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </Modal>
  );
}

function DeleteUserModal({
  user,
  onClose,
  onDone,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setConfirm("");
    setError(null);
    onClose();
  }

  async function handleDelete() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/superadmin/users/${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete_failed");
      setConfirm("");
      onDone();
    } catch {
      setError("Не удалось удалить");
    } finally {
      setBusy(false);
    }
  }

  const canDelete = !!user && confirm.trim() === user.email.trim();

  return (
    <Modal
      open={!!user}
      onClose={close}
      title="Удалить профиль"
      footer={
        <>
          <IconButton onClick={close} type="button">
            Отмена
          </IconButton>
          <PrimaryButton
            danger
            onClick={handleDelete}
            disabled={!canDelete}
            busy={busy}
          >
            Удалить навсегда
          </PrimaryButton>
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
            Будут удалены все проекты пользователя ({user?.projectCount ?? 0}),
            рилсы, аналитика и загруженные файлы из S3. Действие необратимо.
          </p>
        </div>
        <TextField
          variant="surface"
          label={`Введите "${user?.email ?? ""}" для подтверждения`}
          autoFocus
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </Modal>
  );
}

function TransferModal({
  data,
  users,
  onClose,
  onDone,
}: {
  data: { project: AdminProject; fromUserId: string } | null;
  users: AdminUser[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setTarget("");
    setError(null);
    onClose();
  }

  async function handleTransfer() {
    if (!data || !target) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/superadmin/projects/${data.project.id}/transfer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: target }),
        },
      );
      if (!res.ok) throw new Error("transfer_failed");
      setTarget("");
      onDone();
    } catch {
      setError("Не удалось перенести проект");
    } finally {
      setBusy(false);
    }
  }

  const candidates = users.filter((u) => u.id !== data?.fromUserId);

  return (
    <Modal
      open={!!data}
      onClose={close}
      title="Перенести проект"
      footer={
        <>
          <IconButton onClick={close} type="button">
            Отмена
          </IconButton>
          <PrimaryButton onClick={handleTransfer} disabled={!target} busy={busy}>
            Перенести
          </PrimaryButton>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-icon">
          Проект <span className="text-[#0f1115]">«{data?.project.name}»</span>{" "}
          будет передан выбранному пользователю. Все рилсы, настройки и файлы
          сохранятся.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-icon">Новый владелец</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-10 px-2 rounded-md bg-surface text-sm"
          >
            <option value="">Выберите пользователя…</option>
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </Modal>
  );
}
