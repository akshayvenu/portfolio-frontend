import type { Certification } from "@/types/content";

/**
 * Newest first. Earned credentials link to their public verify page; an
 * `upcoming` one is in progress and has no link yet.
 */
export const certifications: readonly Certification[] = [
  {
    title: "AWS Certified Solutions Architect – Associate",
    issuer: "Amazon Web Services",
    date: "",
    href: "#",
    brand: "aws",
    status: "upcoming",
    card: { headline: "Solutions Architect", caption: "Associate" },
  },
  {
    title: "Supervised Machine Learning: Classification",
    issuer: "IBM",
    date: "May 2025",
    href: "https://www.coursera.org/verify/D7WU2SV6UP5Y",
    brand: "ibm",
    card: { headline: "Supervised ML", caption: "Classification" },
  },
  {
    title: "Supervised Machine Learning: Regression",
    issuer: "IBM",
    date: "May 2025",
    href: "https://www.coursera.org/verify/SOY95OZ96DL9",
    brand: "ibm",
    card: { headline: "Supervised ML", caption: "Regression" },
  },
  {
    title: "Algorithms for Searching, Sorting, and Indexing",
    issuer: "Coursera",
    date: "Dec 2024",
    href: "https://www.coursera.org/verify/4GE25YJOFCH1",
    brand: "coursera",
    card: { headline: "Algorithms", caption: "Searching, Sorting & Indexing" },
  },
];
