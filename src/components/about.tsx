import { SectionRow, SectionSeparator } from "@/components/section";
import { TechGlyph } from "@/components/tech-icons";
import { siteConfig, type BioSegment } from "@/config/site";

function BioText({ segments }: { segments: BioSegment[] }) {
  return (
    <>
      {segments.map((segment, index) => {
        if (!segment.href) return <span key={index}>{segment.text}</span>;

        const external =
          segment.href.startsWith("https://") ||
          segment.href.startsWith("http://");

        return (
          <a
            key={index}
            href={segment.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="underline decoration-foreground/40 decoration-1 underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-foreground"
          >
            {segment.text}
          </a>
        );
      })}
    </>
  );
}

function TechStack() {
  const { about } = siteConfig;

  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {about.techLabel}
      </p>
      <ul
        aria-label={about.techStackAriaLabel}
        className="mt-4 flex flex-wrap gap-5"
      >
        {about.techStack.map((item) => (
          <li
            key={item.name}
            data-testid="tech-item"
            className="group relative flex size-10 items-center justify-center md:size-11"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] leading-none text-muted-foreground opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-150"
            >
              {item.name}
            </span>
            <span className="sr-only">{item.name}</span>
            <TechGlyph
              name={item.icon}
              className="motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-hover:scale-[1.08]"
            />
          </li>
        ))}
      </ul>
    </>
  );
}

export function About() {
  const { about } = siteConfig;

  return (
    <section
      data-testid="about-section"
      aria-labelledby="about-heading"
      className="hero-grid relative w-full"
    >
      <div
        data-testid="about-shell"
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-full max-w-[var(--container-max)] -translate-x-1/2 border-x border-hairline"
      />

      <SectionSeparator />

      <SectionRow className="flex h-12 items-center px-5 md:h-14">
        <h2 id="about-heading" className="section-title">
          {about.heading}
        </h2>
      </SectionRow>

      <SectionRow className="px-5 py-5">
        <ul
          data-testid="about-bio"
          className="flex max-w-[75ch] flex-col gap-2.5"
        >
          {about.bio.map((bullet, index) => (
            <li key={index} className="flex">
              <span
                aria-hidden="true"
                className="flex w-5 shrink-0 justify-start pt-[10.5px] md:pt-[12.5px]"
              >
                <span className="size-[5px] rounded-full bg-muted-foreground/60" />
              </span>
              <span
                data-testid="about-bio-text"
                className="min-w-0 text-[15px] leading-[1.7333] text-foreground/90 md:text-base md:leading-[1.875]"
              >
                <BioText segments={bullet} />
              </span>
            </li>
          ))}
        </ul>
      </SectionRow>

      <SectionRow className="px-5 py-5" bordered={false}>
        <TechStack />
      </SectionRow>

      <SectionSeparator />
    </section>
  );
}
