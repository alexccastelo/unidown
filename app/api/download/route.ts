import { NextRequest } from "next/server";
import { sanitizeFilename, validateUrl } from "@/lib/url-utils";
import { getInfo, streamDownload, YtDlpError } from "@/lib/ytdlp";
import { allow, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url") ?? "";
  const formatParam = req.nextUrl.searchParams.get("format") ?? "";
  const extParam = req.nextUrl.searchParams.get("ext") ?? "mp4";
  const ext = extParam === "mov" ? "mov" : "mp4";

  const valid = validateUrl(urlParam);
  if (!valid.ok) {
    return Response.json({ error: valid.reason }, { status: 400 });
  }
  if (!allow(clientKey(req))) {
    return Response.json(
      { error: "Muitas requisições. Aguarde um instante." },
      { status: 429 },
    );
  }

  let info;
  try {
    info = await getInfo(valid.url);
  } catch (err) {
    if (err instanceof YtDlpError) {
      return Response.json({ error: err.friendly.message }, { status: err.friendly.httpStatus });
    }
    return Response.json({ error: "Erro inesperado." }, { status: 500 });
  }

  // Use caller's format ID if provided (from the quality picker), else best default.
  const formatId = formatParam || info.bestFormatId;
  if (!formatId) {
    return Response.json({ error: "Nenhum formato de vídeo disponível." }, { status: 404 });
  }

  const baseName = sanitizeFilename(
    info.uploader ? `${info.uploader} - ${info.id}` : info.title,
  );
  const filename = `${baseName}.${ext}`;

  const { stream, contentType } = streamDownload(valid.url, formatId, ext);
  return new Response(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
