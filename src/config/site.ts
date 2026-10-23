export type NavItem = {
  label: string;
  href: string;
  /** Opens in a new tab when true. */
  external?: boolean;
  /** Keyboard chord shown in the command palette, for example `G H`. */
  shortcut?: string;
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
    showMore: string;
    showLess: string;
    period: string;
    periodAria: string;
    present: string;
    presentAria: string;
    features: string;
    tags: string;
  };
  projects: Project[];
};

export type ContactChannel = {
  id: "email" | "call" | "x";
  icon: "mail" | "calendar" | "x";
  label: string;
  hint: string;
  href: string;
  external: boolean;
};

export type ContactTopic = {
  value: string;
  label: string;
};

export type ContactConfig = {
  heading: string;
  intro: string;
  getInTouch: string;
  sendMessage: string;
  channels: ContactChannel[];
  copyEmail: {
    button: string;
    copied: string;
    announcement: string;
    failed: string;
  };
  availability: {
    status: "open" | "closed";
    text: string;
    replyTime: string;
  };
  form: {
    topicLabel: string;
    topics: ContactTopic[];
    labels: {
      name: string;
      email: string;
      message: string;
    };
    placeholders: {
      name: string;
      email: string;
      message: string;
    };
    errors: {
      name: string;
      nameLong: string;
      email: string;
      emailLong: string;
      emailFormat: string;
      message: string;
      messageShort: string;
      messageLong: string;
      topic: string;
    };
    counterLabel: string;
    submit: string;
    sending: string;
    successTitle: string;
    successBody: string;
    sendAnother: string;
    error: string;
    rateLimited: string;
    notConfigured: string;
    openEmailApp: string;
    emailSubject: string;
    emailBody: string;
  };
};

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterConfig = {
  columnTitles: {
    navigate: string;
    socials: string;
    elsewhere: string;
  };
  elsewhere: FooterLink[];
  builtWith: string;
  backToTop: string;
  wordmark: string;
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
  ownerName: string;
  description: string;
  homeHref: string;
  contactHref: string;
  email: string;
  labels: {
    contact: string;
    opensInNewTab: string;
  };
  nav: NavItem[];
  github: {
    label: string;
    href: string;
    starCount?: number;
  };
  hero: HeroConfig;
  about: AboutConfig;
  projects: ProjectsConfig;
  contact: ContactConfig;
  footer: FooterConfig;
  spotify: SpotifyConfig;
};

// TODO: replace with your real contact email.
const CONTACT_EMAIL = "hello@example.com";
// TODO: replace with the final Medium URL.
// Placeholder: https://medium.com/@your-handle
const BLOG_URL = "https://medium.com/@anidotdev";

