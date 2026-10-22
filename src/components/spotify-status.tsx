"use client";

import { useEffect, useState } from "react";
import { SiSpotify } from "@icons-pack/react-simple-icons";

import { siteConfig } from "@/config/site";
import type { SpotifyResponse } from "@/lib/spotify";

const FALLBACK_DATA: SpotifyResponse = {
  ok: false,
  isPlaying: false,
  ...siteConfig.spotify.fallback,
};

type Status = "loading" | "ready" | "error";

export function SpotifyStatus() {
  const { labels } = siteConfig.spotify;
  const [data, setData] = useState<SpotifyResponse>(FALLBACK_DATA);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let controller: AbortController | null = null;
    let timer: number | null = null;
    let mounted = true;

    const clearTimer = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const stop = () => {
      clearTimer();
      controller?.abort();
      controller = null;
    };

    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      const request = controller;

      try {
        const response = await fetch("/api/spotify", {
          signal: request.signal,
        });

        if (!response.ok) throw new Error("Spotify request failed");

        const next = (await response.json()) as SpotifyResponse;
        if (!mounted || request.signal.aborted) return;

        setData(next);
        setStatus(next.ok ? "ready" : "error");
      } catch {
        if (!mounted || request.signal.aborted) return;
        setData(FALLBACK_DATA);
        setStatus("error");
      }
    };

    const start = () => {
      if (document.hidden) return;

      void load();
      clearTimer();
      timer = window.setInterval(() => {
        void load();
      }, 60_000);
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mounted = false;
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const statusLabel = data.isPlaying ? labels.nowPlaying : labels.lastPlayed;
  const artists = data.artists.join(", ");
  const href = data.url.startsWith("https://open.spotify.com") ? data.url : null;
  const track = (
    <>
      <span className="text-foreground">{data.title}</span>
      {artists ? (
        <>
          <span className="sr-only">, </span>
          <span aria-hidden="true" className="text-muted-foreground">
            {" · "}
          </span>
          <span className="text-muted-foreground">{artists}</span>
        </>
      ) : null}
    </>
  );

  return (
    <div
      data-testid="spotify-status-row"
      className="flex h-6 min-w-0 items-center gap-2 text-sm leading-5"
    >
      <span
        data-testid="spotify-icon"
        role="img"
        aria-label={labels.iconLabel}
        className="shrink-0 text-spotify"
      >
        <SiSpotify
          size={16}
          color="currentColor"
          aria-hidden="true"
          focusable="false"
        />
      </span>

      {status === "loading" ? (
        <span
          data-testid="spotify-status"
          className="min-w-0 truncate text-xs text-muted-foreground"
        >
          {labels.loading}
        </span>
      ) : (
        <>
          <span
            data-testid="spotify-status"
            className="shrink-0 font-mono text-xs text-muted-foreground"
          >
            {statusLabel}
          </span>
          <span
            aria-hidden="true"
            className="h-px w-3 shrink-0 bg-hairline"
          />
          <span data-testid="spotify-track" className="min-w-0 flex-1">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block truncate rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {track}
              </a>
            ) : (
              <span className="block truncate">{track}</span>
            )}
          </span>
        </>
      )}
    </div>
  );
}
