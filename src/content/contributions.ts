import { siteConfig } from "./site";

/** GitHub account the contribution graph is fetched for. */
export const contributionUser = "akshayvenu";

/** Profile link shown under the graph. */
export const contributionSource = {
  href: siteConfig.githubUrl,
} as const;
