"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { MobileMenu } from "@/components/mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig, type NavItem } from "@/config/site";
import { useIsMac } from "@/lib/client";
import { isNavItemActive, navigateTo } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function onSearchOpen() {
  // TODO: open the command palette / search dialog.
}

function GithubMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="currentColor"
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

function ActiveDot() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      data-testid="active-nav-dot"
      aria-hidden="true"
      layoutId="primary-nav-dot"
      className="absolute -bottom-1 left-1/2 -ml-0.5 size-1 rounded-full bg-foreground"
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 420, damping: 32, mass: 0.7 }
      }
    />
  );
}

function NavLink({
  item,
  pathname,
  projectsInView,
}: {
  item: NavItem;
  pathname: string;
  projectsInView: boolean;
}) {
  const active = isNavItemActive(item, pathname, projectsInView);
  const className = cn(
    "relative flex h-8 items-center rounded-sm text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:text-foreground",
    active
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground",
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {item.label}
        <span className="sr-only"> ({siteConfig.labels.opensInNewTab})</span>
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      prefetch={false}
      aria-current={active ? "page" : undefined}
      onClick={(event) => {
        event.preventDefault();
        navigateTo(item.href);
      }}
      className={className}
    >
      {item.label}
      {active ? <ActiveDot /> : null}
    </Link>
  );
}

function SearchButton() {
  const isMac = useIsMac();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        onSearchOpen();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <button
      type="button"
      aria-keyshortcuts="Control+K Meta+K"
      onClick={onSearchOpen}
      className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md pl-1.5 pr-1 text-muted-foreground transition-[color,background-color,scale] duration-150 ease-out hover:bg-chip hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.96]"
    >
      <span className="sr-only">Search</span>
      <Search aria-hidden="true" className="size-4" strokeWidth={1.75} />
      <span className="flex items-center gap-1">
        <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-[4px] border border-hairline bg-chip px-1.5 font-mono text-xs leading-none text-muted-foreground">
          {isMac ? "⌘" : "Ctrl"}
        </kbd>
        <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-[4px] border border-hairline bg-chip px-1.5 font-mono text-xs leading-none text-muted-foreground">
          K
        </kbd>
      </span>
    </button>
  );
}

function GitHubLink() {
  const { github } = siteConfig;
  const compactStars =
    github.starCount === undefined
      ? null
      : new Intl.NumberFormat("en-US", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(github.starCount);
  const accessibleStars =
    github.starCount === undefined
      ? github.label
      : `${github.label} — ${new Intl.NumberFormat("en-US", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(github.starCount)} stars`;

  return (
    <a
      href={github.href}
      aria-label={accessibleStars}
      className="flex h-8 items-center gap-1.5 rounded-md px-1.5 text-muted-foreground transition-[color,background-color,scale] duration-150 ease-out hover:bg-chip hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.96]"
    >
      <GithubMark />
      {compactStars ? (
        <span
          aria-hidden="true"
          className="flex items-center gap-1 text-xs font-medium tabular-nums"
        >
          <Star className="size-3" strokeWidth={1.75} />
          {compactStars}
        </span>
      ) : null}
    </a>
  );
}

function DesktopNav({ projectsInView }: { projectsInView: boolean }) {
  const pathname = usePathname();

  return (
    <div className="hidden items-center gap-3 md:flex">
      <nav aria-label="Primary" className="flex items-center gap-5">
        {siteConfig.nav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            projectsInView={projectsInView}
          />
        ))}
      </nav>

      <span aria-hidden="true" className="h-5 w-px bg-hairline" />
      <SearchButton />
      <span aria-hidden="true" className="h-5 w-px bg-hairline" />
      <GitHubLink />
      <span aria-hidden="true" className="h-5 w-px bg-hairline" />
      <ThemeToggle />
    </div>
  );
}

export function SiteHeader() {
  const [projectsInView, setProjectsInView] = useState(false);

  useEffect(() => {
    const projects = document.getElementById("projects");
    if (!projects) return;

    const observer = new IntersectionObserver(
      ([entry]) => setProjectsInView(entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(projects);
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-hairline bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-[var(--container-max)] items-center justify-between border-x border-hairline px-5">
        <Link
          href={siteConfig.homeHref}
          className="shrink-0 rounded-sm font-brand text-[2rem] leading-none tracking-[-0.01em] text-foreground transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {siteConfig.name}
        </Link>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <MobileMenu projectsInView={projectsInView} />
        </div>

        <DesktopNav projectsInView={projectsInView} />
      </div>
    </header>
  );
}
