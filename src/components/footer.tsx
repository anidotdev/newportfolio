"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { SectionSeparator } from "@/components/section";
import { siteConfig, type FooterLink } from "@/config/site";
import { navigateTo } from "@/lib/navigation";

function FooterLinkItem({ link }: { link: FooterLink }) {
  const opensInNewTab = Boolean(link.external);
  const isMail = link.href.startsWith("mailto:");

  if (opensInNewTab) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {link.label}
        <span className="sr-only"> ({siteConfig.labels.opensInNewTab})</span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-3.5 opacity-60 motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
          strokeWidth={1.75}
        />
      </a>
    );
  }

  if (isMail) {
    return (
      <a
        href={link.href}
        className="rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link
      href={link.href}
      prefetch={false}
      onClick={(event) => {
        event.preventDefault();
        navigateTo(link.href);
      }}
      className="rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {link.label}
    </Link>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <nav aria-label={title}>
      <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <FooterLinkItem link={link} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function subscribeToNothing() {
  return () => {};
}

function getClientYear() {
  return new Date().getFullYear();
}

function getServerYear() {
  return null;
}

export function Footer() {
  const year = useSyncExternalStore(
    subscribeToNothing,
    getClientYear,
    getServerYear,
  );
  const reduceMotion = useReducedMotion();
  const { footer } = siteConfig;

  const navigateLinks: FooterLink[] = [
    ...siteConfig.nav,
    { label: siteConfig.labels.contact, href: siteConfig.contactHref },
  ];
  const socialLinks: FooterLink[] = siteConfig.hero.socials.map((social) => ({
    label: social.label,
    href: social.href,
    external: true,
  }));

  function backToTop() {
    const main = document.getElementById("main-content");
    main?.focus({ preventScroll: true });
    main?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <footer
      data-testid="site-footer"
      aria-labelledby="footer-heading"
      className="hero-grid relative w-full"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <SectionSeparator />

      <div className="col-[full] w-full border-b border-hairline">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-5 py-10">
          <div className="grid grid-cols-1 gap-8 min-[480px]:grid-cols-2 md:grid-cols-3">
            <FooterColumn
              title={footer.columnTitles.navigate}
              links={navigateLinks}
            />
            <FooterColumn
              title={footer.columnTitles.socials}
              links={socialLinks}
            />
            <FooterColumn
              title={footer.columnTitles.elsewhere}
              links={footer.elsewhere}
            />
          </div>
        </div>
      </div>

      <div className="col-[full] w-full">
        <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-3 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            ©{" "}
            <time dateTime={year ? String(year) : undefined}>
              {year ?? ""}
            </time>{" "}
            {siteConfig.ownerName}
          </p>
          <p>{footer.builtWith}</p>
          <button
            type="button"
            onClick={backToTop}
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-sm transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {footer.backToTop}
            <ArrowUp aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="col-[full] w-full overflow-hidden px-5 pb-3 pt-8">
        <p aria-hidden="true" className="footer-wordmark select-none whitespace-nowrap">
          {footer.wordmark}
        </p>
      </div>
    </footer>
  );
}
