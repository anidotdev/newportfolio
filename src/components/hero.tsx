import Image from "next/image";
import { BrandIcon } from "@/components/brand-icons";
import { AvatarMascot } from "@/components/hero-mascot";
import { HeroIdentityContent } from "@/components/hero-identity-content";
import { KyotoDuskBanner } from "@/components/kyoto-dusk-banner";
import { SocialNote } from "@/components/hero-social-note";
import { SpotifyStatus } from "@/components/spotify-status";
import { siteConfig } from "@/config/site";

function Banner() {
  return (
    <div className="col-[container] px-2.5 pt-1.5">
      <div className="relative">
        <div
          data-testid="hero-banner"
          className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-[2px] bg-muted md:h-[260px]"
        >
          <KyotoDuskBanner />
        </div>
      </div>
    </div>
  );
}

function Avatar({ mascotReady }: { mascotReady: boolean }) {
  const { hero } = siteConfig;

  return (
    <div
      data-testid="hero-avatar"
      role="group"
      aria-label="Profile portrait"
      className="absolute left-2.5 -top-10 size-24 overflow-hidden rounded-full border border-hairline bg-background md:-top-[68px] md:size-40"
    >
      {mascotReady ? (
        <AvatarMascot />
      ) : hero.avatar ? (
        <Image
          src={hero.avatar}
          alt={hero.avatarAlt}
          fill
          preload
          sizes="(max-width: 767px) 96px, 160px"
          className="object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center font-mono text-xl font-medium tracking-[0.08em] text-muted-foreground">
          {hero.avatarInitials}
        </span>
      )}
    </div>
  );
}

function Identity({ mascotReady }: { mascotReady: boolean }) {
  const { hero } = siteConfig;
  const identity = {
    name: hero.name,
    titles: hero.titles,
    nameAudio: hero.nameAudio,
    verifiedLabel: hero.verifiedLabel,
    playNameLabel: hero.playNameLabel,
  };

  return (
    <div
      data-testid="hero-identity"
      className="relative col-[container] h-14 md:h-[92px]"
    >
      <Avatar mascotReady={mascotReady} />
      <HeroIdentityContent hero={identity} />
    </div>
  );
}

function Socials() {
  const { hero } = siteConfig;

  return (
    <div className="col-[full]">
      <div className="relative mx-auto w-full max-w-[var(--container-max)] px-5">
        <div className="relative flex h-[78px] items-center">
          <SocialNote text={hero.socialNote} />
          <nav aria-label={hero.socialsLabel}>
            <ul className="flex items-center gap-2.5">
              {hero.socials.map((social) => (
                <li key={social.label}>
                  <a
                    data-testid="social-link"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-10 items-center justify-center rounded-[8px] border border-hairline bg-surface-subtle text-muted-foreground transition-[color,background-color,scale] duration-150 ease-out hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.96]"
                  >
                    <BrandIcon name={social.icon} className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="-mt-2 pb-4">
          <SpotifyStatus />
        </div>
      </div>
    </div>
  );
}

export function Hero({ mascotReady = false }: { mascotReady?: boolean }) {
  return (
    <section
      aria-labelledby="profile-name"
      className="hero-grid relative w-full"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-full max-w-[var(--container-max)] -translate-x-1/2 border-x border-hairline"
      />

      <Banner />
      <Identity mascotReady={mascotReady} />

      <div
        data-testid="hero-hatch"
        aria-hidden="true"
        className="col-[full] h-10 w-full border-y border-hairline"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent 0 4px, var(--hatch) 4px 5px)",
        }}
      />

      <Socials />
    </section>
  );
}
