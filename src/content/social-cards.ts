import type { SocialPlatform } from "@/types/content";
import { profile } from "./profile";
import { socialLinks } from "./social";

/**
 * Configuration for the floating social dock and its hover preview cards.
 * Everything is derived from `profile` and `socialLinks`, so a handle or URL
 * only ever changes in one place.
 */

/** Everything the dock can show a preview card for. */
export type SocialCardPlatform = SocialPlatform | "email";

export interface SocialCard {
  platform: SocialCardPlatform;
  /** Accessible name for the dock button. */
  label: string;
  href: string;
  /** Opens in a new tab (profiles) rather than in place (`mailto:`). */
  external: boolean;
  /** Short display name, styled like a signature ("akshay."). */
  name: string;
  handle: string;
  designation: string;
  avatarUrl?: string;
}

const email =
  profile.overviewRight.find((item) => item.icon === "mail")?.copy ??
  "akshayvenugopal2002@gmail.com";

/** The first name, lower-cased with a full stop, e.g. "akshay.". */
const signature = `${(profile.displayName.split(" ")[0] ?? profile.displayName).toLowerCase()}.`;

const designation = "ai backend engineer.";

function cardFor(platform: SocialPlatform, formatHandle: (raw: string) => string): SocialCard {
  const link = socialLinks.find((entry) => entry.platform === platform);
  if (!link) throw new Error(`Missing social link for "${platform}" in content/social.ts`);
  return {
    platform,
    label: link.title,
    href: link.href,
    external: true,
    name: signature,
    handle: formatHandle(link.handle),
    designation,
    avatarUrl: profile.avatarUrl,
  };
}

/** Dock order, left to right. */
export const socialCards: readonly SocialCard[] = [
  cardFor("github", (raw) => `@${raw}`),
  cardFor("x", (raw) => (raw.startsWith("@") ? raw : `@${raw}`)),
  cardFor("linkedin", (raw) => `in/${raw}`),
  {
    platform: "email",
    label: "Email",
    href: `mailto:${email}`,
    external: false,
    name: signature,
    handle: email,
    // The email card shows this as its large wordmark.
    designation: "engineer.",
    avatarUrl: profile.avatarUrl,
  },
];
