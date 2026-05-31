"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { PreviewSkeleton } from "@/components/preview-skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { UrlInput } from "@/components/url-input";
import { VideoPreview } from "@/components/video-preview";
import type { VideoInfo } from "@/lib/ytdlp-types";

type Status =
  | { kind: "idle" }
  | { kind: "loading"; url: string }
  | { kind: "ready"; url: string; info: VideoInfo }
  | { kind: "error"; url: string; message: string };

function HomeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const urlFromQuery = params.get("url");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const load = useCallback(async (url: string) => {
    setStatus({ kind: "loading", url });
    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: "error", url, message: data?.error ?? "Erro ao carregar." });
        toast.error(data?.error ?? "Erro ao carregar.");
        return;
      }
      setStatus({ kind: "ready", url, info: data as VideoInfo });
    } catch {
      setStatus({ kind: "error", url, message: "Sem resposta do servidor." });
      toast.error("Sem resposta do servidor.");
    }
  }, []);

  useEffect(() => {
    if (!urlFromQuery) return;
    // Intentional: trigger async fetch that transitions status state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(urlFromQuery);
  }, [urlFromQuery, load]);

  function handleSubmit(url: string) {
    router.replace(`/?url=${encodeURIComponent(url)}`);
    load(url);
  }

  function handleReset() {
    router.replace("/");
    setStatus({ kind: "idle" });
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
            UniDown
          </h1>
          <span className="text-xs text-muted-foreground font-medium">Download Universal</span>
        </div>
        <ThemeToggle />
      </header>

      <section className="flex flex-col gap-4">
        <UrlInput
          onSubmit={handleSubmit}
          initial={urlFromQuery ?? ""}
          disabled={status.kind === "loading"}
        />
      </section>

      <section className="flex flex-col gap-4">
        {status.kind === "loading" && <PreviewSkeleton />}

        {status.kind === "ready" && (
          <VideoPreview info={status.info} sourceUrl={status.url} />
        )}

        {status.kind === "error" && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground">
            <p className="font-medium text-destructive">Não foi possível carregar</p>
            <p className="mt-1 text-muted-foreground">{status.message}</p>
            <button
              onClick={handleReset}
              className="mt-3 text-sm font-medium underline-offset-4 hover:underline"
            >
              Tentar outro link
            </button>
          </div>
        )}

        {status.kind === "idle" && <EmptyState />}
      </section>

      <footer className="mt-auto pt-8 text-xs text-muted-foreground">
        Para uso pessoal. Respeite o autor do conteúdo e os termos de cada plataforma.
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PageFallback />}>
      <HomeInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <PreviewSkeleton />
    </main>
  );
}
