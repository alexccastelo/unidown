"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UrlInput({
  onSubmit,
  initial = "",
  disabled = false,
}: {
  onSubmit: (url: string) => void;
  initial?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);

  function handle(e: FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (v) onSubmit(v);
  }

  return (
    <form
      onSubmit={handle}
      className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
    >
      <Input
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="Cole o link do vídeo (YouTube, TikTok, X, Instagram...)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="URL do vídeo"
        className="h-11 text-base sm:text-sm"
      />
      <Button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        className="h-11 w-full sm:w-auto"
      >
        Analisar
      </Button>
    </form>
  );
}
