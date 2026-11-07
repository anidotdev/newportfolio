/**
 * All copy for the /writer page lives here.
 *
 * Edit this file to change the page without touching any markup.
 * Anything marked TODO(animesh) is placeholder copy that should be
 * replaced with something true and specific before this page goes live.
 */

export interface WriterNavLink {
  label: string;
  href: string;
}

export interface WriterHeroHeadline {
  before: string;
  emphasis: string;
  after: string;
}

export interface WriterWorkEntry {
  tag: string;
  title: string;
  context: string;
  href?: string;
}

export interface WriterProseSegment {
  text: string;
  emphasis?: boolean;
}

export interface WriterProseParagraph {
  segments: WriterProseSegment[];
}

export interface WriterProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface WriterTestimonial {
  quote: string;
  name: string;
  role: string;
}

const workEntries: WriterWorkEntry[] = [
  {
    tag: "Copy",
    title: "Placeholder — founder POV series",
    context:
      "Eight posts built from one recorded call, in the founder's own voice.",
  },
  {
    tag: "Copy",
    title: "Placeholder — developer tool launch",
    context:
      "A problem-first landing page and launch note for one release.",
  },
  {
    tag: "Technical article",
    title: "Placeholder — deep-dive on a hard problem",
    context:
      "An engineering design doc turned into a public explainer a newcomer can follow.",
  },
  {
    tag: "Copy",
    title: "Placeholder — seed-round narrative",
    context:
      "The founder's point of view on why the company exists, edited down to something human.",
  },
  {
    tag: "Copy",
    title: "Placeholder — product announcement",
    context:
      "Changelog, email and social copy for a release that needed to sound like a step change.",
  },
  {
    tag: "Technical article",
    title: "Placeholder — customer case study",
    context:
      "One customer interview turned into a technical story with the numbers kept honest.",
  },
];

// TODO(animesh): tighten or replace these two paragraphs with your own wording.
const whatIWriteParagraphs: WriterProseParagraph[] = [
  {
    segments: [
      { text: "Most of my work is " },
      { text: "founder posts for X and LinkedIn", emphasis: true },
      { text: ", " },
      { text: "landing pages and launch copy", emphasis: true },
      { text: ", and " },
      { text: "long technical articles", emphasis: true },
      { text: " that a smart engineer would actually finish." },
    ],
  },
  {
    segments: [
      {
        text: "I don't work from a menu. If something needs to be explained clearly to a technical reader, or a founder has a point of view that isn't getting out, tell me the problem and I'll say honestly whether I'm the right person.",
      },
    ],
  },
];


const testimonials: WriterTestimonial[] = [];

