"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  BookOpen,
  Contrast,
  Copy,
  Folder,
  Home,
  Mail,
} from "lucide-react";
import { useCommandState } from "cmdk";

import { BrandIcon } from "@/components/brand-icons";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { siteConfig } from "@/config/site";
import { isEditableTarget, navigateTo } from "@/lib/navigation";

type PaletteContextValue = {
  openPalette: (trigger?: HTMLElement | null) => void;
};

const PaletteContext = createContext<PaletteContextValue | null>(null);

type PaletteItem = {
  label: string;
  group: "Menu" | "Social" | "Actions";
  kind: "internal" | "external" | "action";
  href?: string;
  shortcut?: string;
  icon: ReactNode;
  action?: "copy-email" | "toggle-theme";
};

function isUsableHref(href?: string): href is string {
  return Boolean(href && href.trim() && href.trim() !== "#");
}

function PaletteFooter({ items }: { items: PaletteItem[] }) {
  const selectedValue = useCommandState((state) => state.value);
  const selected = items.find((item) => item.label === selectedValue);
  const hint =
    selected?.kind === "external"
      ? "Open link"
      : selected?.kind === "action"
        ? "Run command"
        : "Go to page";

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-t border-hairline px-4">
      <span className="font-brand text-lg leading-none text-foreground">
        {siteConfig.name}
      </span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{hint}</span>
        <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-[4px] border border-hairline bg-chip px-1.5 font-mono text-xs leading-none text-muted-foreground">
          ↵
        </kbd>
      </span>
    </div>
  );
}

function CommandPaletteDialog({
  open,
  onOpenChange,
  restoreFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restoreFocusRef: RefObject<HTMLElement | null>;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const items = useMemo<PaletteItem[]>(() => {
    const menu: PaletteItem[] = siteConfig.nav
      .filter((item) => isUsableHref(item.href))
      .map((item) => ({
        label: item.label,
        group: "Menu",
        kind: item.external ? "external" : "internal",
        href: item.href,
        shortcut: item.shortcut,
        icon:
          item.label === "Home" ? (
            <Home strokeWidth={1.75} />
          ) : item.label === "Projects" ? (
            <Folder strokeWidth={1.75} />
          ) : (
            <BookOpen strokeWidth={1.75} />
          ),
      }));

    menu.push({
      label: siteConfig.labels.contact,
      group: "Menu",
      kind: "internal",
      href: siteConfig.contactHref,
      shortcut: "G C",
      icon: <Mail strokeWidth={1.75} />,
    });

    const social: PaletteItem[] = siteConfig.hero.socials
      .filter((item) => isUsableHref(item.href))
      .map((item) => ({
        label: item.label,
        group: "Social",
        kind: "external",
        href: item.href,
        icon: <BrandIcon name={item.icon} className="size-5" />,
      }));

    const actions: PaletteItem[] = [
      {
        label: "Copy email",
        group: "Actions",
        kind: "action",
        action: "copy-email",
        icon: <Copy strokeWidth={1.75} />,
      },
      {
        label: "Toggle theme",
        group: "Actions",
        kind: "action",
        action: "toggle-theme",
        icon: <Contrast strokeWidth={1.75} />,
      },
    ];

    return [...menu, ...social, ...actions];
  }, []);

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      if (item.kind === "internal" || item.kind === "external") {
        if (item.href) navigateTo(item.href, item.kind === "external");
      } else if (item.action === "copy-email") {
        if (isUsableHref(siteConfig.email)) {
          void navigator.clipboard?.writeText(siteConfig.email).catch(() => {});
        }
      } else if (item.action === "toggle-theme") {
        setTheme(resolvedTheme === "light" ? "dark" : "light");
      }

      onOpenChange(false);
    },
    [onOpenChange, resolvedTheme, setTheme],
  );

  const groups: PaletteItem["group"][] = ["Menu", "Social", "Actions"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocusRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        <DialogDescription className="sr-only">
          Search pages, social links and actions. Use the arrow keys to move and
          Enter to select.
        </DialogDescription>

        <Command label="Command menu">
          <CommandInput
            placeholder="Type a command or search…"
            value={query}
            onValueChange={setQuery}
          />

          <div className="relative">
            <CommandList>
              <CommandEmpty>
                <p className="font-medium text-foreground">
                  No results for “{query}”.
                </p>
                <p className="mt-1 text-muted-foreground">
                  Try a page name, like projects.
                </p>
              </CommandEmpty>
              {groups.map((group) => {
                const groupItems = items.filter((item) => item.group === group);
                if (groupItems.length === 0) return null;

                return (
                  <CommandGroup key={group} heading={group}>
                    {groupItems.map((item) => (
                      <CommandItem
                        key={`${group}-${item.label}`}
                        value={item.label}
                        data-href={item.href}
                        data-kind={item.kind}
                        onSelect={() => handleSelect(item)}
                      >
                        <span className="flex size-5 items-center justify-center text-muted-foreground">
                          {item.icon}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                        {item.kind === "external" ? (
                          <ArrowUpRight
                            aria-hidden="true"
                            className="size-4 text-muted-foreground"
                            strokeWidth={1.75}
                          />
                        ) : item.shortcut ? (
                          <span
                            aria-hidden="true"
                            className="command-shortcut items-center gap-1"
                          >
                            {item.shortcut.split(/\s+/).map((letter) => (
                              <kbd
                                key={letter}
                                className="inline-flex h-5 min-w-5 items-center justify-center rounded-[3px] border border-hairline bg-chip px-1 font-mono text-xs leading-none text-muted-foreground"
                              >
                                {letter}
                              </kbd>
                            ))}
                          </span>
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-popover to-transparent"
            />
          </div>

          <PaletteFooter items={items} />
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function CommandPaletteProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const chordStartedAt = useRef(0);

  const openPalette = useCallback((trigger?: HTMLElement | null) => {
    if (trigger) restoreFocusRef.current = trigger;
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

  return (
    <PaletteContext.Provider value={{ openPalette }}>
      {children}
      <CommandPaletteDialog
        open={open}
        onOpenChange={setOpen}
        restoreFocusRef={restoreFocusRef}
      />
    </PaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error("useCommandPalette must be used inside CommandPaletteProvider");
  }
  return context;
}
