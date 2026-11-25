import type { Metadata } from "next";
import { ContentColumn, SiteFooter, SiteHeader } from "@/components/layout";

export const metadata: Metadata = {
  title: "Side Quest",
  description: "Under development.",
  alternates: { canonical: "/side-quest" },
};

export default function SideQuestPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <ContentColumn>
          <div className="flex min-h-[60dvh] items-center justify-center px-4 text-center">
            <p className="m-0 text-2xl font-medium tracking-[-0.01em]">Under development</p>
          </div>
        </ContentColumn>
      </main>

      <SiteFooter />
    </>
  );
}
