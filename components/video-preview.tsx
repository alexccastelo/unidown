"use client";

import { useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { VideoFormat, VideoInfo } from "@/lib/ytdlp-types";

function formatDuration(seconds: number | null): string {
  if (!seconds || !Number.isFinite(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSize(bytes: number | null): string {
  if (!bytes || !Number.isFinite(bytes)) return "";
  const mb = bytes / 1_048_576;
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function formatLabel(f: VideoFormat): string {
  const res = f.resolution ?? f.formatId;
  const size = formatSize(f.filesize);
  const audio = f.hasAudio ? "" : " + áudio";
  return size
    ? `${res}${audio} · MP4 · ${size}`
    : `${res}${audio} · MP4`;
}

export function VideoPreview({
  info,
  sourceUrl,
}: {
  info: VideoInfo;
  sourceUrl: string;
}) {
  const formats = useMemo(
    () => info.formats.filter((f) => f.formatId && f.formatId.length > 0),
    [info],
  );
  // Start with the highest-quality format in the picker (not the compound bestFormatId).
  // Empty string → server falls back to best compound selector automatically.
  const [formatId, setFormatId] = useState<string>(formats[0]?.formatId ?? "");
  const [ext, setExt] = useState<"mp4" | "mov">("mp4");

  const downloadHref = `/api/download?url=${encodeURIComponent(sourceUrl)}${formatId ? `&format=${encodeURIComponent(formatId)}` : ""}&ext=${ext}`;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {info.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={info.thumbnail}
          alt={info.title}
          className="aspect-video w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="aspect-video w-full bg-muted" />
      )}

      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {info.uploader && <span className="font-medium text-foreground">{info.uploader}</span>}
            {info.uploaderId && <span>@{info.uploaderId}</span>}
            {info.duration ? <span>· {formatDuration(info.duration)}</span> : null}
          </div>
          {info.description && (
            <p className="line-clamp-3 text-sm text-foreground/90">{info.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {formats.length > 1 ? (
            <Select
              value={formatId}
              onValueChange={(v) => {
                if (v) setFormatId(v);
              }}
            >
              <SelectTrigger className="h-11 w-full sm:w-auto sm:min-w-[220px]">
                <SelectValue placeholder="Qualidade" />
              </SelectTrigger>
              <SelectContent>
                {formats.map((f) => (
                  <SelectItem key={f.formatId} value={f.formatId}>
                    {formatLabel(f)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {/* Formato de arquivo (MP4 / MOV) */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/40 h-11 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => setExt("mp4")}
              className={cn(
                "flex-1 sm:flex-initial px-4 py-1 text-xs font-medium rounded-md transition-all h-8",
                ext === "mp4"
                  ? "bg-background text-foreground shadow-sm border border-border/20 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              MP4
            </button>
            <button
              type="button"
              onClick={() => setExt("mov")}
              className={cn(
                "flex-1 sm:flex-initial px-4 py-1 text-xs font-medium rounded-md transition-all h-8",
                ext === "mov"
                  ? "bg-background text-foreground shadow-sm border border-border/20 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              MOV
            </button>
          </div>

          <a
            href={downloadHref}
            download
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-11 w-full px-4 text-sm sm:w-auto sm:flex-1",
            )}
          >
            Baixar vídeo
          </a>
        </div>
      </div>
    </div>
  );
}
