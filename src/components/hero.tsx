"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Clock,
  Code,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { BrandIcon } from "@/components/brand-icons";
import { siteConfig, type InfoIcon, type InfoItem } from "@/config/site";
import { cn } from "@/lib/utils";

const INFO_ICONS: Record<InfoIcon, LucideIcon> = {
  code: Code,
  lightbulb: Lightbulb,
  "map-pin": MapPin,
  mail: Mail,
  clock: Clock,
  phone: Phone,
};

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

let clockSnapshot = 0;
const clockListeners = new Set<() => void>();
let clockTimer: number | undefined;

function subscribeToClock(listener: () => void) {
  clockListeners.add(listener);

  if (clockTimer === undefined) {
    clockSnapshot = Date.now();
    clockTimer = window.setInterval(() => {
      clockSnapshot = Date.now();
      clockListeners.forEach((notify) => notify());
    }, 30_000);
  }

  listener();

  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer !== undefined) {
      window.clearInterval(clockTimer);
      clockTimer = undefined;
    }
  };
}

function useClock() {
  return useSyncExternalStore(
    subscribeToClock,
    () => clockSnapshot,
    () => 0,
  );
}

function formatTime(timeZone: string, date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getOffsetMinutes(timeZone: string, date: Date) {
  const zoneName = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!zoneName || zoneName === "GMT") return 0;

  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(zoneName);
  if (!match) return 0;

  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

function formatRelativeTime(
  timeZone: string,
  date: Date,
  labels: { same: string; ahead: string; behind: string },
) {
  const visitorTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const difference =
    getOffsetMinutes(timeZone, date) - getOffsetMinutes(visitorTimeZone, date);

  if (difference === 0) return labels.same;

  const distance = Math.abs(difference);
  const hours = Math.floor(distance / 60);
  const minutes = distance % 60;
  const amount = [hours ? `${hours}h` : "", minutes ? `${minutes}m` : ""]
    .filter(Boolean)
    .join(" ");

  return `${amount} ${difference > 0 ? labels.ahead : labels.behind}`;
}

function InfoRow({
  icon,
  className,
  children,
}: {
  icon: InfoIcon;
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = INFO_ICONS[icon];

  return (
    <div
      className={cn(
        "flex h-[42px] min-w-0 items-center gap-2.5",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-hairline bg-surface-strong text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 font-mono text-base text-foreground">
        {children}
      </div>
    </div>
  );
}

function InfoLink({ item }: { item: InfoItem }) {
  return (
    <a
      href={item.href}
      title={item.text}
      className="block truncate underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {item.text}
    </a>
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
  const { hero } = siteConfig;

  return (
    <div className="col-[container] px-2.5 pt-1.5">
      <div
        data-testid="hero-banner"
        className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-[2px] bg-muted md:h-[260px]"
      >
        {hero.banner ? (
          <Image
            src={hero.banner}
            alt={hero.bannerAlt}
            fill
            preload
            sizes="(max-width: 1000px) calc(100vw - 20px), 980px"
            className="object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
          />
        ) : (
          <>
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, transparent 0 7px, var(--hatch) 7px 8px)",
              }}
            />
            <span className="relative px-4 text-center font-mono text-xs leading-relaxed text-muted-foreground">
              {hero.bannerCaption}
            </span>
          </>
        )}
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
    <div className="col-[full] border-b border-hairline">
      <div className="relative mx-auto flex h-[78px] w-full max-w-[var(--container-max)] items-center px-5">
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
    </div>
  );
}

function Details() {
  const { hero } = siteConfig;
  const { info } = hero;
  const now = useClock();
  const date = now ? new Date(now) : null;
  const time = date ? formatTime(info.timeZone, date) : null;
  const relative = date
    ? formatRelativeTime(info.timeZone, date, info.timeLabels)
    : null;

  return (
    <div
      role="group"
      aria-label={hero.infoLabel}
      className="col-[container] px-5 py-5"
    >
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-1/2 hidden border-l border-dashed border-hairline sm:block"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-4 sm:gap-x-10">
          <InfoRow
            icon={info.work.icon}
            className="sm:col-start-1 sm:row-start-1"
          >
            <span className="block truncate">{info.work.text}</span>
          </InfoRow>
          <InfoRow
            icon={info.tagline.icon}
            className="sm:col-start-1 sm:row-start-2"
          >
            <span className="block truncate">{info.tagline.text}</span>
          </InfoRow>
          <InfoRow
            icon={info.location.icon}
            className="sm:col-start-1 sm:row-start-3"
          >
            <span className="block truncate">{info.location.text}</span>
          </InfoRow>
          <InfoRow
            icon="clock"
            className="sm:col-start-2 sm:row-start-3"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="inline-block w-[8ch] shrink-0 tabular-nums">
                {time ?? "--:-- --"}
              </span>
              <span className="truncate text-muted-foreground">
                <span aria-hidden="true">{"// "}</span>
                {relative ?? "…"}
              </span>
            </span>
          </InfoRow>
          <InfoRow
            icon={info.email.icon}
            className="sm:col-start-1 sm:row-start-4"
          >
            <InfoLink item={info.email} />
          </InfoRow>
          <InfoRow
            icon={info.phone.icon}
            className="sm:col-start-2 sm:row-start-4"
          >
            <InfoLink item={info.phone} />
          </InfoRow>
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
      <Details />
    </section>
  );
}
