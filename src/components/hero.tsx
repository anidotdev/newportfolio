"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { BadgeCheck, Volume2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { BrandIcon } from "@/components/brand-icons";
import { KyotoDuskBanner } from "@/components/kyoto-dusk-banner";
import { SpotifyStatus } from "@/components/spotify-status";
import { siteConfig } from "@/config/site";

const SOCIAL_NOTE_QUERY = "(min-width: 1320px)";

function subscribeToSocialNote(callback: () => void) {
  const query = window.matchMedia(SOCIAL_NOTE_QUERY);
  query.addEventListener("change", callback);
  callback();
  return () => query.removeEventListener("change", callback);
}

function useShowSocialNote() {
  return useSyncExternalStore(
    subscribeToSocialNote,
    () => window.matchMedia(SOCIAL_NOTE_QUERY).matches,
    () => false,
  );
}

function SocialNote({ text }: { text: string }) {
  return (
    <div
      data-testid="follow-note"
      aria-hidden="true"
      className="pointer-events-none absolute right-[calc(100%+16px)] top-1/2 w-[7.5rem] -translate-y-1/2 text-right"
    >
      <span className="inline-block -rotate-[4deg] font-hand text-lg leading-none text-muted-foreground">
        {text}
      </span>
      <svg
        viewBox="0 0 64 34"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-auto mt-1 h-7 w-14 text-muted-foreground/60"
      >
        <path d="M4 5c13 1 26 8 34 22" />
        <path d="M29 24l9 4 1-10" />
      </svg>
    </div>
  );
}

function Banner() {
  return (
    <div className="col-[container] px-2.5 pt-1.5">
      <div
        data-testid="hero-banner"
        className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-[2px] bg-muted md:h-[260px]"
      >
        <KyotoDuskBanner />
      </div>
    </div>
  );
}

function Avatar() {
  const { hero } = siteConfig;

  return (
    <div
      data-testid="hero-avatar"
      role="img"
      aria-label={hero.avatarAlt}
      className="absolute left-2.5 -top-10 size-24 overflow-hidden rounded-full border border-hairline bg-muted ring-4 ring-background md:-top-[68px] md:size-40"
    >
      {hero.avatar ? (
        <Image
          src={hero.avatar}
          alt=""
          fill
          preload
          sizes="(max-width: 767px) 96px, 160px"
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-full items-center justify-center font-mono text-xl font-medium tracking-[0.08em] text-muted-foreground"
        >
          {hero.avatarInitials}
        </span>
      )}
    </div>
  );
}

function Identity() {
  const { hero } = siteConfig;
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
    <div
      data-testid="hero-identity"
      className="relative col-[container] h-14 md:h-[92px]"
    >
      <Avatar />

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
    </div>
  );
}

function Socials() {
  const { hero } = siteConfig;
  const showNote = useShowSocialNote();

  return (
    <div className="col-[full]">
      <div className="relative mx-auto w-full max-w-[var(--container-max)] px-5">
        <div className="relative flex h-[78px] items-center">
          {showNote ? <SocialNote text={hero.socialNote} /> : null}
          <nav aria-label={hero.socialsLabel}>
            <ul className="flex items-center gap-2.5">
              {hero.socials.map((social) => (
                <li key={social.label}>
                  <a
                    data-testid="social-link"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-10 items-center justify-center rounded-[8px] border border-hairline bg-surface-subtle text-muted-foreground transition-[color,background-color,scale] duration-150 ease-out hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.96]"
                  >
                    <BrandIcon name={social.icon} className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="-mt-2 pb-4">
          <SpotifyStatus />
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      aria-labelledby="profile-name"
      className="hero-grid relative w-full"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-full max-w-[var(--container-max)] -translate-x-1/2 border-x border-hairline"
      />

      <Banner />
      <Identity />

      <div
        data-testid="hero-hatch"
        aria-hidden="true"
        className="col-[full] h-10 w-full border-y border-hairline"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent 0 4px, var(--hatch) 4px 5px)",
        }}
      />

      <Socials />
    </section>
  );
}