export const siteConfig: SiteConfig = {
  name: "Ani",
  ownerName: "Animesh Gautam",
  description: "Software engineer and builder.",
  homeHref: "/",
  contactHref: "/#contact",
  email: CONTACT_EMAIL,
  labels: {
    contact: "Contact",
    opensInNewTab: "opens in new tab",
  },
  nav: [
    { label: "Home", href: "/", shortcut: "G H" },
    { label: "Projects", href: "/#projects", shortcut: "G P" },
    {
      label: "Blog",
      href: BLOG_URL,
      external: true,
      shortcut: "G B",
    },
  ],
  github: {
    label: "GitHub",
    href: "https://github.com/anidotdev",
    starCount: 2400,
  },
  hero: {
    name: "Animesh",
    titles: ["Indie Hacker.", "Data / ML Engineer.", "B.Tech CSE student."],
    // TODO: add a pronunciation clip, then set this to its public URL.
    nameAudio: undefined,
    // TODO: drop public/images/avatar.jpg here and use "/images/avatar.jpg".
    avatar: "/images/avatar.jpg",
    avatarAlt: "Animesh Gautam",
    avatarInitials: "AG",
    verifiedLabel: "Verified",
    playNameLabel: "Play name pronunciation",
    socialsLabel: "Social links",
    socials: [
      // TODO: replace each placeholder URL with the real profile URL.
      { label: "X", icon: "x", href: "https://x.com/anidotdev" },
      { label: "GitHub", icon: "github", href: "https://github.com/anidotdev" },
      { label: "LinkedIn", icon: "linkedin", href: "https://www.linkedin.com/in/anidotdev/" },
    ],
    socialNote: "follow me",
  },
  about: {
    heading: "About",
    // TODO: replace with real bio.
    bio: [
      [
        {
          text: "I'm a CSE student interested in Machine Learning, Data Engineering, and how things work under the hood. I like building things, breaking them, and figuring out why they work the way they do.",
        },
      ],
      [
        {
          text: "Currently exploring LLM inference, performance, and low-level systems concepts, while building projects and writing about what I learn. ",
        },
        {
          text: "Github",
          href: "https://github.com/anidotdev",
        },
        {
          text: " is where most of my projects live.",
        },
      ],
      [
        {
          text: "Outside of tech, I enjoy writing, watching football, and travelling whenever I get the chance.",
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
      openProject: "Open",
      showDetails: "Expand",
      hideDetails: "Collapse",
      showMore: "Show more",
      showLess: "Show less",
      period: "Period",
      periodAria: "from {start} to {end}",
      present: "Present",
      presentAria: "present",
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
      {
        id: "placeholder-four",
        name: "Placeholder project four",
        icon: "box",
        period: { start: "MM.YYYY" },
        description:
          "This project starts hidden behind Show more. Replace the placeholder with real work and keep the list ordered by recency.",
        features: [
          "Progressive disclosure keeps the initial list compact.",
          "The hidden rows stay inert until they are revealed.",
        ],
        tags: ["Tag one", "Replace me"],
      },
      {
        id: "placeholder-five",
        name: "Placeholder project five",
        icon: "layers",
        period: { start: "MM.YYYY", end: "MM.YYYY" },
        url: "https://example.com",
        description:
          "This project also starts hidden. Add or remove entries in siteConfig.projects.projects; the control adapts to the list length.",
        tags: ["Tag one", "Tag two"],
      },
    ],
  },
  contact: {
    heading: "Let's work together",
    // TODO: replace with your own introduction.
    intro: "Tell me what you're working on, and I'll get back to you.",
    getInTouch: "Get in touch",
    sendMessage: "Send a message",
    channels: [
      {
        id: "email",
        icon: "mail",
        label: "Email",
        hint: CONTACT_EMAIL,
        href: `mailto:${CONTACT_EMAIL}`,
        external: false,
      },
      {
        id: "call",
        icon: "calendar",
        label: "Book a call",
        // TODO: replace with your real booking link and call length.
        hint: "30 minute intro call",
        href: "https://cal.com/your-handle",
        external: true,
      },
      {
        id: "x",
        icon: "x",
        label: "DM on X",
        hint: "@anidotdev",
        href: "https://x.com/anidotdev",
        external: true,
      },
    ],
    copyEmail: {
      button: "Copy email",
      copied: "Copied",
      announcement: "Email copied",
      failed: "Couldn't copy. Select the address instead.",
    },
    availability: {
      // TODO: update when your availability changes.
      status: "open",
      text: "Open to internships and freelance work",
      replyTime: "Usually replies in 1–2 days",
    },
    form: {
      topicLabel: "What is this about?",
      topics: [
        { value: "project", label: "Project" },
        { value: "internship", label: "Internship or job" },
        { value: "hello", label: "Just saying hi" },
      ],
      labels: {
        name: "Name",
        email: "Email",
        message: "Message",
      },
      placeholders: {
        name: "Your name",
        email: "you@example.com",
        message: "Tell me what you have in mind",
      },
      errors: {
        name: "Enter your name.",
        nameLong: "Use 100 characters or fewer.",
        email: "Enter your email address.",
        emailLong: "Use 200 characters or fewer.",
        emailFormat: "Enter an email address like name@example.com.",
        message: "Write a message.",
        messageShort: "Use at least 10 characters.",
        messageLong: "Use 2,000 characters or fewer.",
        topic: "Choose a valid topic.",
      },
      counterLabel: "characters used",
      submit: "Send message",
      sending: "Sending…",
      successTitle: "Message sent",
      successBody: "Thanks, {name}. I'll reply to {email} soon.",
      sendAnother: "Send another",
      error: "Couldn't send your message. Try again, or email me directly.",
      rateLimited: "Too many messages. Try again later, or email me directly.",
      notConfigured:
        "Messages can't be sent from this site yet. You can send it from your own email app instead.",
      openEmailApp: "Open email app",
      emailSubject: "Portfolio message from {name}",
      emailBody: "Name: {name}\nEmail: {email}\nTopic: {topic}\n\n{message}",
    },
  },
  footer: {
    columnTitles: {
      navigate: "Navigate",
      socials: "Socials",
      elsewhere: "Elsewhere",
    },
    elsewhere: [
      { label: "Medium", href: BLOG_URL, external: true },
      { label: "Email", href: `mailto:${CONTACT_EMAIL}` },
    ],
    builtWith: "Built with Next.js and Tailwind CSS",
    backToTop: "Back to top",
    wordmark: "Animesh",
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

