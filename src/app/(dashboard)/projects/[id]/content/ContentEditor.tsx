"use client";

import { useCallback, useMemo, useState } from "react";
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
import type { ButtonSettings, ButtonWidthMode } from "@/lib/settings";

export interface EditorReel {
  id: string;
  order: number;
  title: string;
  bgImageKey: string | null;
  hoverVideoKey: string | null;
  mainVideoKey: string | null;
  bgImageUrl: string | null;
  hoverVideoUrl: string | null;
  mainVideoUrl: string | null;
  button: ButtonSettings | null;
}

interface Props {
  projectId: string;
  initialReels: EditorReel[];
  defaultButton: ButtonSettings;
}

function reelEditableSnapshot(reel: EditorReel) {
  return {
    title: reel.title,
    bgImageKey: reel.bgImageKey,
    hoverVideoKey: reel.hoverVideoKey,
    mainVideoKey: reel.mainVideoKey,
    button: reel.button,
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
            bgImageKey: r.bgImageKey,
            hoverVideoKey: r.hoverVideoKey,
            mainVideoKey: r.mainVideoKey,
            button: r.button,
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
      bgImageUrl: null,
      hoverVideoUrl: null,
      mainVideoUrl: null,
      button: null,
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
      <div className="flex flex-col gap-3">
        {reels.map((reel, index) => {
          const isCollapsed = collapsed[reel.id] ?? true;
          return (
            <div
              key={reel.id}
              className="bg-surface rounded-lg p-4 flex flex-col gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {isCollapsed ? (
                  <CollapsedHeader reel={reel} index={index} />
                ) : (
                  <span className="text-icon text-sm">Рилс #{index + 1}</span>
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
                    disabled={index === 0}
                  />
                  <IconButton
                    icon={ChevronDown}
                    size="sm"
                    onClick={() => moveReel(reel.id, 1)}
                    disabled={index === reels.length - 1}
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
                        updateReel(reel.id, { bgImageKey: null, bgImageUrl: null })
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

      <SaveBar dirty={dirty} onSave={saveAll} />
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
        <div className="text-icon text-[11px]">Рилс #{index + 1}</div>
        <div className="text-[14px] truncate">
          {reel.title.trim() || (
            <span className="text-icon">Без заголовка</span>
          )}
        </div>
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
