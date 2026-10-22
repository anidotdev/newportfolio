"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SiSpotify } from "@icons-pack/react-simple-icons";
import { Music } from "lucide-react";

import { siteConfig } from "@/config/site";
import type { SpotifyResponse } from "@/lib/spotify";
import { cn } from "@/lib/utils";

const FALLBACK_DATA: SpotifyResponse = {
  ok: false,
  isPlaying: false,
  ...siteConfig.spotify.fallback,
};

type Status = "loading" | "ready" | "error";

function SpotifySkeleton() {
  return (
    <div
      data-testid="spotify-card"
      role="status"
      aria-label={siteConfig.spotify.labels.loading}
      className="mx-auto flex h-28 w-full max-w-[480px] items-center gap-4 rounded-3xl border border-hairline bg-surface-strong p-5 motion-safe:animate-pulse"
    >
      <div className="size-20 shrink-0 rounded-full bg-muted" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
      <div className="size-[30px] shrink-0 rounded-full bg-muted" />
    </div>
  );
}

export function SpotifyCard() {
  const { labels } = siteConfig.spotify;
  const [data, setData] = useState<SpotifyResponse>(FALLBACK_DATA);
  const [status, setStatus] = useState<Status>("loading");
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

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
        setSyncedAt(next.ok ? new Date() : null);
      } catch {
        if (!mounted || request.signal.aborted) return;
        setData(FALLBACK_DATA);
        setStatus("error");
        setSyncedAt(null);
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
  const artistsLabel = `${labels.by} ${artists}`;
  const ariaPrefix = data.isPlaying
    ? labels.nowPlayingAria
    : labels.lastPlayedAria;
  const ariaLabel = `${ariaPrefix}: ${statusLabel} ${data.title} ${artistsLabel}`;
  const syncedLabel = syncedAt
    ? `${labels.synced} ${syncedAt.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`
    : labels.synced;

  return (
    <div className="mx-auto w-full max-w-[480px]">
      {status === "loading" ? (
        <SpotifySkeleton />
      ) : (
        <a
          data-testid="spotify-card"
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel}
          className="group mx-auto flex h-28 w-full max-w-[480px] items-center gap-4 rounded-3xl border border-hairline bg-surface-strong p-5 transition-colors duration-150 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="size-20 shrink-0 rounded-full border border-hairline bg-surface-strong p-[3px] transition-colors duration-150 group-hover:bg-surface-hover">
            <div className="relative size-full overflow-hidden rounded-full bg-muted">
              {data.albumArt ? (
                <Image
                  src={data.albumArt}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover outline outline-1 -outline-offset-1 outline-foreground/10"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-muted-foreground">
                  <Music aria-hidden="true" className="size-6" strokeWidth={1.75} />
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 font-mono text-[13px] leading-none text-muted-foreground">
              <span
                data-testid="spotify-status-dot"
                aria-hidden="true"
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  data.isPlaying
                    ? "bg-spotify motion-safe:animate-pulse"
                    : "bg-muted-foreground/50",
                )}
              />
              <span data-testid="spotify-status" className="min-w-0 truncate">
                {statusLabel}
              </span>
            </div>{" "}
            <p className="mt-1 truncate text-[18px] font-semibold leading-tight md:text-[22px]">
              {data.title}
            </p>{" "}
            <p className="mt-1 truncate text-sm leading-tight text-muted-foreground">
              {artistsLabel}
            </p>
          </div>

          <span
            aria-hidden="true"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-foreground/45 text-background"
          >
            <SiSpotify
              size={16}
              title=""
              color="currentColor"
              aria-hidden="true"
              focusable="false"
            />
          </span>
        </a>
      )}

      <p
        data-testid="spotify-caption"
        className="mt-2 h-4 font-mono text-[11px] uppercase leading-4 tracking-[0.08em] text-muted-foreground"
      >
        {status === "loading" ? (
          <span className="invisible">{`${labels.synced} 00:00`}</span>
        ) : status === "error" ? (
          labels.notSynced
        ) : (
          syncedLabel
        )}
      </p>
    </div>
  );
}
