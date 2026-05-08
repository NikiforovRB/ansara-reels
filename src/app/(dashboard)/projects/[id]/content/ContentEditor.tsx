"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  ToggleRight,
  ToggleLeft,
  Pencil,
  ChevronsDownUp,
} from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";
import { FileDropzone } from "@/components/editor/FileDropzone";
import { SaveBar } from "@/components/ui/SaveBar";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import type { ButtonSettings, ButtonWidthMode } from "@/lib/settings";
import { isReelActive, type VisibilityMode } from "@/lib/reel-visibility";
import { formatDateTimeRu } from "@/lib/i18n";

export interface EditorReel {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  bgImageKey: string | null;
  hoverVideoKey: string | null;
  mainVideoKey: string | null;
  bgImageUrl: string | null;
  hoverVideoUrl: string | null;
  mainVideoUrl: string | null;
  button: ButtonSettings | null;
  visibilityMode: VisibilityMode;
  startAt: string | null;
  endAt: string | null;
}

interface Props {
  projectId: string;
  initialReels: EditorReel[];
  defaultButton: ButtonSettings;
}

function reelEditableSnapshot(reel: EditorReel) {
  return {
    title: reel.title,
    subtitle: reel.subtitle,
    bgImageKey: reel.bgImageKey,
    hoverVideoKey: reel.hoverVideoKey,
    mainVideoKey: reel.mainVideoKey,
    button: reel.button,
    visibilityMode: reel.visibilityMode,
    startAt: reel.startAt,
    endAt: reel.endAt,
  };
}

