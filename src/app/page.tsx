import { BottomBlur } from "@/components/bottom-blur";
import { Hero } from "@/components/hero";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="relative w-full">
        <Hero />

        <section
          aria-label={siteConfig.hero.nextSectionsLabel}
          className="mx-auto w-full max-w-[var(--container-max)] border-x border-hairline px-5 py-10"
        >
          <div className="flex min-h-[60vh] items-center justify-center rounded-[2px] border border-dashed border-hairline">
            <p className="px-4 text-center font-mono text-xs text-muted-foreground">
              {siteConfig.hero.nextSectionsNote}
            </p>
          </div>
        </section>

        <div id="page-end" aria-hidden="true" className="h-px w-full" />
      </main>
      <BottomBlur />
    </>
  );
}
