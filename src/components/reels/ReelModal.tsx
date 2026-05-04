"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import type { ProjectSettings } from "@/lib/settings";
import type { PublicReel } from "./ReelCard";

interface Props {
  settings: ProjectSettings;
  reel: PublicReel;
  total: number;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onButtonClick: () => void;
}

const CURSOR_RIGHT =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><polyline points='9 6 15 12 9 18'/></svg>\") 16 16, e-resize";
const CURSOR_LEFT =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><polyline points='15 6 9 12 15 18'/></svg>\") 16 16, w-resize";

export function ReelModal({
  settings,
  reel,
  total,
  currentIndex,
  onPrev,
  onNext,
  onClose,
  onButtonClick,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < total - 1;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 600px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  // When mounted inside an iframe, ask the parent to expand the iframe to
  // cover the whole browser window (no OS fullscreen, just CSS).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.parent === window) return;
    window.parent.postMessage({ type: "ar:open" }, "*");
    return () => {
      window.parent.postMessage({ type: "ar:close" }, "*");
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    setProgress(0);
    if (!v) return;
    v.currentTime = 0;
    v.muted = muted;
    v.volume = 1;
    v.play().catch(() => {
      // Browser blocked unmuted autoplay — fall back to muted.
      v.muted = true;
      setMuted(true);
      v.play().catch(() => undefined);
    });
  }, [reel.id, muted]);

  function toggleMute() {
    const v = videoRef.current;
    const next = !muted;
    setMuted(next);
    if (v) {
      v.muted = next;
      if (!next) v.play().catch(() => undefined);
    }
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration || !isFinite(v.duration)) return;
    setProgress(v.currentTime / v.duration);
  }

  function handleEnded() {
    if (hasNext) onNext();
    else onClose();
  }

  function handleCenterClick() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => undefined);
    else v.pause();
  }

  const button = reel.button ?? settings.defaultButton;
  const showButton = button.enabled && button.text.trim().length > 0;
  const stretched = button.widthMode === "stretch";

  const opacity = Math.max(0, Math.min(100, settings.modal.backdropOpacity)) / 100;

  const frameStyle: React.CSSProperties = isMobile
    ? {
        width: "100vw",
        height: "100dvh",
        background: "transparent",
        position: "relative",
      }
    : {
        width: "min(540px, 92vw)",
        aspectRatio: "9 / 16",
        maxHeight: "92vh",
        background: "transparent",
        position: "relative",
      };

  const videoBoxStyle: React.CSSProperties = isMobile
    ? {
        position: "absolute",
        inset: 0,
        borderRadius: 0,
        overflow: "hidden",
        background: "#000",
      }
    : {
        position: "absolute",
        inset: 0,
        borderRadius: 16,
        overflow: "hidden",
        background: "#000",
      };

  const closeBtnStyle: React.CSSProperties = isMobile
    ? {
        position: "absolute",
        top: 25,
        right: 25,
        width: 32,
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }
    : {
        position: "absolute",
        top: -36,
        right: -36,
        width: 32,
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      };

  const muteBtnStyle: React.CSSProperties = isMobile
    ? {
        position: "absolute",
        top: 25,
        left: 25,
        width: 32,
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }
    : {
        position: "absolute",
        top: -36,
        left: -36,
        width: 32,
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ background: `rgba(0, 0, 0, ${opacity})` }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={frameStyle}>
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
          style={closeBtnStyle}
        >
          <X size={24} strokeWidth={1.6} />
        </button>

        <button
          type="button"
          aria-label={muted ? "Включить звук" : "Выключить звук"}
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="text-white/80 hover:text-white transition-colors"
          style={muteBtnStyle}
        >
          {muted ? (
            <VolumeX size={22} strokeWidth={1.6} />
          ) : (
            <Volume2 size={22} strokeWidth={1.6} />
          )}
        </button>

        <div style={videoBoxStyle}>
          {reel.mainVideoUrl ? (
            <video
              ref={videoRef}
              src={reel.mainVideoUrl}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              preload="auto"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
            />
          ) : reel.bgImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={reel.bgImageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-icon w-full h-full flex items-center justify-center">
              Нет видео
            </div>
          )}

          {/* Progress bars */}
          <div
            className="absolute top-2 left-2 right-2 z-30 flex gap-1 pointer-events-none"
            aria-hidden
          >
            {Array.from({ length: total }).map((_, i) => {
              const fill =
                i < currentIndex ? 1 : i === currentIndex ? progress : 0;
              return (
                <div
                  key={i}
                  className="flex-1 h-[3px] rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.35)" }}
                >
                  <div
                    className="h-full bg-white"
                    style={{
                      width: `${Math.min(100, Math.max(0, fill * 100))}%`,
                      transition:
                        i === currentIndex ? "width 200ms linear" : "none",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Tap zones */}
          {hasPrev && (
            <button
              type="button"
              aria-label="Предыдущий рилс"
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="absolute top-0 left-0 h-full z-10"
              style={{ width: "20%", background: "transparent", cursor: CURSOR_LEFT }}
            />
          )}
          {hasNext && (
            <button
              type="button"
              aria-label="Следующий рилс"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="absolute top-0 right-0 h-full z-10"
              style={{ width: "20%", background: "transparent", cursor: CURSOR_RIGHT }}
            />
          )}
          <button
            type="button"
            aria-label="Пауза/воспроизведение"
            onClick={(e) => {
              e.stopPropagation();
              handleCenterClick();
            }}
            className="absolute top-0 z-[5]"
            style={{
              left: hasPrev ? "20%" : 0,
              right: hasNext ? "20%" : 0,
              height: "100%",
              background: "transparent",
            }}
          />

          {/* Button overlaid on video */}
          {showButton && (
            <a
              href={button.url || "#"}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                onButtonClick();
              }}
              style={{
                position: "absolute",
                bottom: isMobile
                  ? "calc(env(safe-area-inset-bottom, 0px) + 30px)"
                  : "20px",
                zIndex: 40,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 18px",
                fontSize: `${button.fontSize}px`,
                color: button.textColor,
                background: button.bgColor,
                borderRadius: `${button.radius}px`,
                transition: "background-color 200ms",
                textDecoration: "none",
                whiteSpace: stretched ? "normal" : "nowrap",
                ...(stretched
                  ? { left: "20px", right: "20px", textAlign: "center" }
                  : {
                      left: "50%",
                      transform: "translateX(-50%)",
                      maxWidth: "calc(100% - 40px)",
                    }),
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  button.bgHoverColor;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  button.bgColor;
              }}
            >
              {button.text}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
