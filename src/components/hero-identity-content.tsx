"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Volume2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import type { HeroConfig } from "@/config/site";

type IdentityConfig = Pick<
  HeroConfig,
  "name" | "titles" | "nameAudio" | "verifiedLabel" | "playNameLabel"
>;

export function HeroIdentityContent({ hero }: { hero: IdentityConfig }) {
  const reduceMotion = useReducedMotion();
  const [titleIndex, setTitleIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeTitle = reduceMotion
    ? hero.titles[0] ?? ""
    : hero.titles[titleIndex % hero.titles.length] ?? "";

  useEffect(() => {
    if (reduceMotion || hero.titles.length < 2) return;

    const timer = window.setInterval(() => {
      setTitleIndex((index) => (index + 1) % hero.titles.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, [hero.titles.length, reduceMotion]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function playName() {
    if (!hero.nameAudio) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(hero.nameAudio);
    }

    audioRef.current.currentTime = 0;
    void audioRef.current.play().catch(() => {});
  }

  return (
    <div className="ml-[110px] h-full border-l border-hairline md:ml-[174px]">
      <div className="grid h-full grid-rows-[33px_1px_22px] md:grid-rows-[48px_1px_43px]">
        <div className="flex min-w-0 items-center gap-2 border-t border-hairline px-4 md:px-5">
          <h1
            id="profile-name"
            className="min-w-0 truncate text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-foreground md:text-[2.25rem]"
          >
            {hero.name}
          </h1>
          <BadgeCheck
            role="img"
            aria-label={hero.verifiedLabel}
            data-testid="verified-badge"
            className="size-5 shrink-0 text-foreground"
            fill="currentColor"
            stroke="var(--background)"
            strokeWidth={2}
          />
          {hero.nameAudio ? (
            <button
              type="button"
              aria-label={hero.playNameLabel}
              onClick={playName}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-[color,background-color,scale] duration-150 ease-out hover:bg-chip hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.96]"
            >
              <Volume2
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.75}
              />
            </button>
          ) : null}
        </div>

        <div aria-hidden="true" className="bg-hairline" />

        <div className="relative flex h-full items-center overflow-hidden px-4 md:px-5">
          <p className="sr-only">{hero.titles.join(" … ")}</p>
          <div
            data-testid="hero-title"
            aria-hidden="true"
            className="relative h-5 w-full overflow-hidden md:h-6"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={activeTitle}
                data-title-item
                className="absolute inset-0 flex items-center font-mono text-sm text-muted-foreground/80 md:text-base"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.25, ease: [0.2, 0, 0, 1] }
                }
              >
                {activeTitle}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
