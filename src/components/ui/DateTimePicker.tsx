"use client";

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X as XIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "./Modal";
import { IconButton } from "./IconButton";
import { formatDateTimeRu, formatDateRu } from "@/lib/i18n";

const RU_MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
const RU_WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

interface DateTimePickerProps {
  /** ISO string (with timezone offset) or null. */
  value: string | null;
  onChange: (iso: string | null) => void;
  /** When true, also lets user pick hours/minutes. Default true. */
  withTime?: boolean;
  /** Earliest selectable instant (inclusive). */
  min?: Date;
  /** Latest selectable instant (inclusive). */
  max?: Date;
  /** Placeholder shown when value is null. */
  placeholder?: string;
  /** Optional clear button on the trigger (default true when value set). */
  clearable?: boolean;
  /** Trigger label/button width. */
  width?: number | string;
  disabled?: boolean;
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1, 0, 0, 0, 0);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function clamp(d: Date, min?: Date, max?: Date): Date {
  if (min && d.getTime() < min.getTime()) return new Date(min);
  if (max && d.getTime() > max.getTime()) return new Date(max);
  return d;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function DateTimePicker({
  value,
  onChange,
  withTime = true,
  min,
  max,
  placeholder = "Выбрать дату",
  clearable = true,
  width,
  disabled,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const valueDate = value ? new Date(value) : null;

  const display = valueDate
    ? withTime
      ? formatDateTimeRu(valueDate)
      : formatDateRu(valueDate)
    : placeholder;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`h-8 px-2.5 inline-flex items-center gap-2 bg-white rounded-md text-[13px] text-left transition-colors hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed ${valueDate ? "text-[#0f1115]" : "text-icon"}`}
        style={{ width: typeof width === "number" ? `${width}px` : width }}
      >
        <CalendarIcon size={14} strokeWidth={1.6} className="text-icon shrink-0" />
        <span className="truncate flex-1">{display}</span>
        {clearable && valueDate && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Очистить"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="text-icon hover:text-iconHover transition-colors shrink-0 inline-flex items-center"
          >
            <XIcon size={14} strokeWidth={1.6} />
          </span>
        )}
      </button>
      {open && (
        <PickerModal
          open={open}
          initial={valueDate}
          withTime={withTime}
          min={min}
          max={max}
          onClose={() => setOpen(false)}
          onSubmit={(d) => {
            onChange(d.toISOString());
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

interface PickerModalProps {
  open: boolean;
  initial: Date | null;
  withTime: boolean;
  min?: Date;
  max?: Date;
  onClose: () => void;
  onSubmit: (d: Date) => void;
}

function PickerModal({
  open,
  initial,
  withTime,
  min,
  max,
  onClose,
  onSubmit,
}: PickerModalProps) {
  const start = initial
    ? new Date(initial)
    : clamp(new Date(), min, max);
  // round up by 5 min if no initial
  if (!initial && withTime) {
    start.setSeconds(0, 0);
    const m = start.getMinutes();
    const next = (Math.floor(m / 5) + 1) * 5;
    start.setMinutes(next);
  }

  const [view, setView] = useState({
    year: start.getFullYear(),
    month: start.getMonth(),
  });
  const [picked, setPicked] = useState<Date>(start);

  useEffect(() => {
    setView({ year: picked.getFullYear(), month: picked.getMonth() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cells = useMemo(() => {
    const first = startOfMonth(view.year, view.month);
    // Mon=0..Sun=6
    const offset = (first.getDay() + 6) % 7;
    const dim = daysInMonth(view.year, view.month);
    const result: Array<{ date: Date; thisMonth: boolean }> = [];
    // leading days from previous month
    const prevDim = daysInMonth(
      view.month === 0 ? view.year - 1 : view.year,
      view.month === 0 ? 11 : view.month - 1,
    );
    for (let i = 0; i < offset; i++) {
      const d = prevDim - offset + 1 + i;
      const date = new Date(
        view.month === 0 ? view.year - 1 : view.year,
        view.month === 0 ? 11 : view.month - 1,
        d,
      );
      result.push({ date, thisMonth: false });
    }
    for (let d = 1; d <= dim; d++) {
      result.push({ date: new Date(view.year, view.month, d), thisMonth: true });
    }
    // trailing days to fill 6 rows of 7
    while (result.length < 42) {
      const last = result[result.length - 1].date;
      const next = new Date(last);
      next.setDate(last.getDate() + 1);
      result.push({ date: next, thisMonth: next.getMonth() === view.month });
    }
    return result;
  }, [view]);

  const today = new Date();

  const isDayDisabled = (d: Date): boolean => {
    if (min) {
      const minDay = new Date(min);
      minDay.setHours(0, 0, 0, 0);
      if (d.getTime() < minDay.getTime()) return true;
    }
    if (max) {
      const maxDay = new Date(max);
      maxDay.setHours(23, 59, 59, 999);
      if (d.getTime() > maxDay.getTime()) return true;
    }
    return false;
  };

  const setHour = (h: number) => {
    const next = new Date(picked);
    next.setHours(h);
    setPicked(clamp(next, min, max));
  };
  const setMinute = (m: number) => {
    const next = new Date(picked);
    next.setMinutes(m);
    setPicked(clamp(next, min, max));
  };

  const goPrev = () => {
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 },
    );
  };
  const goNext = () => {
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 },
    );
  };

  const submit = () => {
    let final = picked;
    if (!withTime) {
      final = new Date(picked);
      final.setHours(0, 0, 0, 0);
    }
    if (min && final.getTime() < min.getTime()) final = new Date(min);
    if (max && final.getTime() > max.getTime()) final = new Date(max);
    onSubmit(final);
  };

  const submitDisabled =
    (min && picked.getTime() < min.getTime()) ||
    (max && picked.getTime() > max.getTime());

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={withTime ? "Дата и время" : "Дата"}
      width={withTime ? 520 : 360}
      footer={
        <>
          <IconButton onClick={onClose} size="sm" variant="ghost">
            Отмена
          </IconButton>
          <IconButton
            onClick={submit}
            size="sm"
            variant="accent"
            disabled={!!submitDisabled}
          >
            Готово
          </IconButton>
        </>
      }
    >
      <div className={`flex gap-4 ${withTime ? "" : "flex-col"}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={goPrev}
              className="h-7 w-7 inline-flex items-center justify-center text-icon hover:text-iconHover transition-colors"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft size={16} strokeWidth={1.6} />
            </button>
            <div className="text-[13px] font-medium">
              {RU_MONTHS[view.month]} {view.year}
            </div>
            <button
              type="button"
              onClick={goNext}
              className="h-7 w-7 inline-flex items-center justify-center text-icon hover:text-iconHover transition-colors"
              aria-label="Следующий месяц"
            >
              <ChevronRight size={16} strokeWidth={1.6} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {RU_WEEKDAYS.map((w) => (
              <div key={w} className="text-[11px] text-icon py-1">
                {w}
              </div>
            ))}
            {cells.map((cell, i) => {
              const isSelected = sameDay(cell.date, picked);
              const isToday = sameDay(cell.date, today);
              const dis = isDayDisabled(cell.date);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={dis}
                  onClick={() => {
                    const next = new Date(picked);
                    next.setFullYear(
                      cell.date.getFullYear(),
                      cell.date.getMonth(),
                      cell.date.getDate(),
                    );
                    setPicked(clamp(next, min, max));
                  }}
                  className={`h-8 mx-auto w-8 rounded-md text-[13px] transition-colors ${
                    isSelected
                      ? "bg-accent text-white"
                      : cell.thisMonth
                        ? "text-[#0f1115] hover:bg-surface"
                        : "text-icon/50 hover:bg-surface"
                  } ${dis ? "opacity-30 cursor-not-allowed hover:bg-transparent" : ""} ${
                    isToday && !isSelected ? "ring-1 ring-icon" : ""
                  }`}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {withTime && (
          <div className="flex gap-2">
            <TimeColumn
              label="Часы"
              values={Array.from({ length: 24 }, (_, i) => i)}
              selected={picked.getHours()}
              onSelect={setHour}
            />
            <TimeColumn
              label="Минуты"
              values={Array.from({ length: 12 }, (_, i) => i * 5)}
              selected={Math.round(picked.getMinutes() / 5) * 5}
              onSelect={setMinute}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

function TimeColumn({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const item = el.querySelector<HTMLButtonElement>(
      `button[data-v="${selected}"]`,
    );
    if (item) {
      el.scrollTop = item.offsetTop - el.clientHeight / 2 + item.clientHeight / 2;
    }
  }, [selected]);
  return (
    <div className="flex flex-col w-14">
      <div className="text-[11px] text-icon text-center mb-2">{label}</div>
      <div
        ref={ref}
        className="bg-surface rounded-md h-56 overflow-y-auto py-1 no-scrollbar"
      >
        {values.map((v) => (
          <button
            key={v}
            type="button"
            data-v={v}
            onClick={() => onSelect(v)}
            className={`h-8 w-full text-[13px] transition-colors ${
              v === selected
                ? "bg-accent text-white rounded-md mx-auto"
                : "text-[#0f1115] hover:bg-white"
            }`}
            style={v === selected ? { width: "calc(100% - 8px)", marginLeft: 4 } : {}}
          >
            {pad2(v)}
          </button>
        ))}
      </div>
    </div>
  );
}
