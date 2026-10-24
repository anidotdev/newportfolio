import { existsSync } from "node:fs";
import path from "node:path";

import { About } from "@/components/about";
import { BottomBlur } from "@/components/bottom-blur";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Projects } from "@/components/projects";
import { SiteHeader } from "@/components/site-header";

const MASCOT_DIRECTIONS = path.join(
  process.cwd(),
  "public",
  "mascots",
  "lain-directions.webp",
);
const MASCOT_REACTIONS = path.join(
  process.cwd(),
  "public",
  "mascots",
  "lain-reactions.webp",
);

export default function Home() {
  // Build-time check: only render the inline mascot when both sprite sheets exist,
  // so missing assets never leave an empty clickable target beside the name.
  const mascotReady =
    existsSync(MASCOT_DIRECTIONS) && existsSync(MASCOT_REACTIONS);

  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative w-full scroll-mt-20"
      >
        <Hero mascotReady={mascotReady} />
        <About />
        <Projects />
        <Contact />
      </main>
      <Footer />
      <div id="page-end" aria-hidden="true" className="h-px w-full" />
      <BottomBlur />
    </>
  );
}
