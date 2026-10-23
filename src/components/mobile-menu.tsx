"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { isNavItemActive, navigateTo } from "@/lib/navigation";

export function MobileMenu({ projectsInView }: { projectsInView: boolean }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // A navigation from anywhere closes the panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-[color,background-color,scale] duration-150 ease-out hover:bg-chip hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.96]"
        >
          <Menu aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="top"
        showCloseButton={false}
        className="max-h-dvh gap-0 overflow-y-auto overscroll-contain border-0 bg-background p-0"
      >
        <SheetTitle className="sr-only">Site menu</SheetTitle>
        <SheetDescription className="sr-only">
          Links to every section of the site.
        </SheetDescription>

        <div className="mx-auto flex h-16 w-full max-w-[var(--container-max)] items-center justify-between border-b border-hairline px-5">
          <SheetClose asChild>
            <Link
              href={siteConfig.homeHref}
              className="rounded-sm font-brand text-[2rem] leading-none tracking-[-0.01em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {siteConfig.name}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <button
              type="button"
              aria-label="Close menu"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-[color,background-color,scale] duration-150 ease-out hover:bg-chip hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.96]"
            >
              <X
                aria-hidden="true"
                className="size-[18px]"
                strokeWidth={1.75}
              />
            </button>
          </SheetClose>
        </div>

        <nav
          aria-label="Primary"
          className="mx-auto flex w-full max-w-[var(--container-max)] flex-col px-5 pt-8 pb-10"
        >
          <p className="mb-3 text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">
            Navigation
          </p>
          <ul className="flex flex-col">
            {siteConfig.nav.map((item, index) => {
              const active = isNavItemActive(
                item,
                pathname,
                projectsInView,
              );
              const className = `flex min-h-11 items-center justify-between rounded-md px-3 text-base font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-chip ${
                active
                  ? "bg-chip text-foreground"
                  : "text-muted-foreground hover:bg-chip hover:text-foreground"
              }`;

              return (
                <motion.li
                  key={item.href}
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 12, filter: "blur(4px)" }
                  }
                  animate={
                    reduceMotion
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0, filter: "blur(0px)" }
                  }
                  transition={{
                    duration: 0.2,
                    ease: [0.2, 0, 0, 1],
                    delay: reduceMotion ? 0 : index * 0.04,
                  }}
                >
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className={className}
                    >
                      {item.label}
                      <span className="sr-only">
                        {" "}
                        ({siteConfig.labels.opensInNewTab})
                      </span>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      prefetch={false}
                      onClick={(event) => {
                        event.preventDefault();
                        setOpen(false);
                        navigateTo(item.href);
                      }}
                      aria-current={active ? "page" : undefined}
                      className={className}
                    >
                      {item.label}
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="size-1 rounded-full bg-foreground"
                        />
                      ) : null}
                    </Link>
                  )}
                </motion.li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
