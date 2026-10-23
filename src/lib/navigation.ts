import type { NavItem } from "@/config/site";

export function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    target.matches("input, textarea, select, [contenteditable='true']")
  );
}

export function isNavItemActive(
  item: NavItem,
  pathname: string,
  projectsInView: boolean,
) {
  if (item.external) return false;

  if (item.href === "/") {
    return pathname === "/" && !projectsInView;
  }

  if (item.href === "/#projects") {
    return pathname === "/" && projectsInView;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function navigateTo(href: string, external = isExternalHref(href)) {
  if (typeof window === "undefined") return;

  if (external) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }

  if (!href.startsWith("/") && !href.startsWith("#")) {
    window.location.href = href;
    return;
  }

  const target = new URL(href, window.location.origin);
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const behavior = reduceMotion ? "auto" : "smooth";

  if (target.pathname !== window.location.pathname) {
    window.location.assign(href);
    return;
  }

  const hash = target.hash.replace(/^#/, "");

  if (hash) {
    document.getElementById(hash)?.scrollIntoView({ behavior, block: "start" });
    window.history.replaceState(null, "", href);
    return;
  }

  window.scrollTo({ top: 0, behavior });
  window.history.replaceState(null, "", target.pathname);
}
