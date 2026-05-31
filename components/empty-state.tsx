export function EmptyState() {
  return (
    <div className="rounded-xl border border-border/70 bg-card/40 p-5 sm:p-6">
      <h2 className="text-base font-medium">Como usar</h2>
      <ol className="mt-3 space-y-2 text-sm text-muted-foreground leading-relaxed">
        <li>
          <span className="font-medium text-foreground">1.</span> Instale o
          Atalho <code className="rounded bg-muted px-1.5 py-0.5 text-xs">UniDown</code>{" "}
          (veja instruções em <code className="rounded bg-muted px-1.5 py-0.5 text-xs">public/shortcut</code>).
        </li>
        <li>
          <span className="font-medium text-foreground">2.</span> Abra um vídeo
          (no X/Twitter, YouTube, TikTok, etc.) no Safari e clique em <span className="font-medium text-foreground">Compartilhar → UniDown</span>.
        </li>
        <li>
          <span className="font-medium text-foreground">3.</span> Esta página
          abre com o preview e o botão de baixar.
        </li>
      </ol>
      <p className="mt-4 text-xs text-muted-foreground">
        Ou cole manualmente a URL do vídeo no campo acima.
      </p>
    </div>
  );
}
