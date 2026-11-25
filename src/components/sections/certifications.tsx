"use client";

import { useReducedMotion } from "motion/react";
import { Icon } from "@/components/icons";
import { Spotlight } from "@/components/motion-primitives/spotlight";
import { Tilt } from "@/components/motion-primitives/tilt";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui";
import { certifications } from "@/content";
import { cn } from "@/lib/utils";
import type { Certification, CertificationIssuer } from "@/types/content";

/** Same spring as the motion-primitives "Tilt with Spotlight" example. */
const SPRING = { stiffness: 26.7, damping: 4.1, mass: 0.2 };

/**
 * Each issuer scopes its brand hue into `--brand` so the face can reveal it on
 * hover without a per-issuer branch in every class list.
 */
const brandScope: Record<CertificationIssuer, string> = {
  ibm: "[--brand:var(--brand-ibm)]",
  coursera: "[--brand:var(--brand-coursera)]",
};

function IssuerWordmark({ issuer }: { issuer: CertificationIssuer }) {
  const base =
    "text-muted-foreground transition-colors duration-700 group-hover:text-(--brand) group-focus-visible:text-(--brand)";

  if (issuer === "ibm") {
    return (
      <span className={cn(base, "font-mono text-3xl leading-none font-black tracking-[0.22em]")}>
        IBM
      </span>
    );
  }

  return (
    <span className={cn(base, "font-sans text-2xl leading-none font-semibold tracking-tight")}>
      coursera
    </span>
  );
}

/**
 * The card face: a typographic credential rather than a photo. It sits muted
 * at rest and lets the issuer's colour bleed in under the spotlight on hover,
 * echoing the grayscale → colour reveal of the original demo.
 */
function CredentialFace({ cert, animate }: { cert: Certification; animate: boolean }) {
  return (
    <div
      className={cn(
        "relative flex aspect-[16/10] flex-col justify-between overflow-hidden rounded-lg border border-line bg-surface p-4",
        "shadow-[0_1px_0_0_var(--line),0_8px_24px_-16px_color-mix(in_oklab,var(--foreground)_30%,transparent)]",
        brandScope[cert.issuerKey],
      )}
    >
      {animate && (
        <Spotlight
          className="z-10 from-foreground/10 via-foreground/5 to-transparent blur-2xl dark:from-foreground/30 dark:via-foreground/10 dark:to-foreground/5"
          size={248}
          springOptions={SPRING}
        />
      )}

      <div aria-hidden="true" className="diagonal-stripes absolute inset-0 opacity-70" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_0%,color-mix(in_oklab,var(--brand)_18%,transparent),transparent_65%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-focus-visible:opacity-100"
      />

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <IssuerWordmark issuer={cert.issuerKey} />
          <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Course Certificate
          </span>
        </div>
        <Icon
          name="badge-check"
          size={18}
          className="text-muted-foreground transition-colors duration-700 group-hover:text-(--brand) group-focus-visible:text-(--brand)"
        />
      </div>

      <div className="relative flex items-center justify-between gap-3 border-t border-dashed border-line pt-2.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        <span>Credential ID</span>
        <span className="text-foreground/80 tabular-nums">{cert.credentialId}</span>
      </div>
    </div>
  );
}

function CertificationCard({ cert, animate }: { cert: Certification; animate: boolean }) {
  return (
    <a
      href={cert.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${cert.title} — ${cert.issuer}, ${cert.date} (verify credential, opens in a new tab)`}
      className="group block rounded-lg text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <Tilt
        rotationFactor={animate ? 6 : 0}
        isRevese
        style={{ transformOrigin: "center center" }}
        springOptions={SPRING}
        className="relative rounded-lg"
      >
        <CredentialFace cert={cert} animate={animate} />
      </Tilt>

      <div className="flex flex-col gap-0.5 pt-3">
        <p className="m-0 font-mono text-xs text-muted-foreground">
          {cert.issuer} · {cert.date}
        </p>
        <h3 className="m-0 flex items-start justify-between gap-2 text-base leading-[1.35] font-medium">
          {cert.title}
          <Icon
            name="arrow-up-right"
            size={15}
            className="mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
          />
        </h3>
      </div>
    </a>
  );
}

export function Certifications() {
  // `null` during SSR, so the tilt is on by default and switched off on the client if asked.
  const animate = !useReducedMotion();
  const hasFiller = certifications.length % 2 === 1;

  return (
    <Panel id="certifications" noBottomLine>
      <PanelHeader>
        <PanelTitle>
          Certifications
          <sup className="ml-0.5 text-[0.45em] font-normal text-muted-foreground">
            ({certifications.length})
          </sup>
        </PanelTitle>
      </PanelHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        {certifications.map((cert) => (
          <div key={cert.credentialId} className="border-b border-line p-4 sm:odd:border-r">
            <CertificationCard cert={cert} animate={animate} />
          </div>
        ))}

        {/* Keeps the two-up grid whole when the count is odd. */}
        {hasFiller && (
          <div
            aria-hidden="true"
            className="diagonal-stripes hidden border-b border-line sm:block"
          />
        )}
      </div>
    </Panel>
  );
}
