<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portfolio — current state

Homepage for **Samiran De**: sticky header, hero/profile with a Kyoto Dusk banner, socials,
a compact Spotify status row, About with bio and tech stack, and a Projects list that shows
three entries before expanding.

## Stack

- Next.js `16.4.2` App Router, React `19.3.0`, TypeScript, Tailwind v4, pnpm.
- `motion`, `next-themes`, `lucide-react`, shadcn/ui, `@icons-pack/react-simple-icons`, `cn`, `ascii.rest`.
- Fonts: Inter, Geist Mono, Instrument Serif, Caveat (`--font-hand`).
- Playwright + `@axe-core/playwright`; Spotify credentials are server-only.

## Commands

`pnpm dev`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm start`.
`pnpm check:header`, `check:hero`, `check:about`, and `check:projects` need a server on
`http://localhost:3000`. `pnpm spotify:token` prints a refresh token; see `docs/spotify-setup.md`.

## File map

| Path | Responsibility |
| --- | --- |
| `src/app/{layout,page}.tsx` | Fonts/provider; hero + About + Projects; blur sentinel |
| `src/app/globals.css` | Tokens, `.hero-grid`, `.section-title`, reduced motion |
| `src/components/{site-header,mobile-menu}.tsx` | Sticky header, mobile Sheet |
| `src/components/hero.tsx` | Banner frame, avatar, identity/title, social row, Spotify placement |
| `src/components/kyoto-dusk-banner.tsx` | Decorative Kyoto Dusk canvas, centre-cropped in the banner |
| `src/components/spotify-status.tsx` | Compact polling row, fallback, track link |
| `src/components/about.tsx` | About rows, bio, tech stack |
| `src/components/projects.tsx` | Projects heading, accordion rows, links, optional content, show-more control |
| `src/lib/projects.mjs` | `INITIAL_VISIBLE_PROJECTS` and `groupProjects()` visibility split |
| `src/components/project-icons.tsx` | `ProjectIconKey` to Lucide glyph map |
| `src/components/section.tsx` | Full-bleed `SectionRow` and hatch `SectionSeparator` |
| `src/components/tech-icons.tsx`, `icons/aws.tsx` | Brand glyph map and AWS glyph |
| `src/config/site.ts` | Brand/nav, hero/socials, About, Projects, Spotify fallback/labels |
| `src/lib/spotify.ts`, `app/api/spotify/route.ts` | Server token/track data and API |
| `scripts/check-*.mjs`, `scripts/spotify-token.mjs`, `docs/spotify-setup.md`, `.env.example` | Checks, token helper, setup, env template |

## Layout and tokens

- `--container-max: 768px`; header inner, `.hero-grid` container track, About/Projects shells align.
- `.hero-grid` switches at `min-width: 768px` to `[full-start] 1fr [container-start] var(--container-max) [container-end] 1fr [full-end]`; below it, both named lines share one fluid column.
- Full-bleed elements use `col-[full]` through `SectionRow`; central content uses the shared container. Never use `100vw`.
- The social row is 78px with 40px icon links. The Spotify row sits inside the 768px shell below it (`-mt-2 pb-4`), left aligned: 16px green glyph, 12px mono muted status, 12px hairline dash, 14px track/artist text; long text truncates.
- Banner frame is `h-40 md:h-[260px]`; the 2:1 Kyoto Dusk canvas fills its width, centre-cropped vertically behind the avatar. Its wrapper is `aria-hidden` and `pointer-events-none`; `ascii.rest` pauses off screen/hidden, scales for `devicePixelRatio`, and holds one frame under reduced motion.
- About rows are full-bleed with `px-5`; the shell overlay draws unbroken hairlines. About has three rows: heading, bio, tech; the second hatch separator closes it.
- Projects starts with its own full-bleed heading row (bottom hairline) and one `SectionRow` per project. The first three configured projects show initially; when more exist, a centered `Show more`/`Show less` button follows the list and reveals the rest. Row hairlines span the viewport; icons, text, and controls stay in the shared container.
- Project rows use a 32px icon tile, 12px gap, 18px semibold name, 15px mono date, and 32px shared `Button` icon controls. Expanded details align under the info column (`pl-16`) and never create a card.
- Extra projects stay mounted in a grid-height/opacity wrapper (`#projects-more`) that is `inert`/`aria-hidden` when collapsed. The toggle uses the shared secondary `Button`: 38px high, 9px radius, `border-hairline`, 16px semibold text, 16px chevron, 10px gap, 20px above and 24px below; it exposes `aria-expanded`/`aria-controls` and does not change which project is open.
- Hatch separators are 32px full-bleed with border-y; the heading row is 48/56px and tech is borderless.
- Bio 15/26px mobile, 16/30px desktop, max 75ch; 5px muted bullets; underlined links. Project copy 15/26px mobile, 16/28.8px desktop.
- Tech glyphs 40/44px; mono uppercase label; hover scale 1.08; 11px pointer label. Add via `TechIconKey`/`TECH_ICONS`.
- Existing tokens: `--background`, `--foreground`, `--muted-foreground`, `--hairline`, `--chip`, `--ring`, `--popover`, `--container-max`; plus `--surface-subtle`/`--surface-strong`/`--surface-hover`, `--hatch`, `--blur-veil`, `--font-hand`, brand tokens, and `--spotify-playing`. Use semantic classes.
- Theme is class-based, dark default, system disabled; AA contrast is verified.

