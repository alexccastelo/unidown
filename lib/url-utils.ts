const ALLOWED_HOSTS = new Set([
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
  "mobile.x.com",
]);

export type ValidUrl = { ok: true; url: string; host: string };
export type InvalidUrl = { ok: false; reason: string };

export function validateXUrl(input: string): ValidUrl | InvalidUrl {
  if (!input || typeof input !== "string") {
    return { ok: false, reason: "URL não informada." };
  }
  const trimmed = input.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: "URL inválida." };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, reason: "Use uma URL http(s)." };
  }
  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) {
    return {
      ok: false,
      reason: "Apenas links do X (twitter.com / x.com) são aceitos nesta versão.",
    };
  }
  return { ok: true, url: parsed.toString(), host };
}

export function sanitizeFilename(name: string, maxLength = 120): string {
  const cleaned = name
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  const safe = cleaned.length > 0 ? cleaned : "video";
  return safe.slice(0, maxLength);
}
