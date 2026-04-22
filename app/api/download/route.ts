import { NextRequest } from "next/server";
import { sanitizeFilename, validateXUrl } from "@/lib/url-utils";
import { getInfo, streamDownload, YtDlpError } from "@/lib/ytdlp";
import { allow, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url") ?? "";
  const formatParam = req.nextUrl.searchParams.get("format") ?? "";
  const valid = validateXUrl(urlParam);
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

  const formatId =
    formatParam && info.formats.some((f) => f.formatId === formatParam)
      ? formatParam
      : info.bestFormatId;

  if (!formatId) {
    return Response.json({ error: "Nenhum formato de vídeo disponível." }, { status: 404 });
  }

  const chosen = info.formats.find((f) => f.formatId === formatId);
  const ext = chosen?.ext ?? info.ext ?? "mp4";
  const baseName = sanitizeFilename(
    info.uploader ? `${info.uploader} - ${info.id}` : info.title,
  );
  const filename = `${baseName}.${ext}`;

  const { stream, contentType } = streamDownload(valid.url, formatId);
  return new Response(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