export function ContentEditor({ projectId, initialReels, defaultButton }: Props) {
  const [reels, setReels] = useState<EditorReel[]>(initialReels);
  const [savedReels, setSavedReels] = useState<EditorReel[]>(initialReels);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialReels.map((r) => [r.id, true])),
  );

  const dirty = useMemo(() => {
    if (reels.length !== savedReels.length) return false; // structure changes already persisted
    const savedById = new Map(savedReels.map((r) => [r.id, r]));
    for (const r of reels) {
      const s = savedById.get(r.id);
      if (!s) return true;
      const a = JSON.stringify(reelEditableSnapshot(r));
      const b = JSON.stringify(reelEditableSnapshot(s));
      if (a !== b) return true;
    }
    return false;
  }, [reels, savedReels]);

  const updateReel = useCallback(
    (id: string, patch: Partial<EditorReel>) => {
      setReels((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    },
    [],
  );

  async function saveAll() {
    const savedById = new Map(savedReels.map((r) => [r.id, r]));
    const dirtyOnes = reels.filter((r) => {
      const s = savedById.get(r.id);
      if (!s) return true;
      return (
        JSON.stringify(reelEditableSnapshot(r)) !==
        JSON.stringify(reelEditableSnapshot(s))
      );
    });

    await Promise.all(
      dirtyOnes.map((r) =>
        fetch(`/api/projects/${projectId}/reels/${r.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: r.title,
            subtitle: r.subtitle,
            bgImageKey: r.bgImageKey,
            hoverVideoKey: r.hoverVideoKey,
            mainVideoKey: r.mainVideoKey,
            button: r.button,
            visibilityMode: r.visibilityMode,
            startAt: r.startAt,
            endAt: r.endAt,
          }),
        }).then((res) => {
          if (!res.ok) throw new Error("save_failed");
        }),
      ),
    );
    setSavedReels(reels);
  }

  async function addReel() {
    const res = await fetch(`/api/projects/${projectId}/reels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) return;
    const { reel } = (await res.json()) as { reel: EditorReel };
    const newReel: EditorReel = {
      ...reel,
      subtitle: reel.subtitle ?? "",
      bgImageUrl: null,
      hoverVideoUrl: null,
      mainVideoUrl: null,
      button: null,
      visibilityMode: reel.visibilityMode ?? "always",
      startAt: reel.startAt ?? null,
      endAt: reel.endAt ?? null,
    };
    setReels((prev) => [...prev, newReel]);
    setSavedReels((prev) => [...prev, newReel]);
    setCollapsed((prev) => ({ ...prev, [newReel.id]: false }));
  }

  async function deleteReel(id: string) {
    if (!confirm("Удалить рилс?")) return;
    await fetch(`/api/projects/${projectId}/reels/${id}`, { method: "DELETE" });
    setReels((prev) => prev.filter((r) => r.id !== id));
    setSavedReels((prev) => prev.filter((r) => r.id !== id));
  }

  function moveReel(id: string, direction: -1 | 1) {
    setReels((prev) => {
      const index = prev.findIndex((r) => r.id === id);
      if (index < 0) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(newIndex, 0, item);
      const order = next.map((r) => r.id);
      void fetch(`/api/projects/${projectId}/reels/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      // also reorder savedReels so structural change is reflected
      setSavedReels((prevSaved) => {
        const sb = new Map(prevSaved.map((r) => [r.id, r]));
        return next.map((r) => sb.get(r.id) ?? r);
      });
      return next;
    });
  }

  function toggleButton(reel: EditorReel) {
    const base = { ...defaultButton, ...(reel.button ?? {}) };
    const next: ButtonSettings = { ...base, enabled: !base.enabled };
    updateReel(reel.id, { button: next });
  }

  function updateButton(reel: EditorReel, patch: Partial<ButtonSettings>) {
    const base = { ...defaultButton, ...(reel.button ?? { enabled: true }) };
    const next: ButtonSettings = { ...base, ...patch };
    updateReel(reel.id, { button: next });
    return next;
  }

  function setReelCollapsed(id: string, value: boolean) {
    setCollapsed((prev) => ({ ...prev, [id]: value }));
  }

  function setVisibilityMode(reel: EditorReel, mode: VisibilityMode) {
    const patch: Partial<EditorReel> = { visibilityMode: mode };
    if (mode === "always") {
      patch.startAt = null;
      patch.endAt = null;
    } else if (mode === "end") {
      patch.startAt = null;
    } else if (mode === "start") {
      patch.endAt = null;
    }
    updateReel(reel.id, patch);
  }

  // Re-evaluate active/inactive split every minute (so transitioning reels
  // automatically jump between groups without a page reload).
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30 * 1000);
    return () => window.clearInterval(id);
  }, []);

  // When a scheduled reel becomes active client-side, bubble it to the top
  // of the editor's list (and persist the new order on the server).
  const promotedRef = useMemo(() => new Set<string>(), []);
  useEffect(() => {
    const now = new Date();
    let mutated = false;
    let next = reels;
    for (const r of reels) {
      if (
        r.visibilityMode === "start" ||
        r.visibilityMode === "range"
      ) {
        if (
          r.startAt &&
          new Date(r.startAt).getTime() <= now.getTime() &&
          isReelActive(r, now) &&
          !promotedRef.has(r.id)
        ) {
          // Promote to top once.
          const idx = next.findIndex((x) => x.id === r.id);
          if (idx > 0) {
            const arr = [...next];
            const [item] = arr.splice(idx, 1);
            arr.unshift(item);
            next = arr;
            mutated = true;
            promotedRef.add(r.id);
          } else {
            promotedRef.add(r.id);
          }
        }
      }
    }
    if (mutated) {
      setReels(next);
      const order = next.map((r) => r.id);
      void fetch(`/api/projects/${projectId}/reels/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      setSavedReels((prevSaved) => {
        const sb = new Map(prevSaved.map((r) => [r.id, r]));
        return next.map((r) => sb.get(r.id) ?? r);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reels, tick]);

  const groups = useMemo(() => {
    void tick; // force re-evaluation on tick changes
    const now = new Date();
    const active: EditorReel[] = [];
    const inactive: EditorReel[] = [];
    for (const r of reels) {
      if (isReelActive(r, now)) active.push(r);
      else inactive.push(r);
    }
    return { active, inactive };
  }, [reels, tick]);

  // Keep stable global indices so "Рилс #N" stays consistent with
  // the persisted order in the DB regardless of grouping.
  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    reels.forEach((r, i) => map.set(r.id, i));
    return map;
  }, [reels]);

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Рилсы</h2>
        <div className="flex items-center gap-1">
          <IconButton
            icon={ChevronsDownUp}
            size="sm"
            onClick={() =>
              setCollapsed(
                Object.fromEntries(reels.map((r) => [r.id, true])),
              )
            }
          >
            Свернуть всё
          </IconButton>
          <IconButton icon={Plus} onClick={addReel}>
            Добавить рилс
          </IconButton>
        </div>
      </div>

      <ReelsGroup
        title="Активные рилсы"
        emptyText="Нет активных рилсов."
        list={groups.active}
        indexById={indexById}
        totalCount={reels.length}
        collapsed={collapsed}
        setReelCollapsed={setReelCollapsed}
        moveReel={moveReel}
        deleteReel={deleteReel}
        updateReel={updateReel}
        toggleButton={toggleButton}
        updateButton={updateButton}
        setVisibilityMode={setVisibilityMode}
        projectId={projectId}
      />

      {groups.inactive.length > 0 && (
        <div className="mt-8">
          <ReelsGroup
            title="Неактивные рилсы"
            subtitle="Показ ещё не начался или уже завершён."
            emptyText=""
            list={groups.inactive}
            indexById={indexById}
            totalCount={reels.length}
            collapsed={collapsed}
            setReelCollapsed={setReelCollapsed}
            moveReel={moveReel}
            deleteReel={deleteReel}
            updateReel={updateReel}
            toggleButton={toggleButton}
            updateButton={updateButton}
            setVisibilityMode={setVisibilityMode}
            projectId={projectId}
            dimmed
          />
        </div>
      )}

      <SaveBar dirty={dirty} onSave={saveAll} />
    </div>
  );
}

interface ReelsGroupProps {
  title: string;
  subtitle?: string;
  emptyText: string;
  list: EditorReel[];
  indexById: Map<string, number>;
  totalCount: number;
  collapsed: Record<string, boolean>;
  setReelCollapsed: (id: string, value: boolean) => void;
  moveReel: (id: string, direction: -1 | 1) => void;
  deleteReel: (id: string) => void;
  updateReel: (id: string, patch: Partial<EditorReel>) => void;
  toggleButton: (reel: EditorReel) => void;
  updateButton: (reel: EditorReel, patch: Partial<ButtonSettings>) => ButtonSettings;
  setVisibilityMode: (reel: EditorReel, mode: VisibilityMode) => void;
  projectId: string;
  dimmed?: boolean;
}

function ReelsGroup({
  title,
  subtitle,
  emptyText,
  list,
  indexById,
  totalCount,
  collapsed,
  setReelCollapsed,
  moveReel,
  deleteReel,
  updateReel,
  toggleButton,
  updateButton,
  setVisibilityMode,
  projectId,
  dimmed,
}: ReelsGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <div className="text-icon text-xs uppercase tracking-wide">
          {title} · {list.length}
        </div>
        {subtitle && (
          <div className="text-icon text-[11px]">{subtitle}</div>
        )}
      </div>
      {list.length === 0 && emptyText && (
        <div className="bg-surface rounded-lg p-4 text-icon text-sm text-center">
          {emptyText}
        </div>
      )}
      {list.map((reel) => {
        const globalIndex = indexById.get(reel.id) ?? 0;
        const isCollapsed = collapsed[reel.id] ?? true;
        return (
          <div
            key={reel.id}
            className={`bg-surface rounded-lg p-4 flex flex-col gap-4 transition-opacity ${dimmed ? "opacity-70" : ""}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {isCollapsed ? (
                <CollapsedHeader reel={reel} index={globalIndex} />
              ) : (
                <ExpandedHeader reel={reel} index={globalIndex} />
              )}
              <div className="flex items-center gap-1 shrink-0 flex-wrap">
                {isCollapsed ? (
                  <IconButton
                    icon={Pencil}
                    size="sm"
                    onClick={() => setReelCollapsed(reel.id, false)}
                  >
                    Редактировать рилс
                  </IconButton>
                ) : (
                  <IconButton
                    icon={ChevronUp}
                    size="sm"
                    onClick={() => setReelCollapsed(reel.id, true)}
                  >
                    Свернуть
                  </IconButton>
                )}
                <IconButton
                  icon={ChevronUp}
                  size="sm"
                  onClick={() => moveReel(reel.id, -1)}
                  disabled={globalIndex === 0}
                />
                <IconButton
                  icon={ChevronDown}
                  size="sm"
                  onClick={() => moveReel(reel.id, 1)}
                  disabled={globalIndex === totalCount - 1}
                />
                <IconButton
                  icon={Trash2}
                  size="sm"
                  onClick={() => deleteReel(reel.id)}
                />
              </div>
            </div>

            {!isCollapsed && (
              <>
                <div className="flex flex-wrap gap-4 items-start">
                  <FileDropzone
                    kind="bg"
                    projectId={projectId}
                    reelId={reel.id}
                    currentKey={reel.bgImageKey}
                    currentUrl={reel.bgImageUrl}
                    label="Фоновое изображение"
                    onUploaded={({ key, publicUrl }) => {
                      updateReel(reel.id, {
                        bgImageKey: key,
                        bgImageUrl: publicUrl,
                      });
                    }}
                    onCleared={() =>
                      updateReel(reel.id, {
                        bgImageKey: null,
                        bgImageUrl: null,
                      })
                    }
                  />
                  <FileDropzone
                    kind="hover"
                    projectId={projectId}
                    reelId={reel.id}
                    currentKey={reel.hoverVideoKey}
                    currentUrl={reel.hoverVideoUrl}
                    label="Видео при наведении"
                    onUploaded={({ key, publicUrl }) =>
                      updateReel(reel.id, {
                        hoverVideoKey: key,
                        hoverVideoUrl: publicUrl,
                      })
                    }
                    onCleared={() =>
                      updateReel(reel.id, {
                        hoverVideoKey: null,
                        hoverVideoUrl: null,
                      })
                    }
                  />
                  <FileDropzone
                    kind="main"
                    projectId={projectId}
                    reelId={reel.id}
                    currentKey={reel.mainVideoKey}
                    currentUrl={reel.mainVideoUrl}
                    label="Основное видео"
                    onUploaded={({ key, publicUrl }) =>
                      updateReel(reel.id, {
                        mainVideoKey: key,
                        mainVideoUrl: publicUrl,
                      })
                    }
                    onCleared={() =>
                      updateReel(reel.id, {
                        mainVideoKey: null,
                        mainVideoUrl: null,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <TextField
                    label="Заголовок под рилсом"
                    value={reel.title}
                    onChange={(e) =>
                      updateReel(reel.id, { title: e.target.value })
                    }
                  />
                  <TextField
                    label="Подзаголовок (необязательно)"
                    value={reel.subtitle}
                    onChange={(e) =>
                      updateReel(reel.id, { subtitle: e.target.value })
                    }
                  />
                  <VisibilityEditor
                    reel={reel}
                    onModeChange={(m) => setVisibilityMode(reel, m)}
                    onStartChange={(iso) =>
                      updateReel(reel.id, { startAt: iso })
                    }
                    onEndChange={(iso) =>
                      updateReel(reel.id, { endAt: iso })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <IconButton
                      icon={reel.button?.enabled ? ToggleRight : ToggleLeft}
                      onClick={() => toggleButton(reel)}
                      size="sm"
                    >
                      {reel.button?.enabled
                        ? "Кнопка включена"
                        : "Кнопка выключена"}
                    </IconButton>
                  </div>
                  {reel.button?.enabled && (
                    <ButtonEditor
                      button={reel.button}
                      onChange={(patch) => updateButton(reel, patch)}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ExpandedHeader({ reel, index }: { reel: EditorReel; index: number }) {
  const meta = visibilityMeta(reel);
  return (
    <span className="text-icon text-sm sm:text-[15px]">
      Рилс #{index + 1}
      {meta && <> · {meta}</>}
    </span>
  );
}

function visibilityMeta(reel: EditorReel): string | null {
  const parts: string[] = [];
  if (
    (reel.visibilityMode === "start" || reel.visibilityMode === "range") &&
    reel.startAt
  ) {
    parts.push(`Старт: ${formatDateTimeRu(reel.startAt)}`);
  }
  if (
    (reel.visibilityMode === "end" || reel.visibilityMode === "range") &&
    reel.endAt
  ) {
    parts.push(`Завершение: ${formatDateTimeRu(reel.endAt)}`);
  }
  return parts.length ? parts.join(" · ") : null;
}

function VisibilityEditor({
  reel,
  onModeChange,
  onStartChange,
  onEndChange,
}: {
  reel: EditorReel;
  onModeChange: (m: VisibilityMode) => void;
  onStartChange: (iso: string | null) => void;
  onEndChange: (iso: string | null) => void;
}) {
  const minFuture = useMemo(() => new Date(Date.now() + 60 * 1000), []);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] text-icon">Показывать рилс</span>
      <div className="flex flex-wrap gap-1 bg-white rounded-md p-0.5 self-start">
        {(
          [
            { v: "always", l: "Без ограничений" },
            { v: "end", l: "С датой завершения" },
            { v: "start", l: "С датой начала" },
            { v: "range", l: "С датой начала и завершения" },
          ] as { v: VisibilityMode; l: string }[]
        ).map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onModeChange(o.v)}
            className={`h-7 px-2.5 rounded text-[12px] transition-colors ${
              reel.visibilityMode === o.v
                ? "bg-accent text-white"
                : "text-icon hover:text-iconHover"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>

      {(reel.visibilityMode === "start" || reel.visibilityMode === "range") && (
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[13px] text-icon w-32">Старт показа</span>
          <DateTimePicker
            value={reel.startAt}
            onChange={onStartChange}
            placeholder="Выбрать дату и время"
            width={260}
          />
        </div>
      )}
      {(reel.visibilityMode === "end" || reel.visibilityMode === "range") && (
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-icon w-32">
            Завершение показа
          </span>
          <DateTimePicker
            value={reel.endAt}
            onChange={onEndChange}
            placeholder="Выбрать дату и время"
            width={260}
            min={minFuture}
          />
        </div>
      )}
    </div>
  );
}

function CollapsedHeader({
  reel,
  index,
}: {
  reel: EditorReel;
  index: number;
}) {
  const meta = visibilityMeta(reel);
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div
        className="w-9 h-12 rounded-md bg-white overflow-hidden shrink-0 flex items-center justify-center text-icon"
        aria-hidden
      >
        {reel.bgImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reel.bgImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <Type size={14} strokeWidth={1.6} />
        )}
      </div>
      <div className="min-w-0">
        <div className="text-icon text-[11px] sm:text-[13px]">
          Рилс #{index + 1}
          {meta && <> · {meta}</>}
        </div>
        <div className="text-[14px] truncate">
          {reel.title.trim() ? (
            reel.title
          ) : reel.subtitle.trim() ? (
            reel.subtitle
          ) : (
            <span className="text-icon">Без заголовка</span>
          )}
        </div>
        {reel.title.trim().length > 0 && reel.subtitle.trim().length > 0 && (
          <div className="text-[12px] text-icon truncate mt-0.5">
            {reel.subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function ButtonEditor({
  button,
  onChange,
}: {
  button: ButtonSettings;
  onChange: (patch: Partial<ButtonSettings>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      <TextField
        label="Текст кнопки"
        value={button.text}
        onChange={(e) => onChange({ text: e.target.value })}
      />
      <TextField
        label="Ссылка кнопки"
        type="url"
        placeholder="https://..."
        value={button.url}
        onChange={(e) => onChange({ url: e.target.value })}
      />
      <TextField
        label="Размер текста (px)"
        type="number"
        min={8}
        max={40}
        value={button.fontSize}
        onChange={(e) =>
          onChange({
            fontSize: Math.max(8, Math.min(40, Number(e.target.value) || 14)),
          })
        }
      />
      <TextField
        label="Скругление (px)"
        type="number"
        min={0}
        max={40}
        value={button.radius}
        onChange={(e) =>
          onChange({
            radius: Math.max(0, Math.min(40, Number(e.target.value) || 0)),
          })
        }
      />
      <ColorRow
        label="Цвет текста"
        value={button.textColor}
        onChange={(v) => onChange({ textColor: v })}
      />
      <ColorRow
        label="Цвет фона"
        value={button.bgColor}
        onChange={(v) => onChange({ bgColor: v })}
      />
      <ColorRow
        label="Цвет фона (hover)"
        value={button.bgHoverColor}
        onChange={(v) => onChange({ bgHoverColor: v })}
      />
      <SegmentedRow
        label="Ширина"
        options={[
          { value: "auto", label: "Минимальная" },
          { value: "stretch", label: "Растянуть" },
        ]}
        value={button.widthMode ?? "auto"}
        onChange={(v) => onChange({ widthMode: v as ButtonWidthMode })}
      />
      <div className="flex items-end col-span-2">
        <span className="text-icon text-xs flex items-center gap-1">
          <Type size={14} strokeWidth={1.6} />
          Превью кнопки
        </span>
        <span
          className="ml-3"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 12px",
            fontSize: `${button.fontSize}px`,
            color: button.textColor,
            background: button.bgColor,
            borderRadius: `${button.radius}px`,
          }}
        >
          {button.text || "Кнопка"}
        </span>
      </div>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-icon">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 px-2 rounded-md bg-white text-[13px] w-24"
        />
      </span>
    </label>
  );
}

function SegmentedRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] text-icon">{label}</span>
      <div className="inline-flex items-center bg-white rounded-md self-start overflow-hidden">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`h-8 px-3 text-[12px] transition-colors ${
              value === o.value
                ? "text-iconHover"
                : "text-icon hover:text-iconHover"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
