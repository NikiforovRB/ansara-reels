"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Trash2, ImageIcon, Film } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { IconButton } from "@/components/ui/IconButton";

export type FileKind = "bg" | "hover" | "main";

interface FileDropzoneProps {
  kind: FileKind;
  projectId: string;
  reelId: string;
  currentKey?: string | null;
  currentUrl?: string | null;
  label: string;
  onUploaded: (data: { key: string; publicUrl: string }) => void;
  onCleared: () => void;
}

const ACCEPT: Record<FileKind, string> = {
  bg: "image/jpeg,image/png,image/webp",
  hover: "video/mp4,video/webm",
  main: "video/mp4,video/webm",
};

const MAX_LABEL: Record<FileKind, string> = {
  bg: "JPG/PNG/WEBP до 5 МБ",
  hover: "MP4/WEBM до 10 МБ",
  main: "MP4/WEBM до 100 МБ",
};

interface MediaInfo {
  width: number;
  height: number;
  sizeBytes: number | null;
  durationSec?: number;
}

function formatBytes(n: number | null): string {
  if (n === null || n === undefined) return "";
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
  return `${(n / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatDuration(sec?: number): string {
  if (!sec || !isFinite(sec)) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function describeMeta(kind: FileKind, meta: MediaInfo | null): string {
  if (!meta) return "";
  const parts: string[] = [`${meta.width}×${meta.height}`];
  if (kind !== "bg" && meta.durationSec) {
    parts.push(formatDuration(meta.durationSec));
  }
  if (meta.sizeBytes !== null) {
    parts.push(formatBytes(meta.sizeBytes));
  }
  return parts.join(" · ");
}

async function probeImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("img_load_failed"));
    img.src = src;
  });
}

async function probeVideo(
  src: string,
): Promise<{ width: number; height: number; durationSec: number }> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () => {
      resolve({
        width: v.videoWidth,
        height: v.videoHeight,
        durationSec: v.duration,
      });
    };
    v.onerror = () => reject(new Error("video_load_failed"));
    v.src = src;
  });
}

async function fetchSize(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    const len = res.headers.get("content-length");
    return len ? Number(len) : null;
  } catch {
    return null;
  }
}

export function FileDropzone({
  kind,
  projectId,
  reelId,
  currentKey,
  currentUrl,
  label,
  onUploaded,
  onCleared,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<MediaInfo | null>(null);

  // Probe metadata when currentUrl changes (e.g. on initial mount).
  useEffect(() => {
    let cancelled = false;
    setMeta(null);
    if (!currentUrl) return;
    (async () => {
      try {
        const sizePromise = fetchSize(currentUrl);
        if (kind === "bg") {
          const dim = await probeImage(currentUrl);
          if (cancelled) return;
          const sizeBytes = await sizePromise;
          if (cancelled) return;
          setMeta({ ...dim, sizeBytes });
        } else {
          const v = await probeVideo(currentUrl);
          if (cancelled) return;
          const sizeBytes = await sizePromise;
          if (cancelled) return;
          setMeta({
            width: v.width,
            height: v.height,
            durationSec: v.durationSec,
            sizeBytes,
          });
        }
      } catch {
        // ignore probe failures
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUrl, kind]);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setProgress(0);
      // Probe local file first (gives instant feedback even before upload)
      try {
        const localUrl = URL.createObjectURL(file);
        if (kind === "bg") {
          const dim = await probeImage(localUrl);
          setMeta({ ...dim, sizeBytes: file.size });
        } else {
          const v = await probeVideo(localUrl);
          setMeta({
            width: v.width,
            height: v.height,
            durationSec: v.durationSec,
            sizeBytes: file.size,
          });
        }
        URL.revokeObjectURL(localUrl);
      } catch {
        // Fall back to size-only if probing fails
        setMeta({ width: 0, height: 0, sizeBytes: file.size });
      }

      try {
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            reelId,
            kind,
            contentType: file.type,
            size: file.size,
          }),
        });
        if (!presignRes.ok) {
          const body = await presignRes.json().catch(() => ({}));
          throw new Error(body?.error || "presign_failed");
        }
        const { uploadUrl, key, publicUrl } = (await presignRes.json()) as {
          uploadUrl: string;
          key: string;
          publicUrl: string;
        };

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`s3_status_${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("s3_network_error"));
          xhr.send(file);
        });

        setProgress(100);
        onUploaded({ key, publicUrl });
      } catch (err) {
        setError(err instanceof Error ? err.message : "upload_failed");
      } finally {
        setTimeout(() => setProgress(null), 600);
      }
    },
    [kind, projectId, reelId, onUploaded],
  );

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    void upload(files[0]);
  };

  const Icon = kind === "bg" ? ImageIcon : Film;
  const metaText = describeMeta(kind, meta);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] text-icon">{label}</span>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={twMerge(
          "relative cursor-pointer overflow-hidden rounded-md bg-surface aspect-[9/16] max-w-[180px]",
          "flex items-center justify-center text-icon hover:text-iconHover transition-colors",
        )}
      >
        {currentUrl && kind === "bg" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {currentUrl && (kind === "hover" || kind === "main") && (
          <video
            src={currentUrl}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
          />
        )}
        {!currentUrl && (
          <div className="flex flex-col items-center gap-2 text-center px-2">
            <Icon size={28} strokeWidth={1.4} />
            <span className="text-[11px]">{MAX_LABEL[kind]}</span>
          </div>
        )}
        {progress !== null && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-icon/30">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPT[kind]}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {metaText && (
        <span className="text-[11px] text-icon truncate" title={metaText}>
          {metaText}
        </span>
      )}
      <div className="flex items-center gap-1">
        <IconButton
          icon={Upload}
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Загрузить
        </IconButton>
        {currentKey && (
          <IconButton icon={Trash2} size="sm" onClick={onCleared}>
            Удалить
          </IconButton>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
