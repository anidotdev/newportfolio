export type NavItem = {
  label: string;
  href: string;
};

export type SocialIcon = "x" | "github" | "linkedin" | "discord" | "youtube";

export type SocialLink = {
  label: string;
  icon: SocialIcon;
  href: string;
};

export type HeroConfig = {
  name: string;
  titles: string[];
  nameAudio?: string;
  avatar: string | null;
  avatarAlt: string;
  avatarInitials: string;
  verifiedLabel: string;
  playNameLabel: string;
  socialsLabel: string;
  socials: SocialLink[];
  socialNote: string;
};

export type BioSegment = {
  text: string;
  href?: string;
};

export type TechIconKey =
  | "python"
  | "go"
  | "javascript"
  | "cpp"
  | "aws"
  | "google-cloud";

export type TechItem = {
  name: string;
  icon: TechIconKey;
};

export type AboutConfig = {
  heading: string;
  bio: BioSegment[][];
  techLabel: string;
  techStackAriaLabel: string;
  techStack: TechItem[];
};

export type ProjectIconKey = "box" | "layers" | "terminal" | "globe";

export type ProjectPeriod = {
  /** Compact start date, for example `05.2025`. */
  start: string;
  /** Compact end date; omit for ongoing work. */
  end?: string;
};

export type ProjectIntroSegment = {
  text: string;
  href?: string;
};

export type Project = {
  id: string;
  name: string;
  icon: ProjectIconKey;
  period: ProjectPeriod;
  /** Absolute public URL. Omit to hide the external-link control. */
  url?: string;
  description?: string;
  /** Optional supporting sentence with inline links. */
  intro?: ProjectIntroSegment[];
  features?: string[];
  tags?: string[];
};

export type ProjectsConfig = {
  heading: string;
  countLabel: {
    one: string;
    other: string;
  };
  labels: {
    openProject: string;
    showDetails: string;
    hideDetails: string;
    period: string;
    features: string;
    tags: string;
  };
  projects: Project[];
};

export type SpotifyTrack = {
  title: string;
  artists: string[];
  url: string;
  albumArt: string | null;
};

export type SpotifyConfig = {
  fallback: SpotifyTrack;
  labels: {
    iconLabel: string;
    lastPlayed: string;
    nowPlaying: string;
    loading: string;
  };
};

type SiteConfig = {
  name: string;
  description: string;
  homeHref: string;
  nav: NavItem[];
  more: NavItem[];
  github: {
    label: string;
    href: string;
    starCount?: number;
  };
  hero: HeroConfig;
  about: AboutConfig;
  projects: ProjectsConfig;
  spotify: SpotifyConfig;
};

export const siteConfig: SiteConfig = {
  name: "Sam",
  description: "Software engineer and builder.",
  homeHref: "/",
  nav: [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Experience", href: "/experience" },
  ],
  more: [
    { label: "Blog", href: "/blog" },
    { label: "Skills", href: "/skills" },
    { label: "Contact", href: "/contact" },
  ],
  github: {
    label: "GitHub",
    href: "https://github.com/samworks",
    starCount: 2400,
  },
  hero: {
    name: "Samiran De",
    titles: ["Indie Hacker.", "Design Engineer.", "B.Tech CSE student."],
    // TODO: add a pronunciation clip, then set this to its public URL.
    nameAudio: undefined,
    // TODO: drop public/images/avatar.jpg here and use "/images/avatar.jpg".
    avatar: null,
    avatarAlt: "Samiran De",
    avatarInitials: "SD",
    verifiedLabel: "Verified",
    playNameLabel: "Play name pronunciation",
    socialsLabel: "Social links",
    socials: [
      // TODO: replace each placeholder URL with the real profile URL.
      { label: "X", icon: "x", href: "#" },
      { label: "GitHub", icon: "github", href: "#" },
      { label: "LinkedIn", icon: "linkedin", href: "#" },
      { label: "Discord", icon: "discord", href: "#" },
      { label: "YouTube", icon: "youtube", href: "#" },
    ],
    socialNote: "follow me",
  },
  about: {
    heading: "About",
    // TODO: replace with real bio.
    bio: [
      [
        {
          text: "Use this space for a short introduction: what you work on, how you approach problems, and the details you want a visitor to know first.",
        },
      ],
      [
        {
          text: "This bullet can explain how you collaborate and what you are exploring next. Replace the ",
        },
        {
          text: "sample link",
          href: "https://example.com",
        },
        {
          text: " with a real project, profile, or article.",
        },
      ],
      [
        {
          text: "A final short paragraph can cover interests outside work or a note about this site. Keep the copy specific, useful, and easy to replace.",
        },
      ],
    ],
    techLabel: "TECH STACK",
    techStackAriaLabel: "Tech stack",
    techStack: [
      { name: "Python", icon: "python" },
      { name: "Go", icon: "go" },
      { name: "JavaScript", icon: "javascript" },
      { name: "C++", icon: "cpp" },
      { name: "AWS", icon: "aws" },
      { name: "Google Cloud", icon: "google-cloud" },
    ],
  },
  projects: {
    heading: "Projects",
    countLabel: {
      one: "project",
      other: "projects",
    },
    labels: {
      openProject: "Open project",
      showDetails: "Show project details",
      hideDetails: "Hide project details",
      period: "Period",
      features: "Key features",
      tags: "Technologies",
    },
    // TODO: replace the placeholder entries below with real projects. Dates
    // use MM.YYYY and an omitted `end` renders as ongoing. Remove optional
    // fields that do not apply; empty lists and links are not rendered.
    projects: [
      {
        id: "placeholder-one",
        name: "Placeholder project one",
        icon: "layers",
        period: { start: "MM.YYYY" },
        url: "https://example.com",
        description:
          "Replace this paragraph with a concise project summary: the problem it solves, the part you owned, and the outcome a visitor should remember.",
        intro: [
          {
            text: "Use this optional sentence for context and a ",
          },
          {
            text: "sample link",
            href: "https://example.com",
          },
          {
            text: " to a case study or write-up.",
          },
        ],
        features: [
          "Replace this bullet with a key project feature.",
          "Add another bullet, or remove the list entirely.",
          "Keep each line short and concrete.",
        ],
        tags: ["Tag one", "Tag two", "Replace me"],
      },
      {
        id: "placeholder-two",
        name: "Placeholder project two",
        icon: "terminal",
        period: { start: "MM.YYYY", end: "MM.YYYY" },
        url: "https://example.com",
        description:
          "This entry has no feature list or introduction. Replace it with real work, real dates, and a working link.",
      },
      {
        id: "placeholder-three",
        name: "Placeholder project three",
        icon: "globe",
        period: { start: "MM.YYYY" },
        description:
          "This entry has no external link. Use it for private or internal work, or replace it with a real project.",
        features: [
          "Feature lists stay optional.",
          "The external-link control is hidden when no URL is configured.",
        ],
        tags: ["Tag one", "Replace me"],
      },
    ],
  },
  spotify: {
    fallback: {
      title: "Track title",
      artists: ["Artist name"],
      url: "https://open.spotify.com",
      albumArt: null,
    },
    labels: {
      iconLabel: "Spotify",
      lastPlayed: "Last played",
      nowPlaying: "Now Playing",
      loading: "Loading Spotify",
    },
  },
};

export const allNavItems: NavItem[] = [
  ...siteConfig.nav,
  ...siteConfig.more,
];
