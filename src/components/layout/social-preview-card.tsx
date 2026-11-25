"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { GitHubIcon, StravaIcon, XIcon } from "@/components/icons";
import { CardShineLayers, useCardShine } from "@/components/ui/card-shine";
import type { SocialCard, SocialCardPlatform } from "@/content";
import { asciiField } from "@/lib/ascii-field";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/** Card footprint shared by the dock's positioning maths. */
export const PREVIEW_CARD_WIDTH = 280;
export const PREVIEW_CARD_HEIGHT = 176;

/** Maximum tilt, in degrees, when the pointer is at a card edge. */
const MAX_TILT = 7;

interface Theme {
  /** Surface: gradient, ink colour, hairline ring. */
  surface: string;
  /** Top-edge sheen; strength depends on how dark the surface is. */
  edge: string;
  avatarRing: string;
  /** Colour of the light band that sweeps across, and of the pointer glare. */
  light: string;
}

const themes: Record<SocialCardPlatform, Theme> = {
  github: {
    surface:
      "bg-[linear-gradient(140deg,var(--card-github-from),var(--card-github-to))] text-[var(--card-github-ink)] ring-black/10",
    edge: "shadow-[inset_0_1px_0_rgb(255_255_255/0.9)]",
    avatarRing: "ring-white",
    light: "rgb(255 255 255 / 0.85)",
  },
  strava: {
    surface:
      "bg-[linear-gradient(140deg,var(--card-strava-from),var(--card-strava-to))] text-[var(--card-strava-ink)] ring-black/15",
    edge: "shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]",
    avatarRing: "ring-white/70",
    light: "rgb(255 255 255 / 0.4)",
  },
  x: {
    surface:
      "bg-[linear-gradient(140deg,var(--card-x-from),var(--card-x-to))] text-[var(--card-x-ink)] ring-white/10",
    edge: "shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]",
    avatarRing: "ring-white/15",
    light: "rgb(255 255 255 / 0.16)",
  },
  linkedin: {
    surface:
      "bg-[linear-gradient(140deg,var(--card-linkedin-from),var(--card-linkedin-to))] text-[var(--card-linkedin-ink)] ring-black/15",
    edge: "shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]",
    avatarRing: "ring-white/70",
    light: "rgb(255 255 255 / 0.4)",
  },
  email: {
    surface:
      "bg-[linear-gradient(160deg,var(--card-email-from),var(--card-email-to))] text-[var(--card-email-ink)] ring-black/10",
    edge: "shadow-[inset_0_1px_0_rgb(255_255_255/0.9)]",
    avatarRing: "ring-white",
    light: "rgb(255 255 255 / 0.8)",
  },
};

/** "in" letterforms only — the LinkedIn mark without its rounded square. */
function LinkedInLetters({ className }: { className?: string }) {
  return (
    <svg viewBox="2.5 2.5 19 19" aria-hidden="true" focusable="false" className={className}>
      <path
        fill="currentColor"
        d="M7.08 20.4H3.454V8.915h3.625zM5.352 7.371c-1.209 0-2.07-.856-2.07-2.056s.863-2.059 2.07-2.059c1.21 0 2.073.859 2.073 2.059S6.388 7.37 5.352 7.37M20.548 20.4h-3.626v-5.485c0-1.371 0-3.087-1.9-3.087-1.898 0-2.073 1.372-2.073 2.916V20.4H9.325V8.915h3.454v1.541c.69-1.2 2.073-1.885 3.453-1.885 3.627 0 4.316 2.4 4.316 5.485z"
      />
    </svg>
  );
}

/** Solid envelope — lucide only ships the outline. */
function EnvelopeSolid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path
        fill="currentColor"
        d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4-8 5-8-5V6l8 5 8-5z"
      />
    </svg>
  );
}

/** Oversized, partly-clipped brand mark that fills the right of the card. */
function Decoration({ platform }: { platform: Exclude<SocialCardPlatform, "email"> }) {
  switch (platform) {
    case "github":
      return (
        <GitHubIcon
          width={212}
          height={212}
          className="absolute -top-3 -right-10 text-[var(--card-github-mark)] drop-shadow-[-3px_4px_6px_rgb(0_0_0/0.10)]"
        />
      );
    case "strava":
      return (
        <StravaIcon
          width={220}
          height={220}
          className="absolute -top-4 -right-12 text-[var(--card-strava-mark)] drop-shadow-[-3px_4px_8px_rgb(0_0_0/0.12)]"
        />
      );
    case "x":
      return (
        <>
          {/* Fine dot grid, like the reference's textured dark surface. */}
          <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:10px_10px]" />
          <XIcon
            width={230}
            height={230}
            className="absolute -top-6 -right-8 text-white/[0.07] drop-shadow-[0_0_1px_rgb(255_255_255/0.25)]"
          />
        </>
      );
    case "linkedin":
      return (
        <div className="absolute inset-y-0 right-0 left-[40%] overflow-hidden bg-[var(--card-linkedin-panel)] shadow-[-8px_0_24px_-6px_rgb(0_0_0/0.25)]">
          <LinkedInLetters className="absolute top-5 left-4 h-[150px] w-[150px] text-[var(--card-linkedin-mark)] drop-shadow-[0_1px_0_rgb(255_255_255/0.22)]" />
        </div>
      );
  }
}

