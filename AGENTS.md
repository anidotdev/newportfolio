<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portfolio — current state

Homepage for **Samiran De**: sticky header, hero/profile with socials and a compact
Spotify status row, and About with bio, tech stack, and a temporary next-sections spacer.

## Stack

- Next.js `16.4.2` App Router, React `19.3.0`, TypeScript, Tailwind v4, pnpm.
- `motion`, `next-themes`, `lucide-react`, shadcn/ui, `@icons-pack/react-simple-icons`, `cn`.
- Fonts: Inter, Geist Mono, Instrument Serif, Caveat (`--font-hand`).
- Playwright + `@axe-core/playwright`; Spotify credentials are server-only.

## Commands

`pnpm dev`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm start`.
`pnpm check:header`, `pnpm check:hero`, and `pnpm check:about` need a server on
`http://localhost:3000`. `pnpm spotify:token` prints a refresh token; see
`docs/spotify-setup.md`.

## File map

| Path | Responsibility |
| --- | --- |
| `src/app/{layout,page}.tsx` | Fonts/provider; hero + About; blur sentinel |
| `src/app/globals.css` | Tokens, `.hero-grid`, `.section-title`, reduced motion |
| `src/components/{site-header,mobile-menu}.tsx` | Sticky header, mobile Sheet |
| `src/components/hero.tsx` | Banner, avatar, identity/title, social row, Spotify placement |
| `src/components/spotify-status.tsx` | Compact polling row, fallback, track link |
| `src/components/about.tsx` | About rows, bio, tech stack, temporary spacer |
| `src/components/section.tsx` | Full-bleed `SectionRow` and hatch `SectionSeparator` |
| `src/components/tech-icons.tsx`, `icons/aws.tsx` | Brand glyph map and AWS glyph |
| `src/config/site.ts` | Brand/nav, hero/socials, About, Spotify fallback/labels |
| `src/lib/spotify.ts`, `app/api/spotify/route.ts` | Server token/track data and API |
| `scripts/check-*.mjs`, `scripts/spotify-token.mjs` | Layout/a11y checks and token helper |
| `docs/spotify-setup.md`, `.env.example` | Spotify setup and env template |

## Layout and tokens

- `--container-max: 768px`; header inner, `.hero-grid` container track, and About shell align.
- `.hero-grid` switches at `min-width: 768px` to `[full-start] 1fr [container-start]
  var(--container-max) [container-end] 1fr [full-end]`. Below it, both named lines share
  one fluid column. Full-bleed elements use `col-[full]`; central content uses `col-[container]`.
- The social row is 78px with five 40px icon links. The Spotify row sits inside the same
  768px shell directly below it (`-mt-2 pb-4`), aligned left. It uses a 16px Spotify green
  glyph, 12px mono muted status, a 12px hairline dash, and 14px track/artist text with 8px
  gaps; no card/background/border/caption, long text truncates, and the link opens Spotify.
- About rows are full-bleed; inner content caps at 768px with `px-5`; the shell overlay
  draws unbroken hairlines. About has four rows: heading, bio, tech, spacer.
- When changing `--container-max`, keep hairlines, hatch separators, and full-bleed rows
  edge-to-edge; narrow only the central track. Never use `100vw` for full-bleed elements.
- Hatch separators are 32px full-bleed with border-y; the heading row is 48/56px and tech is borderless.
- Bio 15/26px mobile, 16/30px desktop, max 75ch; 5px muted bullets; underlined links.
- Tech glyphs 40/44px; mono uppercase label; hover scale 1.08; 11px pointer label. Add via `TechIconKey`/`TECH_ICONS`.
- Existing tokens: `--background`, `--foreground`, `--muted-foreground`, `--hairline`,
  `--chip`, `--ring`, `--popover`, `--container-max`. New: `--surface-subtle` /
  `--surface-strong` / `--surface-hover`, `--hatch`, `--blur-veil`, `--font-hand`,
  brand tokens, and `--spotify-playing`. Use semantic classes, not color literals.
- Theme is class-based, dark default, system disabled; AA contrast is verified.

## Content and Spotify

- All copy, tech names, socials, and placeholders live in `src/config/site.ts`. The old
  profile information grid and its time/email/phone config are removed; do not reintroduce.
- Bio is generic placeholder copy with one `https://example.com` link; replace it.
- Add `public/images/banner.jpg` (1960x520) and `avatar.jpg`, then set
  `hero.banner = "/images/banner.jpg"` and `avatar = "/images/avatar.jpg"`. Null renders
  the caption and `SD` placeholder. Set `hero.nameAudio` to show pronunciation.
- Spotify credentials are server-only in `.env.local`: `SPOTIFY_CLIENT_ID`,
  `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`. Missing/failed data renders the
  fallback track from `siteConfig.spotify.fallback` without claiming live playback.
- The API always returns 200 JSON and caches 30s. `cacheComponents` forbids route
  `dynamic`; the API uses `await connection()` and builds dynamic.
- The compact row polls every 60s, pauses when hidden, aborts stale requests, and labels
  the icon `Spotify`; album art is no longer rendered, so `i.scdn.co` is not configured.
- All Playwright page tests stub `**/api/spotify`; never call the real Spotify API.
- Do not commit credentials; `.env*` is ignored except `.env.example`.

## Next: Projects section

Build Projects below About in the same shell. Keep `#main-content`, `.hero-grid`, the
hero/About contracts, and the temp spacer until replaced. Do not redesign header/hero.
Add real routes only when nav destinations should work.

## Verification

Last verified 2026-10-22: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:header`,
`pnpm check:hero`, and `pnpm check:about` pass. `check:hero` covers 1440/1024/768/390,
removed info, social/Spotify placement, playing/last/failure, links, overflow, light/dark
axe, and API stubs. `check:about` covers four rows, no old card/caption/art, tech order,
spacer, and hairlines.
