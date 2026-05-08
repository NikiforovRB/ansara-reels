"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Eye, MousePointerClick } from "lucide-react";
import { DateTimePicker } from "@/components/ui/DateTimePicker";

type Preset = "today" | "7d" | "30d" | "all" | "custom";

interface ReelMetric {
  id: string;
  title: string;
  subtitle: string;
  order: number;
  views: number;
  clicks: number;
}

interface SeriesPoint {
  date: string;
  views: number;
  clicks: number;
}

interface AnalyticsResponse {
  reels: ReelMetric[];
  series: SeriesPoint[];
}

function formatRuDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  const wd = d.toLocaleDateString("ru-RU", { weekday: "short" });
  return `${date}, ${wd}`;
}

function isoStartOf(daysAgo: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
}

function isoEndOfToday(): string {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

export function AnalyticsView({ projectId }: { projectId: string }) {
  const [preset, setPreset] = useState<Preset>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const range = useMemo(() => {
    if (preset === "today") {
      return { from: isoStartOf(0), to: isoEndOfToday() };
    }
    if (preset === "7d") {
      return { from: isoStartOf(6), to: isoEndOfToday() };
    }
    if (preset === "30d") {
      return { from: isoStartOf(29), to: isoEndOfToday() };
    }
    if (preset === "all") {
      return { from: undefined, to: undefined };
    }
    const fromIso = customFrom
      ? (() => {
          const d = new Date(customFrom);
          d.setHours(0, 0, 0, 0);
          return d.toISOString();
        })()
      : undefined;
    const toIso = customTo
      ? (() => {
          const d = new Date(customTo);
          d.setHours(23, 59, 59, 999);
          return d.toISOString();
        })()
      : undefined;
    return { from: fromIso, to: toIso };
  }, [preset, customFrom, customTo]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    const res = await fetch(
      `/api/projects/${projectId}/analytics?${params.toString()}`,
    );
    if (res.ok) {
      setData((await res.json()) as AnalyticsResponse);
    }
    setLoading(false);
  }, [projectId, range.from, range.to]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalViews =
    data?.reels.reduce((sum, r) => sum + r.views, 0) ?? 0;
  const totalClicks =
    data?.reels.reduce((sum, r) => sum + r.clicks, 0) ?? 0;

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <PresetButton current={preset} value="today" onClick={setPreset}>
          Сегодня
        </PresetButton>
        <PresetButton current={preset} value="7d" onClick={setPreset}>
          7 дней
        </PresetButton>
        <PresetButton current={preset} value="30d" onClick={setPreset}>
          30 дней
        </PresetButton>
        <PresetButton current={preset} value="all" onClick={setPreset}>
          За всё время
        </PresetButton>
        <PresetButton current={preset} value="custom" onClick={setPreset}>
          Произвольно
        </PresetButton>
        {preset === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <DateTimePicker
              value={customFrom || null}
              onChange={(v) => setCustomFrom(v ?? "")}
              withTime={false}
              placeholder="Дата с"
              width={170}
            />
            <span className="text-icon text-sm">—</span>
            <DateTimePicker
              value={customTo || null}
              onChange={(v) => setCustomTo(v ?? "")}
              withTime={false}
              placeholder="Дата по"
              width={170}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-surface rounded-lg p-4">
          <div className="text-icon text-xs flex items-center gap-1">
            <Eye size={14} strokeWidth={1.6} />
            Уникальные просмотры
          </div>
          <div className="text-3xl font-medium mt-2">{totalViews}</div>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <div className="text-icon text-xs flex items-center gap-1">
            <MousePointerClick size={14} strokeWidth={1.6} />
            Уникальные клики по кнопке
          </div>
          <div className="text-3xl font-medium mt-2">{totalClicks}</div>
        </div>
      </div>

      <div className="bg-surface rounded-lg p-4 h-72">
        {data?.series && data.series.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ed" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#bdc1cc", fontSize: 11 }}
                tickFormatter={formatRuDate}
              />
              <YAxis allowDecimals={false} tick={{ fill: "#bdc1cc", fontSize: 11 }} />
              <Tooltip labelFormatter={formatRuDate as (v: string) => string} />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#0f68e4"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#bdc1cc"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-icon text-sm">
            {loading ? "Загрузка..." : "Нет данных за выбранный период"}
          </div>
        )}
      </div>

      <div className="bg-surface rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px] px-4 py-3 text-xs text-icon">
          <span>Рилс</span>
          <span className="text-right">Просмотры</span>
          <span className="text-right">Клики</span>
        </div>
        {data?.reels.length === 0 && (
          <div className="px-4 py-6 text-center text-icon text-sm">
            В проекте пока нет рилсов.
          </div>
        )}
        {data?.reels.map((reel, idx) => (
          <div
            key={reel.id}
            className="grid grid-cols-[1fr_120px_120px] px-4 py-3 border-t border-white/0 hover:bg-[#eceef2] transition-colors"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm">
                {reel.title || `Рилс #${idx + 1}`}
              </span>
              {reel.subtitle?.trim() && (
                <span className="block truncate text-xs text-icon mt-0.5">
                  {reel.subtitle}
                </span>
              )}
            </span>
            <span className="text-right text-sm">{reel.views}</span>
            <span className="text-right text-sm">{reel.clicks}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PresetButton({
  current,
  value,
  children,
  onClick,
}: {
  current: Preset;
  value: Preset;
  children: React.ReactNode;
  onClick: (v: Preset) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`h-8 px-3 text-sm transition-colors ${
        active ? "text-iconHover" : "text-icon hover:text-iconHover"
      }`}
    >
      {children}
    </button>
  );
}
