import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SocialDock } from "@/components/layout";
import { siteConfig } from "@/content";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The site renders the light (white) theme by default: the `:root` tokens in
    // styles/tokens/colors.css. Adding `dark` to this className opts into the
    // `.dark` overrides, still with no flash since it lands in the SSR markup.
    <html lang="en" className={fontVariables}>
      {/* Bottom padding keeps the fixed social dock from covering the footer. */}
      <body className="pb-24">
        {children}
        <SocialDock />
      </body>
    </html>
  );
}
