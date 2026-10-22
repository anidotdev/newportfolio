"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";

import { ProjectGlyph } from "@/components/project-icons";
import { SectionRow } from "@/components/section";
import { Button } from "@/components/ui/button";
import {
  siteConfig,
  type Project,
  type ProjectIntroSegment,
  type ProjectsConfig,
} from "@/config/site";
import { groupProjects } from "@/lib/projects.mjs";
import { cn } from "@/lib/utils";

const BODY_TEXT =
  "text-[15px] leading-[1.7333] text-foreground/90 md:text-base md:leading-[1.8]";

function formatPeriod(period: Project["period"]) {
  const end = period.end?.trim();
  if (!end) return `${period.start} – ∞`;
  if (end === period.start) return period.start;
  return `${period.start} – ${end}`;
}

function isExternalUrl(url?: string): url is string {
  return Boolean(url && /^https?:\/\//i.test(url));
}

function ProjectIntro({ segments }: { segments: ProjectIntroSegment[] }) {
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

function ProjectItem({
  project,
  open,
  onToggle,
  labels,
}: {
  project: Project;
  open: boolean;
  onToggle: (id: string) => void;
  labels: ProjectsConfig["labels"];
}) {
  const panelId = `project-panel-${project.id}`;
  const titleId = `project-title-${project.id}`;
  const url = isExternalUrl(project.url) ? project.url : null;
  const hasDetails = Boolean(
    project.description ||
      project.intro?.length ||
      project.features?.length ||
      project.tags?.length,
  );

  return (
    <div>
      <div className="relative flex items-center gap-3 px-5 py-4 md:py-5">
        <div
          data-testid="project-icon"
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-hairline bg-surface-subtle text-muted-foreground"
        >
          <ProjectGlyph icon={project.icon} className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            data-testid="project-title"
            className="text-[17px] font-semibold leading-snug tracking-[-0.01em] md:text-lg"
          >
            {hasDetails ? (
              <button
                id={titleId}
                type="button"
                aria-controls={panelId}
                aria-expanded={open}
                onClick={() => onToggle(project.id)}
                className="max-w-full break-words text-left text-balance after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {project.name}
              </button>
            ) : (
              <span id={titleId} className="block max-w-full break-words">
                {project.name}
              </span>
            )}
          </h3>

          <p
            data-testid="project-period"
            className="mt-1 font-mono text-[15px] leading-tight text-muted-foreground"
          >
            <span className="sr-only">{labels.period}: </span>
            <span data-testid="project-period-value">
              {formatPeriod(project.period)}
            </span>
          </p>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-0.5">
          {url ? (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              <a
                data-testid="project-link"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${labels.openProject}: ${project.name}`}
              >
                <ExternalLink aria-hidden="true" className="size-4" />
              </a>
            </Button>
          ) : null}

          {hasDetails ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-testid="project-disclosure"
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`${
                open ? labels.hideDetails : labels.showDetails
              }: ${project.name}`}
              onClick={() => onToggle(project.id)}
              className="text-muted-foreground"
            >
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 motion-safe:transition-transform motion-safe:duration-150",
                  open && "rotate-180",
                )}
              />
            </Button>
          ) : null}
        </div>
      </div>

      {hasDetails ? (
        <div
          id={panelId}
          data-testid="project-panel"
          role="region"
          aria-labelledby={titleId}
          aria-hidden={!open}
          inert={!open}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              data-testid="project-details"
              className="space-y-4 pb-5 pl-16 pr-5"
            >
              {project.description ? (
                <p
                  data-testid="project-description"
                  className={cn("break-words text-pretty", BODY_TEXT)}
                >
                  {project.description}
                </p>
              ) : null}

              {project.intro?.length ? (
                <p className={cn("break-words text-pretty", BODY_TEXT)}>
                  <ProjectIntro segments={project.intro} />
                </p>
              ) : null}

              {project.features?.length ? (
                <ul
                  data-testid="project-features"
                  aria-label={`${labels.features}: ${project.name}`}
                  className="flex flex-col gap-2.5"
                >
                  {project.features.map((feature, index) => (
                    <li key={index} className="flex">
                      <span
                        aria-hidden="true"
                        className="flex w-4 shrink-0 justify-start pt-[10.5px] md:pt-[12.5px]"
                      >
                        <span className="size-[5px] rounded-full bg-muted-foreground/60" />
                      </span>
                      <span className={cn("min-w-0 break-words", BODY_TEXT)}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {project.tags?.length ? (
                <ul
                  data-testid="project-tags"
                  aria-label={`${labels.tags}: ${project.name}`}
                  className="flex flex-wrap gap-2"
                >
                  {project.tags.map((tag, index) => (
                    <li key={index} className="flex">
                      <span className="inline-flex max-w-full break-words rounded-[4px] border border-hairline bg-surface-subtle px-2.5 py-1 font-mono text-[12px] leading-none text-muted-foreground md:text-[13px]">
                        {tag}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Projects() {
  const { projects: config } = siteConfig;
  const count = config.projects.length;
  const countLabel =
    count === 1 ? config.countLabel.one : config.countLabel.other;
  const { visible: visibleProjects, remaining: remainingProjects, hasMore } =
    groupProjects(config.projects);
  const [openId, setOpenId] = useState<string | null>(
    config.projects[0]?.id ?? null,
  );
  const [showAll, setShowAll] = useState(false);

  function toggle(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <section
      id="projects"
      data-testid="projects-section"
      aria-labelledby="projects-heading"
      className="hero-grid relative w-full"
    >
      <div
        data-testid="projects-shell"
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-full max-w-[var(--container-max)] -translate-x-1/2 border-x border-hairline"
      />

      <SectionRow className="flex h-12 items-center px-5 md:h-14">
        <h2
          id="projects-heading"
          className="section-title text-[32px] md:text-[34px]"
        >
          {config.heading}
          <sup
            aria-hidden="true"
            className="ml-0.5 font-sans text-[13px] font-medium leading-none text-muted-foreground md:text-sm"
          >
            ({count})
          </sup>
          <span className="sr-only">
            , {count} {countLabel}
          </span>
        </h2>
      </SectionRow>

      {visibleProjects.map((project) => (
        <SectionRow key={project.id}>
          <ProjectItem
            project={project}
            open={openId === project.id}
            onToggle={toggle}
            labels={config.labels}
          />
        </SectionRow>
      ))}

      {hasMore ? (
        <>
          <div
            id="projects-more"
            data-testid="projects-more"
            aria-hidden={!showAll}
            inert={!showAll}
            className={cn(
              "col-[full] grid transition-[grid-template-rows,opacity] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
              showAll
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              {remainingProjects.map((project) => (
                <SectionRow key={project.id}>
                  <ProjectItem
                    project={project}
                    open={openId === project.id}
                    onToggle={toggle}
                    labels={config.labels}
                  />
                </SectionRow>
              ))}
            </div>
          </div>

          <SectionRow
            bordered={false}
            className="flex justify-center px-5 pb-6 pt-5"
          >
            <Button
              type="button"
              variant="secondary"
              data-testid="projects-toggle"
              aria-expanded={showAll}
              aria-controls="projects-more"
              onClick={() => setShowAll((current) => !current)}
              className="h-[38px] gap-2.5 rounded-[9px] border-hairline px-4 text-base font-semibold"
            >
              <span>{showAll ? config.labels.showLess : config.labels.showMore}</span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 motion-safe:transition-transform motion-safe:duration-150",
                  showAll && "rotate-180",
                )}
              />
            </Button>
          </SectionRow>
        </>
      ) : null}
    </section>
  );
}
