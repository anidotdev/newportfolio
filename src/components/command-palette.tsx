"use client";

import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { siteConfig } from "@/config/site";
import { isEditableTarget, navigateTo } from "@/lib/navigation";

// Keep cmdk and dialog dependencies out of the initial route bundle.
// The heavier UI is downloaded only when the command palette is opened.
const CommandPaletteDialog = lazy(() =>
  import("@/components/command-palette-dialog").then((module) => ({
    default: module.CommandPaletteDialog,
  })),
);

type PaletteContextValue = {
  openPalette: (trigger?: HTMLElement | null) => void;
};

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function CommandPaletteProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const chordStartedAt = useRef(0);

  const openPalette = useCallback((trigger?: HTMLElement | null) => {
    if (trigger) restoreFocusRef.current = trigger;
    setHasOpened(true);
    setOpen(true);
  }, []);

  const chordTargets = useMemo(() => {
    const targets = new Map<
      string,
      { href: string; external: boolean }
    >();

    for (const item of siteConfig.nav) {
      const key = item.shortcut?.trim().split(/\s+/)[1]?.toLowerCase();
      if (key) {
        targets.set(key, {
          href: item.href,
          external: Boolean(item.external),
        });
      }
    }

    targets.set("c", {
      href: siteConfig.contactHref,
      external: false,
    });

    return targets;
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        chordStartedAt.current = 0;

        if (open) {
          setOpen(false);
        } else {
          const triggers = Array.from(
            document.querySelectorAll<HTMLElement>("[data-command-trigger]"),
          );
          restoreFocusRef.current =
            triggers.find((trigger) => trigger.offsetParent !== null) ?? null;
          setHasOpened(true);
          setOpen(true);
        }
        return;
      }

      if (open || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (key === "g") {
        chordStartedAt.current = Date.now();
        return;
      }

      if (
        chordStartedAt.current &&
        Date.now() - chordStartedAt.current <= 1000
      ) {
        const target = chordTargets.get(key);
        chordStartedAt.current = 0;

        if (target) {
          event.preventDefault();
          navigateTo(target.href, target.external);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chordTargets, open]);

  const contextValue = useMemo(() => ({ openPalette }), [openPalette]);

  return (
    <PaletteContext.Provider value={contextValue}>
      {children}
      {hasOpened ? (
        <Suspense fallback={null}>
          <CommandPaletteDialog
            open={open}
            onOpenChange={setOpen}
            restoreFocusRef={restoreFocusRef}
          />
        </Suspense>
      ) : null}
    </PaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error(
      "useCommandPalette must be used inside CommandPaletteProvider",
    );
  }
  return context;
}
