export type NavItem = {
  label: string;
  href: string;
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
};

export const allNavItems: NavItem[] = [
  ...siteConfig.nav,
  ...siteConfig.more,
];
