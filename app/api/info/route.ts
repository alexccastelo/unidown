import { NextRequest } from "next/server";
import { validateUrl } from "@/lib/url-utils";
import { getInfo, YtDlpError } from "@/lib/ytdlp";
import { allow, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url") ?? "";
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
  try {
    const info = await getInfo(valid.url);
    return Response.json(info, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof YtDlpError) {
      return Response.json({ error: err.friendly.message, code: err.friendly.code }, {
        status: err.friendly.httpStatus,
      });
    }
    return Response.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
