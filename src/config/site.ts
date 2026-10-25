/**
 * Personal site details live here so the layout stays easy to edit.
 */
export const site = {
  wordmark: 'anidotdev',
  name: 'Animesh Gautam',
  tagline: 'ML, systems, and the things I’m figuring out',
  profileImage: '/images/avatar.jpg',
  profileImageAlt: 'Anidot wordmark avatar',
  location: 'Delhi NCR, India',
  timezone: 'Asia/Kolkata',
  timezoneLabel: 'IST',
  notesUrl: '/notes/',
  githubUrl: 'https://github.com/anidotdev',
  email: 'anidotdev@gmail.com',
  resumeUrl: '',
  siteUrl: import.meta.env.PUBLIC_SITE_URL ?? '',
  description:
    'I write about machine learning, systems programming and anything else that excites me.',
} as const;

export const navigation = [
  { label: 'blog', href: '/blog/' },
  { label: 'notes', href: site.notesUrl },
  { label: 'components', href: '/components/' },
  { label: 'github', href: site.githubUrl, external: true },
  ...(site.email ? [{ label: 'email', href: `mailto:${site.email}` }] : []),
] as const;
