# UniDown

Web app minimalista para baixar vídeos de qualquer rede social (YouTube, TikTok, X/Twitter, Instagram, etc.) direto pelo menu **Compartilhar** do macOS. Integra via Atalhos (Shortcuts.app); o app em si é um Next.js que expõe duas rotas: preview do vídeo e stream de download.

> **Escopo v1**: Download Universal de vídeos, uso local (localhost), sem contas.

## Como funciona

```
Safari (vídeo) → Compartilhar → Atalho "UniDown"
        → abre http://localhost:3000/?url=<link>
        → preview (thumb, autor, qualidades, formato MP4/MOV)
        → clique "Baixar" → stream direto para ~/Downloads
```

Backend chama `yt-dlp` localmente, usando os cookies do Safari (`--cookies-from-browser safari`) para autenticar no X, que em 2026 exige login para ver vídeos.

## Requisitos

- macOS
- Node.js 20+
- pnpm 10+
- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp): `brew install yt-dlp`
- Estar logado em `https://x.com` no Safari

## Setup

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Instalar o Atalho

Veja [`public/shortcut/README.md`](./public/shortcut/README.md) — passo-a-passo de ~90 segundos para criar o Atalho no Shortcuts.app e ativá-lo no menu Compartilhar.

## Variáveis de ambiente (opcionais)

- `YTDLP_BIN` — caminho para `yt-dlp` (padrão: `yt-dlp` no `$PATH`).
- `YTDLP_COOKIE_BROWSER` — de qual navegador pegar os cookies. Padrão `safari`. Aceita `chrome`, `firefox`, `edge`, `brave`, `chromium`, `vivaldi`, ou `none` para desabilitar cookies.

Exemplo:

```bash
YTDLP_COOKIE_BROWSER=chrome pnpm dev
```

## Endpoints

- `GET /api/info?url=<tweet-url>` — metadados JSON (`title`, `uploader`, `thumbnail`, `formats`, etc).
- `GET /api/download?url=<tweet-url>&format=<id>` — stream do vídeo com `Content-Disposition: attachment`.

Ambos só aceitam hosts `x.com`, `twitter.com` e `mobile.twitter.com`. Rate limit: 10 req/min por IP.

## Estrutura

```
app/
  api/info/route.ts        # metadados via yt-dlp -J
  api/download/route.ts    # stream via yt-dlp -o -
  page.tsx                 # UI: preview + download
components/                # url-input, video-preview, empty-state, theme-toggle...
lib/
  ytdlp.ts                 # wrapper (spawn, JSON, stream) — server only
  ytdlp-types.ts           # tipos compartilhados client/server
  url-utils.ts             # validação + sanitização de filename
  errors.ts                # mensagens amigáveis em pt-BR
  rate-limit.ts            # token bucket em memória
public/shortcut/           # instruções do Atalho
```

## Solução de problemas

### "Sem acesso aos cookies do Safari"

macOS protege os cookies do Safari num container. Para o Node ler, você precisa dar **Acesso Total ao Disco** ao Terminal (ou ao app de terminal que você usa — iTerm, Warp, etc.):

`Ajustes do Sistema → Privacidade e Segurança → Acesso Total ao Disco → +` → selecione seu Terminal.

Depois feche e reabra o Terminal e rode `pnpm dev` de novo.

**Ou** use Chrome/Firefox (cookies acessíveis sem permissão especial):

```bash
YTDLP_COOKIE_BROWSER=chrome pnpm dev
```

(logue-se em x.com no Chrome antes).

### "yt-dlp não encontrado"

```bash
brew install yt-dlp
```

### Tweet não baixa mas tem vídeo

`yt-dlp` muda bastante. Atualize:

```bash
brew upgrade yt-dlp
```

## Manutenção

`yt-dlp` muda bastante (o X quebra o scraping de tempos em tempos). Se algo parar de funcionar:

```bash
brew upgrade yt-dlp
```

## Roadmap

- v1.0 — Lançamento com suporte universal (X/Twitter, YouTube, TikTok, Instagram, etc.) e escolha de formato MP4/MOV.
- v2 — deploy público (exige host com processo de longa duração: Fly.io, VPS, etc.).
- v3 — histórico com login opcional.
- v4 — app nativo macOS com Share Extension própria (substitui o Atalho).

## Licença

Pessoal / estudo. Respeite o autor dos vídeos e os termos de uso de cada plataforma.
