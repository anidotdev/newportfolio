import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-[200vh] w-full max-w-[var(--container-max)] border-x border-hairline px-5 py-10"
      >
        <h1 className="sr-only">{siteConfig.name} — Portfolio</h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Scroll to test the sticky header and its backdrop blur. This area is
          placeholder content for the navbar build.
        </p>
        <div aria-hidden="true" className="mt-12 space-y-10">
          {Array.from({ length: 40 }, (_, index) => (
            <div key={index} className="h-px w-full bg-hairline" />
          ))}
        </div>
      </main>
    </>
  );
}