export const writer = {
  meta: {
    title: "Animesh Gautam — Ghostwriter & copywriter for tech startups",
    description:
      "Ghostwriting, product copy and technical long form for founders and startups building hard things. A developer who writes.",
    ogTitle: "Animesh Gautam — Ghostwriter & copywriter for tech startups",
    ogDescription:
      "Founder ghostwriting, product copy and technical long form for startups building hard things.",
    themeColor: "#013691",
  },

  person: {
    name: "Animesh Gautam",
    wordmark: "Animesh Gautam",
  },

  nav: {
    links: [
      { label: "Work", href: "#work" },
      { label: "What I write", href: "#what-i-write" },
      { label: "Process", href: "#process" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ] satisfies WriterNavLink[],
    portfolio: { label: "Portfolio", href: "/" },
    menuLabel: "Menu",
  },

  hero: {
    headline: {
      before: "Technical writing that sounds like the ",
      emphasis: "founder",
      after: " who built it.",
    } satisfies WriterHeroHeadline,
    subheading:
      "I'm a developer, and I write. Ghostwriting and copywriting built for tech startups and founders: posts that sound like you, copy that makes your product clear, and technical writing you can trust to hold up.",
    primaryCta: { label: "Start a project", href: "#contact", glyph: "↗" },
    secondaryCta: { label: "See the work", href: "#work", glyph: "↓" },
    imageAlt: "",
  },

  work: {
    heading: "Selected work",
    intro:
      "A short selection of ghostwriting, product copy and technical pieces. The shape of the work matters more than the logo.",
    note: "....",
    entries: workEntries,
  },

  whatIWrite: {
    heading: "What I write",
    paragraphs: whatIWriteParagraphs,
    cta: {
      label: "Tell me what you're building",
      href: "#contact",
      glyph: "↓",
    },
  },

  process: {
    heading: "From conversation to published",
    intro:
      "Here's how we go from a rough idea to something worth putting out into the world.",
    steps: [
      {
        number: "01",
        title: "Understand",
        description:
          "We start with a conversation. I learn about your work, your audience, and what you want to say. I also go through whatever material you already have.",
      },
      {
        number: "02",
        title: "Find the angle",
        description:
          "Before writing, we figure out what the piece is really about. What's the point? Why should anyone care? We get that right before moving ahead.",
      },
      {
        number: "03",
        title: "Draft & refine",
        description:
          "I put together the first draft and we work through it. You tell me what feels off, what's missing, and what needs changing. We keep at it until it sounds right.",
      },
      {
        number: "04",
        title: "Ship",
        description:
          "Once everything is in place, I prepare the final piece for its intended platform. You get the finished copy, ready to publish.",
      },
    ] satisfies WriterProcessStep[],
  },

  pointOfView: {
    statement: {
      before:
        "Most technical copy doesn't fail because it's unclear. It fails because it starts with the ",
      emphasis: "product",
      after: " instead of the problem.",
    },
    beforeLabel: "Before",
    beforeCopy:
      "Our database engine uses adaptive query execution, intelligent caching, and automated index optimization to improve query performance.",
    afterLabel: "After",
    afterCopy:
      "A query that takes 12 seconds today shouldn't take 12 seconds tomorrow. Our engine adjusts execution plans, caches frequently accessed data, and optimizes indexes as your workload changes.",
    closing:
      "Same technology. A clearer explanation of what it does, when it matters, and why someone would want it.",
    note: "An illustrative rewrite, not client work.",
  },

  // TODO(animesh): rewrite these paragraphs with your own specifics and any
  // experience you want to cite. Keep every claim verifiable.
  about: {
    heading: "A developer who writes.",
    paragraphs: [
      "I'm Animesh Gautam. I'm a developer at heart. My time goes into ML, systems, and the unglamorous side of building software. I write about what I learn along the way.",
      "That combination is the entire pitch. Technical founders don't need someone who waters down their work into marketing speak. They need someone who can follow the argument, ask the obvious question, and then write the version that makes a stranger care.",
      "I write in your voice, not mine. The goal is a piece you'd be comfortable putting your name on, because your name is exactly what's on it.",
    ],
    // TODO(animesh): keep, change or remove these details. They are not claims
    // about results, just practical notes about how you work.
    details: [
      { label: "Based in", value: "Delhi NCR, India" },
      { label: "Working with", value: "Teams remotely" },
      { label: "Best fit", value: "Technical founders and product teams" },
    ],
  },

  // Rendered only when this array has at least one item.
  testimonials: {
    heading: "What it's like to work together",
    items: testimonials,
  },

  contact: {
    heading: "Have something worth explaining?",
    intro:
      "Tell me what you're building and what needs to be written. I read every note myself and reply within two working days.",
    formNote: "This form opens your email app. Nothing is sent from this page.",
    fields: {
      name: { label: "Name", placeholder: "Your name", autocomplete: "name" },
      workEmail: {
        label: "Work email",
        placeholder: "you@company.com",
        autocomplete: "email",
      },
      company: {
        label: "Company or site",
        placeholder: "company.com",
        autocomplete: "organization",
      },
      service: { label: "What do you need?" },
      message: {
        label: "The brief",
        placeholder:
          "What are you building, who is it for, and what needs writing?",
      },
    },
    serviceOptions: [
      "Not sure yet / something else",
      "Founder ghostwriting",
      "Product or launch copy",
      "Technical article or long-form",
    ],
    submitLabel: "Draft the email",
    submitGlyph: "↗",
    statusOpening: "Opening your email app…",
    statusMissing: "Add a few details first, then try again.",
    directLabel: "Or reach me directly",
    // TODO(animesh): keep or replace this address with a dedicated writing address.
    email: "anidotdev@gmail.com",
    // TODO(animesh): replace with your real X profile URL and handle.
    x: { label: "@your-handle", href: "https://x.com/your-handle" },
  },

  footer: {
    backLabel: "Back to the portfolio",
    backGlyph: "↗",
  },
};
