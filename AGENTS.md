<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portfolio — current state

Homepage for **Animesh Gautam** (`Ani`): sticky header, Kyoto Dusk hero, socials, compact
Spotify row, About/tech stack, Projects, contact form, and footer. Only one page; section
anchors are `/`, `/#projects`, and `/#contact`.

## Stack

- Next.js `16.4.2` App Router, React `19.3.0`, TypeScript, Tailwind v4, pnpm.
- `motion`, `next-themes`, `lucide-react`, shadcn/ui, `cmdk`, `radix-ui`, `@icons-pack/react-simple-icons`, `cn`, `ascii.rest`.
- Fonts: Inter, Geist Mono, Instrument Serif, Caveat (`--font-hand`).
- Playwright + `@axe-core/playwright`; Spotify and Resend credentials are server-only.

## Commands

`pnpm dev`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm start`.
`pnpm check:header`, `check:hero`, `check:palette`, `check:about`, `check:projects`,
`check:contact`, and `check:footer` need `http://localhost:3000`. `pnpm spotify:token`
prints a refresh token; see `docs/spotify-setup.md` and `docs/contact-setup.md`.

## File map

| Path | Responsibility |
| --- | --- |
| `src/app/{layout,page}.tsx` | Fonts/providers/metadata; hero, About, Projects, Contact, Footer, `#main-content`, `#page-end`, blur |
| `src/app/globals.css` | Tokens, `.hero-grid`, smooth scroll, `.footer-wordmark`, reduced motion |
| `src/components/{site-header,mobile-menu}.tsx` | Sticky nav, active dot, palette trigger, mobile Sheet |
| `src/components/command-palette.tsx` | Ctrl/⌘+K palette, groups, G chords, focus restore |
| `src/components/ui/{dialog,command}.tsx` | Local Radix dialog and cmdk primitives |
| `src/lib/navigation.ts` | External/hash navigation, active-state and editable-target helpers |
| `src/components/hero.tsx` | Banner, avatar, identity/title, social row, Spotify placement |
| `src/components/kyoto-dusk-banner.tsx` | Decorative Kyoto Dusk canvas, centre-cropped |
| `src/components/spotify-status.tsx` | Polling row, fallback, track link |
| `src/components/about.tsx` | About rows, bio, tech stack |
| `src/components/projects.tsx`, `src/lib/projects.mjs` | Project rows/details, dates, show-more split |
| `src/components/{contact,contact-form,copy-email-button}.tsx` | Contact shell, channels, copy, form states |
| `src/components/footer.tsx` | Link columns, client year, back to top, wordmark |
| `src/components/section.tsx` | Full-bleed `SectionRow` and hatch `SectionSeparator` |
| `src/config/site.ts` | All copy, nav, contact, footer, project, Spotify fallback |
| `src/lib/spotify.ts`, `src/app/api/spotify/route.ts` | Server Spotify data and API |
| `src/app/api/contact/route.ts`, `docs/*.md`, `.env.example` | Contact API, setup docs, env template |

## Layout and tokens

