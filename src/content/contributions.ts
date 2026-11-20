import { siteConfig } from "./site";

/**
 * GitHub accounts the contribution graph can show, in switch order. The first
 * one is shown by default.
 */
export const contributionAccounts = [
  {
    id: "work",
    label: "Work",
    username: "akshay-tnm",
    href: "https://github.com/akshay-tnm",
  },
  {
    id: "personal",
    label: "Personal",
    username: "akshayvenu",
    href: siteConfig.githubUrl,
  },
] as const;
