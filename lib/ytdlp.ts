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

function baseArgs(): string[] {
  const args = ["--no-warnings", "--no-progress"];
  if (COOKIE_BROWSER && COOKIE_BROWSER !== "none") {
    args.push("--cookies-from-browser", COOKIE_BROWSER);
  }
  return args;
}

export async function getInfo(url: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const args = [...baseArgs(), "-J", url];
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

function normalize(raw: RawInfo): VideoInfo {
  const formats: VideoFormat[] = Array.isArray(raw.formats)
    ? raw.formats
        .filter((f) => f.vcodec && f.vcodec !== "none")
        .map((f) => ({
          formatId: String(f.format_id ?? ""),
          ext: String(f.ext ?? "mp4"),
          resolution:
            f.resolution ??
            (f.width && f.height ? `${f.width}x${f.height}` : null),
          filesize: f.filesize ?? f.filesize_approx ?? null,
          vcodec: f.vcodec ?? null,
          acodec: f.acodec ?? null,
          tbr: f.tbr ?? null,
        }))
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
    bestFormatId: raw.format_id ? String(raw.format_id) : (formats[0]?.formatId ?? null),
    ext: String(raw.ext ?? "mp4"),
  };
}

export type DownloadStream = {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
};

export function streamDownload(url: string, formatId: string): DownloadStream {
  const args = [
    ...baseArgs(),
    "-o", "-",
    "--no-part",
    "--format", formatId,
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

  return { stream: wrapped, contentType: "video/mp4" };
}
