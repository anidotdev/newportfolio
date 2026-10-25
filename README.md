# Anidot personal website

A minimal, typography-first personal site built with Astro. The design uses a warm off-white light theme, a near-black dark theme, restrained serif headings, and a single reading column.

## Run locally

```sh
npm install
npm run dev
```

Open the local address printed by Astro. To verify the production build:

```sh
npm run build
```

## Where to edit things

- `src/config/site.ts` — name, tagline, location, notes URL, GitHub URL, email, résumé URL, and site description.
- `src/pages/index.astro` — homepage biography.
- `src/pages/projects/index.astro` — project descriptions.
- `src/content/blog/` — add Markdown articles.
- `src/styles/global.css` — global typography, spacing, colors, and responsive behavior.
- `public/images/avatar.svg` — placeholder identity image. Replace it with your own portrait and update `profileImage` in `src/config/site.ts`.

## Add a blog post

Create a Markdown file inside `src/content/blog/`, for example `first-post.md`:

```md
---
title: "A title that sounds like you"
description: "A one-sentence description."
pubDate: 2026-10-25
draft: true
tags: [systems]
---

Start writing here.
```

Set `draft: false` when it's ready to publish. Posts are sorted newest first and the collection schema validates frontmatter. Drafts are excluded from both the archive and generated article routes.

## Personal configuration still to review

- Replace the placeholder avatar with a photo or illustration you own.
- Add a public contact email if you want the email link to appear.
- Add a résumé URL if you want it linked.
- Set `PUBLIC_SITE_URL` to the actual production origin before deployment so canonical URLs can be generated.
- Review the project descriptions and homepage copy before publishing.

The notes site remains separate and is linked directly at <https://anidotdev.pages.dev/>. This project does not recreate or modify it.
