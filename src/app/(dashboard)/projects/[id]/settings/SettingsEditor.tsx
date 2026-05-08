"use client";

import { useMemo, useState } from "react";
import { Copy, Check, RotateCcw } from "lucide-react";
import {
  type ProjectSettings,
  type GlowEffect,
  type GlowDirection,
  type GridAlign,
  type HoverPreview,
  type TitlePosition,
  type TitleAlign,
  type LayoutMode,
  FONT_OPTIONS,
} from "@/lib/settings";
import { GLOW_OPTIONS } from "@/lib/glow";
import { ReelGrid } from "@/components/reels/ReelGrid";
import type { PublicReel } from "@/components/reels/ReelCard";
import { IconButton } from "@/components/ui/IconButton";
import { DeviceSwitcher, type Device } from "@/components/ui/DeviceSwitcher";
import { DeviceFrame } from "@/components/ui/DeviceFrame";
import { SaveBar } from "@/components/ui/SaveBar";
import { NumberStepper } from "@/components/ui/NumberStepper";

interface Props {
  projectId: string;
  slug: string;
  initialSettings: ProjectSettings;
  reels: PublicReel[];
}

export function SettingsEditor({ projectId, slug, initialSettings, reels }: Props) {
  const [settings, setSettings] = useState<ProjectSettings>(initialSettings);
  const [savedSettings, setSavedSettings] = useState<ProjectSettings>(initialSettings);
  const [copied, setCopied] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const [resetKey, setResetKey] = useState(0);

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings],
  );

  async function save() {
    const snapshot = settings;
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: snapshot }),
    });
    if (!res.ok) throw new Error("save_failed");
    setSavedSettings(snapshot);
  }

  function handleResetViews() {
    try {
      window.localStorage.removeItem(`ar-seen:${slug}`);
    } catch {
      // ignore
    }
    setResetKey((k) => k + 1);
  }

  const embedSnippet = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://YOUR_HOST";
    const id = `ar-embed-${slug}`;
    return `<iframe id="${id}" data-ansara-reels src="${origin}/embed/${slug}" style="width:100%;border:0;display:block;height:0" loading="lazy" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
<script>(function(){var f=document.getElementById('${id}');if(!f)return;var saved=null,htmlOverflow=null;function fullscreen(){if(saved!==null)return;saved=f.getAttribute('style')||'';htmlOverflow=document.documentElement.style.overflow;f.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;border:0;margin:0;padding:0;z-index:2147483647;background:transparent';document.documentElement.style.overflow='hidden';}function restore(){if(saved===null)return;f.setAttribute('style',saved);saved=null;document.documentElement.style.overflow=htmlOverflow||'';}window.addEventListener('message',function(e){if(!f||e.source!==f.contentWindow)return;var d=e.data||{};if(d.type==='ar:height'&&saved===null)f.style.height=d.height+'px';if(d.type==='ar:open')fullscreen();if(d.type==='ar:close')restore();});document.addEventListener('click',function(e){var t=e.target;if(!t||!t.closest)return;var b=t.closest('.reels-left, .reels-right');if(!b)return;e.preventDefault();var dir=b.classList.contains('reels-left')?'left':'right';var iframes=document.querySelectorAll('iframe[data-ansara-reels]');for(var i=0;i<iframes.length;i++){try{iframes[i].contentWindow.postMessage({type:'ar:nav',direction:dir},'*');}catch(err){}}});})();</script>`;
  }, [slug]);

  function update(patch: (prev: ProjectSettings) => ProjectSettings) {
    setSettings(patch);
  }

  const borderIsRect = settings.reel.borderRadius !== "full";
  const glowOptions = borderIsRect
    ? GLOW_OPTIONS.filter((o) => o.value !== "rotate" && o.value !== "spin")
    : GLOW_OPTIONS;

  return (
    <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
      <div className="flex flex-col gap-6">
        <Section title="Цвет фона секции, размер Grid">
          <ColorRow
            label="Цвет фона секции"
            value={settings.section.bgColor}
            onChange={(v) =>
              update((p) => ({ ...p, section: { ...p.section, bgColor: v } }))
            }
          />
          <NumberRow
            label="Ширина grid-контейнера (px)"
            value={settings.section.gridMaxWidth}
            min={320}
            max={2400}
            onChange={(v) =>
              update((p) => ({ ...p, section: { ...p.section, gridMaxWidth: v } }))
            }
          />
          <NumberRow
            label="Отступы слева/справа на ПК (px)"
            value={settings.section.paddingX}
            min={0}
            max={200}
            onChange={(v) =>
              update((p) => ({ ...p, section: { ...p.section, paddingX: v } }))
            }
          />
          <NumberRow
            label="Отступ слева на мобильном (px)"
            value={settings.section.mobileLeftOffset}
            min={0}
            max={200}
            onChange={(v) =>
              update((p) => ({
                ...p,
                section: { ...p.section, mobileLeftOffset: v },
              }))
            }
          />
        </Section>

        <Section title="Размеры рилса">
          <SegmentedRow
            label="Скругление медиа (фото / видео)"
            options={[
              { value: "num", label: "Прямоугольник" },
              { value: "full", label: "Круг" },
            ]}
            value={settings.reel.mediaRadius === "full" ? "full" : "num"}
            onChange={(v) =>
              update((p) => ({
                ...p,
                reel: {
                  ...p.reel,
                  mediaRadius: v === "num" ? 16 : "full",
                },
              }))
            }
          />
          {settings.reel.mediaRadius !== "full" && (
            <NumberRow
              label="Радиус медиа (px)"
              value={settings.reel.mediaRadius as number}
              min={0}
              max={40}
              onChange={(v) =>
                update((p) => ({ ...p, reel: { ...p.reel, mediaRadius: v } }))
              }
            />
          )}
          <SegmentedRow
            label="Скругление обводки"
            options={[
              { value: "num", label: "Прямоугольник" },
              { value: "full", label: "Круг" },
            ]}
            value={settings.reel.borderRadius === "full" ? "full" : "num"}
            onChange={(v) =>
              update((p) => {
                const switchToRect = v === "num";
                const glow =
                  switchToRect &&
                  (p.border.glow === "rotate" || p.border.glow === "spin")
                    ? "pulse"
                    : p.border.glow;
                return {
                  ...p,
                  reel: {
                    ...p.reel,
                    borderRadius: switchToRect ? 16 : "full",
                  },
                  border: { ...p.border, glow },
                };
              })
            }
          />
          {settings.reel.borderRadius !== "full" && (
            <NumberRow
              label="Радиус обводки (px)"
              value={settings.reel.borderRadius as number}
              min={0}
              max={40}
              onChange={(v) =>
                update((p) => ({ ...p, reel: { ...p.reel, borderRadius: v } }))
              }
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <NumberRow
              label="Ширина (desktop)"
              value={settings.reel.desktop.width}
              min={40}
              max={400}
              onChange={(v) =>
                update((p) => ({
                  ...p,
                  reel: { ...p.reel, desktop: { ...p.reel.desktop, width: v } },
                }))
              }
            />
            {settings.reel.mediaRadius !== "full" && (
              <NumberRow
                label="Высота (desktop)"
                value={settings.reel.desktop.height}
                min={40}
                max={400}
                onChange={(v) =>
                  update((p) => ({
                    ...p,
                    reel: { ...p.reel, desktop: { ...p.reel.desktop, height: v } },
                  }))
                }
              />
            )}
            <NumberRow
              label="Ширина (mobile)"
              value={settings.reel.mobile.width}
              min={40}
              max={400}
              onChange={(v) =>
                update((p) => ({
                  ...p,
                  reel: { ...p.reel, mobile: { ...p.reel.mobile, width: v } },
                }))
              }
            />
            {settings.reel.mediaRadius !== "full" && (
              <NumberRow
                label="Высота (mobile)"
                value={settings.reel.mobile.height}
                min={40}
                max={400}
                onChange={(v) =>
                  update((p) => ({
                    ...p,
                    reel: { ...p.reel, mobile: { ...p.reel.mobile, height: v } },
                  }))
                }
              />
            )}
          </div>
        </Section>

        <Section title="Обводка и свечение">
          <NumberRow
            label="Отступ до обводки (px)"
            value={settings.border.gap}
            min={0}
            max={50}
            onChange={(v) =>
              update((p) => ({ ...p, border: { ...p.border, gap: v } }))
            }
          />
          <NumberRow
            label="Толщина обводки (px)"
            value={settings.border.width}
            min={1}
            max={10}
            onChange={(v) =>
              update((p) => ({ ...p, border: { ...p.border, width: v } }))
            }
          />
          <ColorRow
            label="Цвет обводки (непросмотрено)"
            value={settings.border.unreadColor}
            onChange={(v) =>
              update((p) => ({ ...p, border: { ...p.border, unreadColor: v } }))
            }
          />
          <ColorRow
            label="Цвет обводки (просмотрено)"
            value={settings.border.readColor}
            onChange={(v) =>
              update((p) => ({ ...p, border: { ...p.border, readColor: v } }))
            }
          />
          <SelectRow
            label="Эффект свечения"
            options={glowOptions.map((o) => ({ value: o.value, label: o.label }))}
            value={settings.border.glow}
            onChange={(v) =>
              update((p) => ({
                ...p,
                border: { ...p.border, glow: v as GlowEffect },
              }))
            }
          />
          {settings.border.glow !== "none" &&
            settings.border.glow !== "pulse" &&
            settings.border.glow !== "breathe" && (
              <>
                <ColorRow
                  label="Второй цвет градиента"
                  value={settings.border.glowSecondColor}
                  onChange={(v) =>
                    update((p) => ({
                      ...p,
                      border: { ...p.border, glowSecondColor: v },
                    }))
                  }
                />
                <SegmentedRow
                  label="Направление"
                  options={[
                    { value: "cw", label: "По часовой" },
                    { value: "ccw", label: "Против часовой" },
                  ]}
                  value={settings.border.glowDirection}
                  onChange={(v) =>
                    update((p) => ({
                      ...p,
                      border: { ...p.border, glowDirection: v as GlowDirection },
                    }))
                  }
                />
                <NumberRow
                  label="Скорость (сек на оборот)"
                  value={settings.border.glowDurationSec}
                  min={1}
                  max={60}
                  onChange={(v) =>
                    update((p) => ({
                      ...p,
                      border: { ...p.border, glowDurationSec: v },
                    }))
                  }
                />
              </>
            )}
        </Section>

        <Section title="Просмотр рилса (модалка)">
          <NumberRow
            label="Затемнение фона (%)"
            value={settings.modal.backdropOpacity}
            min={0}
            max={100}
            onChange={(v) =>
              update((p) => ({
                ...p,
                modal: { ...p.modal, backdropOpacity: v },
              }))
            }
          />
        </Section>

        <Section title="Заголовок под рилсом">
          <NumberRow
            label="Размер текста (desktop, px)"
            value={settings.title.sizeDesktop}
            min={8}
            max={48}
            onChange={(v) =>
              update((p) => ({ ...p, title: { ...p.title, sizeDesktop: v } }))
            }
          />
          <NumberRow
            label="Размер текста (mobile, px)"
            value={settings.title.sizeMobile}
            min={8}
            max={48}
            onChange={(v) =>
              update((p) => ({ ...p, title: { ...p.title, sizeMobile: v } }))
            }
          />
          <SelectRow
            label="Шрифт"
            options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
            value={settings.title.fontFamily}
            onChange={(v) =>
              update((p) => ({ ...p, title: { ...p.title, fontFamily: v } }))
            }
          />
          <ColorRow
            label="Цвет текста"
            value={settings.title.color}
            onChange={(v) =>
              update((p) => ({ ...p, title: { ...p.title, color: v } }))
            }
          />
          <SegmentedRow
            label="Выравнивание"
            options={[
              { value: "left", label: "По левому" },
              { value: "center", label: "По центру" },
            ]}
            value={settings.title.align}
            onChange={(v) =>
              update((p) => ({
                ...p,
                title: { ...p.title, align: v as TitleAlign },
              }))
            }
          />
        </Section>

        <Section title="Подзаголовок под рилсом">
          <p className="text-[11px] text-icon leading-relaxed -mt-1 mb-1">
            Текст подзаголовка задаётся у каждого рилса в редакторе контента.
            Шрифт и выравнивание совпадают с заголовком.
          </p>
          <NumberRow
            label="Размер текста (desktop, px)"
            value={settings.subtitle.sizeDesktop}
            min={8}
            max={40}
            onChange={(v) =>
              update((p) => ({
                ...p,
                subtitle: { ...p.subtitle, sizeDesktop: v },
              }))
            }
          />
          <NumberRow
            label="Размер текста (mobile, px)"
            value={settings.subtitle.sizeMobile}
            min={8}
            max={40}
            onChange={(v) =>
              update((p) => ({
                ...p,
                subtitle: { ...p.subtitle, sizeMobile: v },
              }))
            }
          />
          <ColorRow
            label="Цвет текста подзаголовка"
            value={settings.subtitle.color}
            onChange={(v) =>
              update((p) => ({
                ...p,
                subtitle: { ...p.subtitle, color: v },
              }))
            }
          />
        </Section>

        <Section title="Расположение текста">
          <SegmentedRow
            label="Положение текста"
            options={[
              { value: "bottom", label: "Внизу" },
              { value: "right", label: "Справа" },
            ]}
            value={settings.title.position}
            onChange={(v) =>
              update((p) => ({
                ...p,
                title: { ...p.title, position: v as TitlePosition },
              }))
            }
          />
          <NumberRow
            label="Расстояние от рилса до текста (desktop, px)"
            value={settings.title.spacingFromReelDesktop}
            min={0}
            max={80}
            onChange={(v) =>
              update((p) => ({
                ...p,
                title: { ...p.title, spacingFromReelDesktop: v },
              }))
            }
          />
          <NumberRow
            label="Расстояние от рилса до текста (mobile, px)"
            value={settings.title.spacingFromReelMobile}
            min={0}
            max={80}
            onChange={(v) =>
              update((p) => ({
                ...p,
                title: { ...p.title, spacingFromReelMobile: v },
              }))
            }
          />
          {settings.title.position === "right" && (
            <NumberRow
              label="Ширина текста справа (px)"
              value={settings.title.rightWidth}
              min={60}
              max={500}
              onChange={(v) =>
                update((p) => ({ ...p, title: { ...p.title, rightWidth: v } }))
              }
            />
          )}
        </Section>

        <Section title="Расположение рилсов">
          <SegmentedRow
            label="Layout"
            options={[
              { value: "single-row", label: "В одну строку" },
              { value: "wrap", label: "Перенос строк" },
            ]}
            value={settings.layout}
            onChange={(v) =>
              update((p) => ({ ...p, layout: v as LayoutMode }))
            }
          />
          <SegmentedRow
            label="Выравнивание всех сторис"
            options={[
              { value: "left", label: "По левому краю" },
              { value: "center", label: "По центру" },
            ]}
            value={settings.align}
            onChange={(v) =>
              update((p) => ({ ...p, align: v as GridAlign }))
            }
          />
        </Section>

        <Section title="Расстояние между рилсами">
          <NumberRow
            label="Desktop (px)"
            value={settings.gap.desktop}
            min={0}
            max={120}
            onChange={(v) =>
              update((p) => ({ ...p, gap: { ...p.gap, desktop: v } }))
            }
          />
          <NumberRow
            label="Mobile (px)"
            value={settings.gap.mobile}
            min={0}
            max={120}
            onChange={(v) =>
              update((p) => ({ ...p, gap: { ...p.gap, mobile: v } }))
            }
          />
        </Section>

        <Section title="Превью на карточке">
          <SegmentedRow
            label="Что показывать"
            options={[
              { value: "image", label: "Изображение" },
              { value: "video", label: "Видео при наведении" },
            ]}
            value={settings.hoverPreview}
            onChange={(v) =>
              update((p) => ({ ...p, hoverPreview: v as HoverPreview }))
            }
          />
          <p className="text-[12px] text-icon">
            «Изображение» — фон-картинка, видео при наведении мышкой. «Видео при наведении» — все рилсы сразу проигрывают hover-видео без звука.
          </p>
        </Section>

        <Section title="Кнопка по умолчанию">
          <p className="text-xs text-icon">
            Эти параметры используются как дефолт для новых кнопок в редакторе контента.
          </p>
          <NumberRow
            label="Размер текста (px)"
            value={settings.defaultButton.fontSize}
            min={8}
            max={40}
            onChange={(v) =>
              update((p) => ({
                ...p,
                defaultButton: { ...p.defaultButton, fontSize: v },
              }))
            }
          />
          <NumberRow
            label="Скругление (px)"
            value={settings.defaultButton.radius}
            min={0}
            max={40}
            onChange={(v) =>
              update((p) => ({
                ...p,
                defaultButton: { ...p.defaultButton, radius: v },
              }))
            }
          />
          <ColorRow
            label="Цвет текста"
            value={settings.defaultButton.textColor}
            onChange={(v) =>
              update((p) => ({
                ...p,
                defaultButton: { ...p.defaultButton, textColor: v },
              }))
            }
          />
          <ColorRow
            label="Цвет фона"
            value={settings.defaultButton.bgColor}
            onChange={(v) =>
              update((p) => ({
                ...p,
                defaultButton: { ...p.defaultButton, bgColor: v },
              }))
            }
          />
          <ColorRow
            label="Цвет фона (hover)"
            value={settings.defaultButton.bgHoverColor}
            onChange={(v) =>
              update((p) => ({
                ...p,
                defaultButton: { ...p.defaultButton, bgHoverColor: v },
              }))
            }
          />
        </Section>

        <Section title="Iframe-сниппет">
          <pre className="bg-surface rounded-md p-3 text-xs overflow-auto whitespace-pre-wrap break-all">
            {embedSnippet}
          </pre>
          <IconButton
            icon={copied ? Check : Copy}
            onClick={async () => {
              await navigator.clipboard.writeText(embedSnippet);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            size="sm"
          >
            {copied ? "Скопировано" : "Скопировать"}
          </IconButton>
          <p className="text-xs text-icon mt-3 leading-relaxed">
            Любым кнопкам/элементам на странице с классом{" "}
            <code className="bg-surface px-1 rounded">reels-left</code> или{" "}
            <code className="bg-surface px-1 rounded">reels-right</code> при
            клике будут листать рилсы (на одну позицию).
          </p>
        </Section>
      </div>

      <div className="sticky top-4 self-start">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-icon text-xs">Превью</div>
          <div className="flex items-center gap-2">
            <DeviceSwitcher value={device} onChange={setDevice} />
            <IconButton icon={RotateCcw} size="sm" onClick={handleResetViews}>
              Сбросить просмотры
            </IconButton>
          </div>
        </div>
        <div className="rounded-lg overflow-hidden">
          {reels.length === 0 ? (
            <div className="bg-surface text-icon text-center py-16 rounded-lg">
              Сначала добавьте рилсы во вкладке «Редактор контента».
            </div>
          ) : (
            <DeviceFrame device={device}>
              <ReelGrid
                key={resetKey}
                slug={slug}
                settings={settings}
                reels={reels}
                forceMobile={device === "mobile"}
              />
            </DeviceFrame>
          )}
        </div>
      </div>

      <SaveBar dirty={dirty} onSave={save} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-lg p-4 flex flex-col gap-3">
      <div className="text-[13px] font-medium text-[#0f1115]">{title}</div>
      {children}
    </div>
  );
}

function NumberRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-icon">{label}</span>
      <NumberStepper value={value} min={min} max={max} onChange={onChange} />
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
    <label className="flex items-center justify-between gap-3">
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

function SelectRow({
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
    <label className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-icon">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 px-2 rounded-md bg-white text-[13px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-icon">{label}</span>
      <div className="flex items-center bg-white rounded-md overflow-hidden">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-3 h-8 text-[12px] transition-colors ${
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
