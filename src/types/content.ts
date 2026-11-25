import type { IconName } from "@/lib/icons";

/**
 * Shape of every piece of portfolio content.
 *
 * Content is plain, serialisable data (no JSX, no component references) so the
 * `src/content` modules can later be swapped for a CMS or MDX loader without
 * touching a single component.
 */

/** A link that reveals a website-preview card on hover. */
export interface LinkPreview {
  /** Visible link text, also the accessible name. */
  label: string;
  href: string;
  /** Screenshot served from `public/`. */
  image: string;
  title: string;
  subtitle: string;
}

export interface OverviewItem {
  icon: IconName;
  /** Static label. Omit when `dynamic` supplies the value at runtime. */
  label?: string;
  /** Render in the mono face — used for "data-like" values. */
  mono?: boolean;
  href?: string;
  /** Click-to-copy: the raw text placed on the clipboard. */
  copy?: string;
  /** Values that cannot be known at build time. */
  dynamic?: "local-time";
  /** Appended after `label` as a hoverable link with a website preview. */
  preview?: LinkPreview;
}

export interface Profile {
  displayName: string;
  /** Avatar image served from `public/`. Omit to fall back to initials. */
  avatarUrl?: string;
  /**
   * Looping avatar video served from `public/`. When set it replaces the
   * image in the masthead; `avatarUrl` is then used as its poster frame.
   */
  avatarVideoUrl?: string;
  /** Rotating one-liners under the name. */
  flipSentences: string[];
  /** Bio paragraphs. `**bold**` spans render as underlined links. */
  bio: string[];
  /** IANA zone used by the live clock in the overview panel. */
  timeZone: string;
  /**
   * Abbreviation shown beside the clock. Optional — without it the zone name
   * comes from `Intl`, which renders many zones as a UTC offset ("GMT+5:30")
   * rather than the local abbreviation ("IST").
   */
  timeZoneLabel?: string;
  overview: OverviewItem[];
  overviewRight: OverviewItem[];
}

export type SocialPlatform = "github" | "strava" | "x" | "linkedin";

export interface SocialLink {
  title: string;
  handle: string;
  href: string;
  platform: SocialPlatform;
}

export interface TechStackGroup {
  category: string;
  items: string[];
}

export interface Role {
  title: string;
  employmentType: string;
  /** `MM.YYYY` */
  start: string;
  /** `MM.YYYY`, or `null` for "present". */
  end: string | null;
  duration: string;
  /** Open on first paint. */
  expanded: boolean;
  description: string[];
  skills: string[];
}

export interface Company {
  company: string;
  location: string;
  current: boolean;
  /** Makes the company name a link with a website-preview card. */
  preview?: LinkPreview;
  roles: Role[];
}

export interface EducationEntry {
  school: string;
  start: string;
  end: string | null;
  degree: string | null;
  field: string | null;
  /** `null` makes the row non-collapsible. */
  description: string[] | null;
  skills: string[];
}

export interface Project {
  title: string;
  start: string;
  end: string | null;
  link: string;
  expanded: boolean;
  description: string;
  bullets: string[];
  skills: string[];
}

/** Artwork used on a certification card; anything unknown falls back to `generic`. */
export type CertificationBrand = "aws" | "google" | "coursera" | "ibm" | "animations" | "generic";

export interface Certification {
  title: string;
  issuer: string;
  /** `DD.MM.YYYY` (printed as `Mon YYYY`) or already `Mon YYYY`. Empty while `upcoming`. */
  date: string;
  /** `upcoming` = still being earned: the card says "Coming soon" and has no link. */
  status?: "earned" | "upcoming";
  href: string;
  brand: CertificationBrand;
  /** Short lines printed on the card face (the full title sits below the card). */
  card: {
    headline: string;
    caption: string;
  };
}

/** GitHub-style contribution intensity, 0 (none) through 4 (most). */
export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

/** A single day in the contribution mosaic. */
export interface ContributionDay {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  count: number;
  level: ContributionLevel;
}

/** One entry per week, each holding seven days (oldest week first). */
export type ContributionWeeks = ContributionDay[][];

export interface NavItem {
  label: string;
  href: string;
}

/**
 * A top-level destination in the header's segmented switch. The site is two
 * parallel stories — the professional one and the training one — so pages are
 * modelled as siblings rather than as a hierarchy.
 */
export interface PageTab {
  label: string;
  href: string;
  /** Section links shown in the header (and command menu) while on this page. */
  sections: readonly NavItem[];
}
