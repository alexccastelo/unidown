export type FriendlyError = {
  code:
    | "not_found"
    | "private"
    | "auth_required"
    | "not_video"
    | "binary_missing"
    | "network"
    | "unknown";
  message: string;
  httpStatus: number;
};

export function mapYtDlpError(stderr: string, exitCode: number | null): FriendlyError {
  const s = stderr.toLowerCase();

  if (s.includes("enoent") || s.includes("command not found")) {
    return {
      code: "binary_missing",
      message:
        "yt-dlp não encontrado. Instale com: brew install yt-dlp",
      httpStatus: 500,
    };
  }
  if (s.includes("operation not permitted") && s.includes("cookies")) {
    return {
      code: "auth_required",
      message:
        "Sem acesso aos cookies do Safari. Dê 'Acesso Total ao Disco' ao Terminal (Ajustes do Sistema → Privacidade e Segurança → Acesso Total ao Disco → +), ou troque para Chrome/Firefox via YTDLP_COOKIE_BROWSER=chrome.",
      httpStatus: 401,
    };
  }
  if (
    s.includes("nsfw tweet requires") ||
    s.includes("age-restricted") ||
    s.includes("login required") ||
    s.includes("requires authentication") ||
    s.includes("not authorized") ||
    s.includes("403")
  ) {
    return {
      code: "auth_required",
      message:
        "Este tweet exige login. Abra o X no Safari e faça login — o app usa os cookies do Safari.",
      httpStatus: 401,
    };
  }
  if (s.includes("private") || s.includes("protected")) {
    return {
      code: "private",
      message: "Conta protegida. Você precisa seguir o autor para ver este vídeo.",
      httpStatus: 403,
    };
  }
  if (s.includes("no video could be found") || s.includes("no media found")) {
    return {
      code: "not_video",
      message: "Esse tweet não contém vídeo.",
      httpStatus: 404,
    };
  }
  if (s.includes("unavailable") || s.includes("not found") || s.includes("404")) {
    return {
      code: "not_found",
      message: "Tweet não encontrado ou removido.",
      httpStatus: 404,
    };
  }
  if (s.includes("network") || s.includes("timed out") || s.includes("timeout")) {
    return {
      code: "network",
      message: "Falha de rede ao acessar o X. Tente novamente.",
      httpStatus: 502,
    };
  }
  return {
    code: "unknown",
    message: `Erro inesperado (exit ${exitCode ?? "?"}).`,
    httpStatus: 500,
  };
}
