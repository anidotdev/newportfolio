"use client";

import { useSyncExternalStore } from "react";

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

export function SocialNote({ text }: { text: string }) {
  const showNote = useShowSocialNote();
  if (!showNote) return null;

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
        className="ml-auto mt-1 h-7 w-14 -scale-y-100 text-muted-foreground/60"
      >
        <path d="M4 5c13 1 26 8 34 22" />
        <path d="M29 24l9 4 1-10" />
      </svg>
    </div>
  );
}