/** Profile layout shared by GitHub, Strava, X and LinkedIn: avatar top-left, name below. */
function ProfileBody({ card, theme }: { card: SocialCard; theme: Theme }) {
  return (
    <div className="relative z-[1] flex h-full max-w-[62%] flex-col p-4">
      <div
        className={cn(
          "relative size-11 shrink-0 overflow-hidden rounded-[10px] bg-black/10 shadow-md ring-2",
          theme.avatarRing,
        )}
      >
        {card.avatarUrl && (
          <Image src={card.avatarUrl} alt="" fill sizes="44px" className="object-cover" />
        )}
      </div>

      <div className="mt-auto min-w-0">
        <p className="m-0 text-[17px] leading-tight font-semibold tracking-[-0.01em]">
          {card.name}
        </p>
        <p className="m-0 mt-0.5 truncate text-[12.5px] opacity-60">{card.handle}</p>
        <p className="m-0 mt-3 text-xs opacity-45">{card.designation}</p>
      </div>
    </div>
  );
}

const asciiTopLeft = asciiField({ rows: 12, cols: 46, seed: 7, corner: "top-left" });
const asciiBottomRight = asciiField({ rows: 12, cols: 46, seed: 21, corner: "bottom-right" });

const asciiClass =
  "pointer-events-none absolute m-0 font-mono text-[7px] leading-[7px] whitespace-pre text-[var(--card-email-ascii)] select-none";

/** Email layout: dithered ASCII corners on paper, wordmark and address centred. */
function EmailBody({ card }: { card: SocialCard }) {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 paper-grain opacity-40" />
      <pre data-ascii="top-left" aria-hidden="true" className={cn(asciiClass, "top-1.5 left-1.5")}>
        {asciiTopLeft}
      </pre>
      <pre
        data-ascii="bottom-right"
        aria-hidden="true"
        className={cn(asciiClass, "right-1.5 bottom-1.5")}
      >
        {asciiBottomRight}
      </pre>

      <div className="relative z-[1] flex h-full flex-col items-center justify-center gap-2.5 px-6 text-center">
        <p
          data-wordmark
          className="m-0 text-[26px] leading-none font-extrabold tracking-[-0.035em] text-[var(--card-email-accent)]"
        >
          {card.designation}
        </p>
        <p className="m-0 inline-flex max-w-full items-center gap-2 text-[13px] tracking-[-0.005em]">
          <EnvelopeSolid className="size-4 shrink-0" />
          <span className="truncate">{card.handle}</span>
        </p>
      </div>
    </>
  );
}

interface SocialPreviewCardProps {
  card: SocialCard;
  className?: string;
}

/**
 * Brand-themed profile card shown above a dock icon. The dock owns hover state,
 * positioning and the open/close animation; the card owns its own "premium"
 * micro-interactions (GSAP): a band of light that sweeps left → right when it
 * appears and on every hover, a pointer-following tilt, and a soft glare.
 */
export function SocialPreviewCard({ card, className }: SocialPreviewCardProps) {
  const theme = themes[card.platform];
  const { rootRef, sheenRef, glareRef, handlers } = useCardShine({ maxTilt: MAX_TILT });

  useGSAP(
    () => {
      if (card.platform !== "email" || prefersReducedMotion()) return;
      gsap.from("[data-ascii='top-left']", {
        clipPath: "inset(0% 100% 100% 0%)",
        duration: 0.9,
        ease: "power3.out",
      });
      gsap.from("[data-ascii='bottom-right']", {
        clipPath: "inset(100% 0% 0% 100%)",
        duration: 0.9,
        ease: "power3.out",
        delay: 0.08,
      });
      gsap.to("[data-wordmark]", {
        duration: 0.7,
        scrambleText: { text: card.designation, chars: "$%#*+=-:.", speed: 0.6 },
      });
    },
    { scope: rootRef },
  );

  const lightStyle = { "--card-light": theme.light } as CSSProperties;

  return (
    <div
      ref={rootRef}
      {...handlers}
      className={cn(
        "relative isolate overflow-hidden rounded-2xl shadow-[0_24px_48px_-16px_rgb(0_0_0/0.35),0_4px_12px_-4px_rgb(0_0_0/0.12)] ring-1 will-change-transform",
        theme.surface,
        className,
      )}
      style={{ height: PREVIEW_CARD_HEIGHT, ...lightStyle }}
    >
      {card.platform === "email" ? (
        <EmailBody card={card} />
      ) : (
        <>
          <Decoration platform={card.platform} />
          <ProfileBody card={card} theme={theme} />
        </>
      )}

      <CardShineLayers sheenRef={sheenRef} glareRef={glareRef} />

      {/* Edge highlight sits above everything so it reads as the card's own rim. */}
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 z-[4] rounded-2xl", theme.edge)}
      />
    </div>
  );
}
