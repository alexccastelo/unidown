import "server-only";
import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { mapYtDlpError, type FriendlyError } from "./errors";
import type { VideoFormat, VideoInfo } from "./ytdlp-types";

export type { VideoFormat, VideoInfo } from "./ytdlp-types";

const YTDLP_BIN = process.env.YTDLP_BIN || "yt-dlp";
const COOKIE_BROWSER = process.env.YTDLP_COOKIE_BROWSER || "safari";

export class YtDlpError extends Error {
  friendly: FriendlyError;
  constructor(friendly: FriendlyError) {
    super(friendly.message);
    this.friendly = friendly;
  }
}

function baseArgs(url: string): string[] {
  const args = ["--no-warnings", "--no-progress"];
  if (COOKIE_BROWSER && COOKIE_BROWSER !== "none") {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      const isX = host.endsWith("x.com") || host.endsWith("twitter.com");

      // Se o navegador de cookies for o Safari, só o usamos para links do X/Twitter.
      // Isso evita erros de permissão de disco (Operation Not Permitted) ao baixar de outras redes públicas (ex: YouTube, TikTok).
      if (isX || COOKIE_BROWSER !== "safari") {
        args.push("--cookies-from-browser", COOKIE_BROWSER);
      }
    } catch {
      args.push("--cookies-from-browser", COOKIE_BROWSER);
    }
  }
  return args;
}

export async function getInfo(url: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const args = [...baseArgs(url), "-J", url];
    const child = spawn(YTDLP_BIN, args, { stdio: ["ignore", "pipe", "pipe"] });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on("data", (c: Buffer) => stdoutChunks.push(c));
    child.stderr.on("data", (c: Buffer) => stderrChunks.push(c));

    child.on("error", (err: NodeJS.ErrnoException) => {
      const stderr = err.code === "ENOENT" ? "ENOENT" : err.message;
      reject(new YtDlpError(mapYtDlpError(stderr, null)));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const stderr = Buffer.concat(stderrChunks).toString("utf8");
        reject(new YtDlpError(mapYtDlpError(stderr, code)));
        return;
      }
      try {
        const json = JSON.parse(Buffer.concat(stdoutChunks).toString("utf8"));
        resolve(normalize(json));
      } catch {
        reject(
          new YtDlpError({
            code: "unknown",
            message: "Não consegui interpretar a resposta do yt-dlp.",
            httpStatus: 500,
          }),
        );
      }
    });
  });
}

type RawFormat = {
  format_id?: string;
  ext?: string;
  resolution?: string | null;
  width?: number | null;
  height?: number | null;
  filesize?: number | null;
  filesize_approx?: number | null;
  vcodec?: string | null;
  acodec?: string | null;
  tbr?: number | null;
};

type RawInfo = {
  id?: string;
  title?: string;
  uploader?: string | null;
  uploader_id?: string | null;
  thumbnail?: string | null;
  duration?: number | null;
  description?: string | null;
  webpage_url?: string;
  ext?: string;
  format_id?: string;
  formats?: RawFormat[];
};

// Compound selector: yt-dlp picks best video + best audio and muxes to MP4.
// Used when the user doesn't pick a specific quality.
const BEST_FORMAT = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best";

// Build the yt-dlp --format string for a given format ID.
// Simple IDs (e.g. "137") are DASH video-only → append best-audio fallback chain.
// Compound/selector strings (e.g. already containing "+" or "/") are used as-is.
function buildFormatString(formatId: string): string {
  if (formatId.includes("/") || formatId.startsWith("best")) return formatId;
  return `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/${formatId}`;
}

function normalize(raw: RawInfo): VideoInfo {
  const formats: VideoFormat[] = Array.isArray(raw.formats)
    ? raw.formats
        .filter((f) => {
          const hasVideo = f.vcodec && f.vcodec !== "none";
          // HLS streams download as .ts containers that QuickTime can't open.
          // We always use the compound BEST_FORMAT for HLS scenarios anyway.
          const fid = String(f.format_id ?? "").toLowerCase();
          const isHls = fid.startsWith("hls");
          // Keep only formats with explicit resolution so the picker is useful.
          const hasResolution = Boolean(f.width && f.height);
          return hasVideo && !isHls && hasResolution;
        })
        .map((f) => ({
          formatId: String(f.format_id ?? ""),
          ext: "mp4", // we always merge output to mp4
          resolution: `${f.width}x${f.height}`,
          filesize: f.filesize ?? f.filesize_approx ?? null,
          vcodec: f.vcodec ?? null,
          acodec: f.acodec ?? null,
          tbr: f.tbr ?? null,
          hasAudio: Boolean(f.acodec && f.acodec !== "none"),
        }))
        // Deduplicate by resolution (yt-dlp can return duplicates at same res)
        .filter((f, i, arr) => arr.findIndex((x) => x.resolution === f.resolution) === i)
        .sort((a, b) => (b.tbr ?? 0) - (a.tbr ?? 0))
    : [];

  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? "video"),
    uploader: raw.uploader ?? null,
    uploaderId: raw.uploader_id ?? null,
    thumbnail: raw.thumbnail ?? null,
    duration: raw.duration ?? null,
    description: raw.description ?? null,
    webpageUrl: String(raw.webpage_url ?? ""),
    formats,
    bestFormatId: BEST_FORMAT,
    ext: "mp4",
  };
}

export type DownloadStream = {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
};

export function streamDownload(
  url: string,
  formatId: string,
  ext: "mp4" | "mov" = "mp4"
): DownloadStream {
  const args = [
    ...baseArgs(url),
    "-o", "-",
    "--no-part",
    "--format", buildFormatString(formatId),
    "--merge-output-format", ext,
    url,
  ];
  const child = spawn(YTDLP_BIN, args, { stdio: ["ignore", "pipe", "pipe"] });

  let stderrBuf = "";
  child.stderr.on("data", (c: Buffer) => {
    stderrBuf += c.toString("utf8");
  });
  child.on("error", () => {
    try { child.kill("SIGKILL"); } catch {}
  });

  const webStream = Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>;

  const wrapped = new ReadableStream<Uint8Array>({
    start(controller) {
      const reader = webStream.getReader();
      const pump = (): Promise<void> =>
        reader.read().then(({ done, value }) => {
          if (done) {
            if (child.exitCode !== null && child.exitCode !== 0) {
              controller.error(new YtDlpError(mapYtDlpError(stderrBuf, child.exitCode)));
              return;
            }
            controller.close();
            return;
          }
          if (value) controller.enqueue(value);
          return pump();
        });
      pump().catch((err) => controller.error(err));
    },
    cancel() {
      try { child.kill("SIGTERM"); } catch {}
    },
  });

  return { stream: wrapped, contentType: ext === "mov" ? "video/quicktime" : "video/mp4" };
}
