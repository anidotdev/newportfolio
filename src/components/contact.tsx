import {
  ArrowUpRight,
  Calendar,
  Clock3,
  Mail,
} from "lucide-react";

import { BrandIcon } from "@/components/brand-icons";
import { ContactForm } from "@/components/contact-form";
import { CopyEmailButton } from "@/components/copy-email-button";
import { SectionRow, SectionSeparator } from "@/components/section";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

function ChannelIcon({ icon }: { icon: "mail" | "calendar" | "x" }) {
  if (icon === "x") {
    return <BrandIcon name="x" className="size-5" />;
  }

  if (icon === "calendar") {
    return <Calendar aria-hidden="true" className="size-5" strokeWidth={1.75} />;
  }

  return <Mail aria-hidden="true" className="size-5" strokeWidth={1.75} />;
}

export function Contact() {
  const { contact } = siteConfig;
  const emailChannel = contact.channels.find((channel) => channel.id === "email");

  return (
    <section
      id="contact"
      data-testid="contact-section"
      aria-labelledby="contact-heading"
      className="hero-grid relative w-full scroll-mt-20"
    >
      <SectionSeparator />

      <SectionRow className="flex h-14 items-center px-5">
        <h2
          id="contact-heading"
          className="section-title text-[32px] md:text-[34px]"
        >
          {contact.heading}
        </h2>
      </SectionRow>

      <SectionRow bordered={false} className="px-5 pb-8 pt-6">
        <div className="grid gap-4 min-[700px]:grid-cols-2">
          <div
            data-testid="contact-panel-left"
            className="flex h-full min-w-0 flex-col rounded-2xl border border-hairline bg-surface-subtle p-5"
          >
            <h3 className="text-lg font-semibold tracking-[-0.01em]">
              {contact.getInTouch}
            </h3>
            <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
              {contact.intro}
            </p>

            <ul className="mt-5">
              {contact.channels.map((channel, index) => (
                <li
                  key={channel.id}
                  className={cn(
                    "flex min-h-16 items-center gap-2",
                    index < contact.channels.length - 1 &&
                      "border-b border-hairline",
                  )}
                >
                  <a
                    href={channel.href}
                    target={channel.external ? "_blank" : undefined}
                    rel={channel.external ? "noopener noreferrer" : undefined}
                    className="group flex min-w-0 flex-1 items-center gap-3 py-2 text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <ChannelIcon icon={channel.icon} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold leading-5 text-foreground">
                        {channel.label}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] leading-5 text-muted-foreground">
                        {channel.hint}
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
                      strokeWidth={1.75}
                    />
                    {channel.external ? (
                      <span className="sr-only">
                        {" "}
                        ({siteConfig.labels.opensInNewTab})
                      </span>
                    ) : null}
                  </a>

                  {channel.id === "email" && emailChannel ? (
                    <CopyEmailButton email={siteConfig.email} />
                  ) : null}
                </li>
              ))}
            </ul>

            <div className="mt-auto border-t border-hairline pt-4">
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    contact.availability.status === "open"
                      ? "status-dot bg-status-available"
                      : "bg-muted-foreground",
                  )}
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-5">
                    {contact.availability.text}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] leading-5 text-muted-foreground">
                    <Clock3
                      aria-hidden="true"
                      className="size-3.5 shrink-0"
                      strokeWidth={1.75}
                    />
                    <span>{contact.availability.replyTime}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            data-testid="contact-panel-right"
            className="flex h-full min-w-0 flex-col rounded-2xl border border-hairline bg-surface-subtle p-5"
          >
            <h3 className="text-lg font-semibold tracking-[-0.01em]">
              {contact.sendMessage}
            </h3>
            <ContactForm />
          </div>
        </div>
      </SectionRow>
    </section>
  );
}
