export type NavItem = {
  label: string;
  href: string;
};

export type SocialIcon = "x" | "github" | "linkedin" | "discord" | "youtube";

export type InfoIcon =
  | "code"
  | "lightbulb"
  | "map-pin"
  | "mail"
  | "clock"
  | "phone";

export type SocialLink = {
  label: string;
  icon: SocialIcon;
  href: string;
};

export type InfoItem = {
  icon: InfoIcon;
  text: string;
  href?: string;
};

export type HeroConfig = {
  name: string;
  titles: string[];
  nameAudio?: string;
  banner: string | null;
  bannerAlt: string;
  bannerCaption: string;
  avatar: string | null;
  avatarAlt: string;
  avatarInitials: string;
  verifiedLabel: string;
  playNameLabel: string;
  socialsLabel: string;
  socials: SocialLink[];
  socialNote: string;
  infoLabel: string;
  info: {
    work: InfoItem;
    tagline: InfoItem;
    location: InfoItem;
    email: InfoItem;
    timeZone: string;
    timeLabels: {
      same: string;
      ahead: string;
      behind: string;
    };
    phone: InfoItem;
  };
  nextSectionsLabel: string;
  nextSectionsNote: string;
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

export type SpotifyTrack = {
  title: string;
  artists: string[];
  url: string;
  albumArt: string | null;
};

export type SpotifyConfig = {
  fallback: SpotifyTrack;
  labels: {
    lastPlayed: string;
    nowPlaying: string;
    synced: string;
    notSynced: string;
    loading: string;
    by: string;
    lastPlayedAria: string;
    nowPlayingAria: string;
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
    // TODO: drop public/images/banner.jpg here and use "/images/banner.jpg".
    banner: null,
    bannerAlt: "Samiran De's studio desk and projects.",
    bannerCaption: "Banner · 1960×520 · public/images/banner.jpg",
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
    infoLabel: "Profile details",
    info: {
      work: { icon: "code", text: "Design Engineer" },
      tagline: { icon: "lightbulb", text: "Indie Hacker" },
      location: { icon: "map-pin", text: "West Bengal, India" },
      email: {
        icon: "mail",
        // TODO: replace with the real email address.
        text: "hello@example.com",
        href: "mailto:hello@example.com",
      },
      timeZone: "Asia/Kolkata",
      timeLabels: {
        same: "same time",
        ahead: "ahead",
        behind: "behind",
      },
      phone: {
        icon: "phone",
        // TODO: replace with the real phone number.
        text: "+91 00000 00000",
        href: "tel:+910000000000",
      },
    },
    nextSectionsLabel: "Next sections",
    nextSectionsNote: "next sections go here",
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
  spotify: {
    fallback: {
      title: "Track title",
      artists: ["Artist name"],
      url: "https://open.spotify.com",
      albumArt: null,
    },
    labels: {
      lastPlayed: "Last played",
      nowPlaying: "Now playing",
      synced: "SYNCED",
      notSynced: "NOT SYNCED",
      loading: "Loading Spotify",
      by: "by",
      lastPlayedAria: "Last played on Spotify",
      nowPlayingAria: "Now playing on Spotify",
    },
  },
};

export const allNavItems: NavItem[] = [
  ...siteConfig.nav,
  ...siteConfig.more,
];