- `--container-max: 768px`; header inner, `.hero-grid` container track, and section shells align.
- `.hero-grid` uses named `full`/`container` lines; full-bleed content goes through `SectionRow`. Never use `100vw`.
- The social row is 78px with 40px icon links. The Spotify row sits inside the container below it (`-mt-2 pb-4`), left aligned; long text truncates.
- Banner is `h-40 md:h-[260px]`; the 2:1 Kyoto Dusk canvas is centre-cropped. Its wrapper is `aria-hidden`/`pointer-events-none`; `ascii.rest` pauses off screen, scales for `devicePixelRatio`, and holds one frame under reduced motion.
- About rows are full-bleed with `px-5`; the shell overlay draws unbroken hairlines. Hatch separators are 32px with border-y.
- Projects starts with a 48/56px heading row and one `SectionRow` per project. Rows use a 32px icon tile, 12px gap, 18px semibold name, 15px mono date, and 32px shared `Button` icon controls.
- Dates use thin-space en dashes: `MM.YYYY – Present` or `MM.YYYY – MM.YYYY`; the accessible label says `from … to present`. Never use infinity.
- The first three projects show initially. `#projects-more` stays mounted but is `inert`/`aria-hidden` when collapsed; the 38px Show more/less button toggles it without changing the open project.
- Contact has a full-bleed heading row and a two-panel grid from 700px. Panels use 16px gap, channel rows are 64px, and the form/success/not-configured boxes share `min-h-[560px]`.
- Contact inputs are 16px on mobile and 14px from `sm`; labels, `required`, field errors, `aria-invalid`, and focus-first-error are wired.
- Footer starts with a hatch separator, then Navigate/Socials/Elsewhere columns (3 at `md`, 2 from 480px, 1 at mobile), the base row, and the oversized wordmark.
- Footer wordmark uses `--footer-wordmark`, `clamp(4rem, 18vw, 14rem)`, `line-height: .78`, and a clipped wrapper. Its colour still meets 3:1 for large text in both themes.
- The footer year is client-side (`useSyncExternalStore`). Back to top focuses `#main-content` and scrolls smoothly unless reduced motion is requested.
- Tokens: `--background`, `--foreground`, `--muted-foreground`, `--hairline`, `--chip`, `--ring`, `--popover`, `--container-max`, `--surface-*`, `--hatch`, `--blur-veil`, `--spotify-playing`, `--status-available`, `--footer-wordmark`, `--font-hand`, brand tokens. Use semantic classes.
- Theme is class-based, dark default, system disabled; AA contrast is verified. Projects/Contact use `scroll-mt-20` (header 64px + 16px); there is no global scroll padding, which would double the offset.

## Behaviour and content

- Nav is Home, Projects (`/#projects`), Blog (Medium, new tab), and Contact (`/#contact`). Blog is external with `noopener noreferrer` and an sr-only new-tab note. The active dot is Home/Projects via IntersectionObserver; Blog is never active.
- Ctrl/⌘+K opens the config-driven palette. It has Menu/Social/Actions groups, searchable cmdk items, G H/P/B/C chords outside editable fields, Radix focus trap/restore, an empty state, and footer action hints.
- Project title/disclosure controls share the 32px `Button`; external links sit above the row overlay and never toggle. Details render only for non-empty fields. Icons are `Link`, `ChevronsUpDown`, and `ChevronsDownUp`.
- Contact form posts to `/api/contact`, validates on blur/submit, supports Ctrl/⌘+Enter, has a honeypot, and covers success, 400 field errors, 429, 502, and 503 not-configured states. Copy email uses a polite live region.
- The contact API always returns JSON: `200`, `400`, `429`, `502`, or `503`. It validates/rate-limits (five per IP per hour) before the Resend env check, sends via `POST https://api.resend.com/emails` with `reply_to`, and never logs message contents.
- `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` are server-only in `.env.local`; missing values produce `not_configured` plus a `mailto:` fallback. Spotify keys are `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`.
- Bio, tech names, socials, project data, contact copy, and footer copy live in `src/config/site.ts`. Do not reintroduce the old profile information grid.
- Replace the contact email (`hello@example.com`), `cal.com/your-handle`, and the Medium placeholder (`https://medium.com/@your-handle`) before launch. Project entries are still placeholders with `MM.YYYY` dates and `example.com` URLs; replace names, dates, copy, links, features, and tags.
- Banner art is `kyoto-dusk` from `ascii.rest/pieces/kyoto-dusk` (MIT, © bas3line), native 200×100 at 15 fps. Do not approximate, recolour, or screenshot it. `hero.avatar` is the only image setting; null renders `SD`.
- All Playwright page tests stub `**/api/spotify` and `**/api/contact`; never call real Spotify/Resend. Do not commit credentials; `.env*` is ignored except `.env.example`.

## Verification

Last verified 2026-10-23: `pnpm typecheck`, `pnpm lint`, `pnpm build`, and all seven checks pass.
Coverage: header/nav; palette; hero/Spotify/banner; About; projects/show-more; contact form/API;
footer columns/year/back-to-top. Checks run at 1440/1024/768/390, with contact/footer also at
320; axe runs in light/dark, and reduced motion/overflow/stubs are covered. `check:hero` reads
the social count from config rather than hardcoding it.