## Content, projects, Spotify

- All copy, tech names, socials, project data, and placeholders live in `src/config/site.ts`. Do not reintroduce the old profile information grid.
- `Project` fields: `id`, `name`, `icon` (`ProjectIconKey`), `period: { start, end? }`, optional `url`, `description`, `intro` (text/link segments), `features`, and `tags`. Add entries to `siteConfig.projects.projects`; the heading count follows the full array, while `src/lib/projects.mjs` splits the first three visible from the rest.
- Current project entries are clearly marked placeholders (`MM.YYYY` dates, `example.com` URL) and need real names, dates, copy, links, features, and tags. The Show more control is omitted at three or fewer projects; labels live in `projects.labels`.
- The first project starts open; only one opens at a time. Clicking an open title/disclosure closes it. External links sit above the row overlay and never toggle. Details render only for non-empty optional fields.
- Reuse the shared shadcn `Button` (`variant="ghost"`, `size="icon"`) with Lucide `ChevronDown`/`ExternalLink`; label both controls, expose `aria-expanded`/`aria-controls`, and keep focus rings. The panel is a labelled `region` using grid-height/opacity transitions and `inert` when closed.
- Bio is generic placeholder copy with one `https://example.com` link; replace it.
- Banner art is `kyoto-dusk` from `ascii.rest/pieces/kyoto-dusk` (MIT, © bas3line), mounted at its native 200×100, 15 fps. Do not approximate, recolour, or screenshot it. `hero.avatar` is the only image setting; null renders `SD`; set `hero.nameAudio` to show the pronunciation control.
- Spotify credentials are server-only in `.env.local`: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`. Missing/failed data renders `siteConfig.spotify.fallback` without claiming live playback.
- The API always returns 200 JSON and caches 30s. `cacheComponents` forbids route `dynamic`; it uses `await connection()` and builds dynamic. The row polls every 60s, pauses hidden, aborts stale requests, and labels the icon `Spotify`; album art is not rendered, so `i.scdn.co` is not configured.
- All Playwright page tests stub `**/api/spotify`; never call the real Spotify API. Do not commit credentials; `.env*` is ignored except `.env.example`.

## Next: Experience section

Build Experience below Projects in the same shell, preserving `#main-content`, `.hero-grid`, the
hero/About/Projects contracts, and the full-bleed hairline conventions. Do not redesign header/hero;
add real routes only when nav destinations should work.

## Verification

Last verified 2026-10-22: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `check:header`, `check:about`,
and `check:projects` pass. `check:hero` still expects five social links; config has three.
`check:projects` covers 1440/1024/768/390, count/heading, full-bleed rows, the three-project limit,
Show more/less expansion and collapse, chevron reversal, the <=3 helper branch, keyboard/ARIA/focus,
light/dark axe, reduced motion, and overflow. `check:hero` covers the banner, palette, Spotify states,
overflow/axe/stubs; `check:about` covers three rows, no card/caption/art, tech order, and hairlines.
