import { BadgeCheck } from "lucide-react";
import { useId } from "react";
import { PREVIEW_CARD_HEIGHT } from "@/components/layout/social-preview-card";
import { cn } from "@/lib/utils";
import type { Certification, CertificationBrand } from "@/types/content";

interface Face {
  /** Gradient, ink colour and hairline ring. */
  surface: string;
  /** Top-edge sheen; strength depends on how dark the surface is. */
  edge: string;
  /** The small credential tile in the top-left corner. */
  tile: string;
}

const faces: Record<CertificationBrand, Face> = {
  aws: {
    surface:
      "bg-[linear-gradient(140deg,var(--cert-aws-from),var(--cert-aws-to))] text-white ring-white/10",
    edge: "shadow-[inset_0_1px_0_rgb(255_255_255/0.10)]",
    tile: "bg-[var(--cert-aws-accent)] text-[var(--cert-aws-to)]",
  },
  google: {
    surface:
      "bg-[linear-gradient(140deg,var(--cert-google-from),var(--cert-google-to))] text-[var(--cert-google-ink)] ring-black/10",
    edge: "shadow-[inset_0_1px_0_rgb(255_255_255/0.9)]",
    tile: "bg-white text-[#4285f4] ring-1 ring-black/10",
  },
  coursera: {
    surface:
      "bg-[linear-gradient(140deg,var(--cert-coursera-from),var(--cert-coursera-to))] text-white ring-black/15",
    edge: "shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]",
    tile: "bg-white text-[var(--cert-coursera-to)]",
  },
  animations: {
    surface:
      "bg-[linear-gradient(140deg,var(--cert-animations-from),var(--cert-animations-to))] text-[#fafafa] ring-white/10",
    edge: "shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]",
    tile: "bg-white/10 text-white ring-1 ring-white/15",
  },
  generic: {
    surface:
      "bg-[linear-gradient(140deg,var(--card-github-from),var(--card-github-to))] text-[var(--card-github-ink)] ring-black/10",
    edge: "shadow-[inset_0_1px_0_rgb(255_255_255/0.9)]",
    tile: "bg-[var(--card-github-ink)] text-white",
  },
};

/** The Amazon "smile" under a ghosted wordmark. */
function AwsArt() {
  return (
    <>
      <span className="absolute -top-6 -right-3 text-[124px] leading-none font-extrabold tracking-[-0.07em] text-white/[0.07] select-none">
        aws
      </span>
      <svg
        viewBox="0 0 140 48"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute top-[60px] right-4 w-[100px] text-[var(--cert-aws-accent)] drop-shadow-[0_6px_14px_rgb(255_153_0/0.35)]"
      >
        <path d="M6 10 C 40 40, 92 42, 128 17" />
        <path d="M113 11 L131 15 L125 32" />
      </svg>
    </>
  );
}

/** Oversized four-colour "G", partly clipped like the GitHub card's mark. */
function GoogleArt() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(rgb(0_0_0/0.06)_1px,transparent_1px)] [background-size:12px_12px]" />
      <span className="absolute -top-[46px] -right-8 bg-[conic-gradient(from_0deg_at_50%_56%,#ea4335_0deg_55deg,#4285f4_55deg_125deg,#34a853_125deg_220deg,#fbbc05_220deg_295deg,#ea4335_295deg_360deg)] bg-clip-text text-[232px] leading-none font-semibold tracking-[-0.06em] text-transparent drop-shadow-[-3px_4px_6px_rgb(0_0_0/0.10)] select-none">
        G
      </span>
    </>
  );
}

/** A heavy open ring — Coursera's "C" — sitting off the right edge. */
function CourseraArt() {
  const gradient = useId();
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgb(255_255_255/0.18),transparent_60%)]" />
      <svg
        viewBox="0 0 220 220"
        fill="none"
        aria-hidden="true"
        className="absolute -top-3 -right-14 size-[210px] drop-shadow-[-4px_6px_10px_rgb(0_0_0/0.18)]"
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgb(255 255 255 / 0.34)" />
            <stop offset="1" stopColor="rgb(255 255 255 / 0.08)" />
          </linearGradient>
        </defs>
        <circle
          cx="110"
          cy="110"
          r="72"
          stroke={`url(#${gradient})`}
          strokeWidth="34"
          strokeLinecap="round"
          strokeDasharray="330 122"
          strokeDashoffset="-61"
        />
      </svg>
    </>
  );
}

/** A cubic-bézier easing curve with its control handles, on a dot grid. */
function AnimationsArt() {
  const gradient = useId();
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:10px_10px]" />
      <svg
        viewBox="0 0 160 140"
        fill="none"
        aria-hidden="true"
        className="absolute top-3 right-3 w-[122px]"
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="0.55" stopColor="#ec4899" />
            <stop offset="1" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <rect
          x="12"
          y="10"
          width="136"
          height="120"
          rx="4"
          stroke="rgb(255 255 255 / 0.1)"
          strokeDasharray="3 4"
        />
        <path d="M12 130 L86 130" stroke="rgb(255 255 255 / 0.3)" strokeWidth="1.25" />
        <path d="M148 10 L74 10" stroke="rgb(255 255 255 / 0.3)" strokeWidth="1.25" />
        <path
          d="M12 130 C 86 130, 74 10, 148 10"
          stroke={`url(#${gradient})`}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="86" cy="130" r="5" fill="#fafafa" />
        <circle cx="74" cy="10" r="5" fill="#fafafa" />
        <circle cx="12" cy="130" r="3" fill="rgb(255 255 255 / 0.55)" />
        <circle cx="148" cy="10" r="3" fill="rgb(255 255 255 / 0.55)" />
      </svg>
    </>
  );
}

function GenericArt() {
  return (
    <BadgeCheck
      aria-hidden="true"
      strokeWidth={1.25}
      className="absolute -top-4 -right-10 size-[200px] text-[var(--card-github-mark)] drop-shadow-[-3px_4px_6px_rgb(0_0_0/0.10)]"
    />
  );
}

const art: Record<CertificationBrand, () => React.JSX.Element> = {
  aws: AwsArt,
  google: GoogleArt,
  coursera: CourseraArt,
  animations: AnimationsArt,
  generic: GenericArt,
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `18.08.2025` → `Aug 2025`. */
function formatIssued(date: string): string {
  const [, month, year] = date.split(".");
  const name = MONTHS[Number(month) - 1];
  return name && year ? `${name} ${year}` : date;
}

interface CertificationCardFaceProps {
  cert: Certification;
  className?: string;
}

/**
 * The card artwork: a brand-themed credential the size of the dock's social
 * cards, with the same layered finish — gradient surface, oversized clipped
 * mark on the right, tile top-left, headline bottom-left, rim highlight.
 */
export function CertificationCardFace({ cert, className }: CertificationCardFaceProps) {
  const face = faces[cert.brand] ?? faces.generic;
  const Art = art[cert.brand] ?? GenericArt;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative isolate overflow-hidden rounded-xl ring-1 ring-inset",
        face.surface,
        className,
      )}
      style={{ height: PREVIEW_CARD_HEIGHT }}
    >
      <Art />

      <div className="relative z-[1] flex h-full max-w-[68%] flex-col p-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[10px] shadow-md",
            face.tile,
          )}
        >
          <BadgeCheck className="size-[18px]" strokeWidth={2.25} />
        </div>

        <div className="mt-auto min-w-0">
          <p className="m-0 text-[17px] leading-tight font-semibold tracking-[-0.01em]">
            {cert.card.headline}
          </p>
          <p className="m-0 mt-0.5 truncate text-[12.5px] opacity-60">{cert.card.caption}</p>
          <p className="m-0 mt-3 font-mono text-[10.5px] tracking-[0.06em] uppercase opacity-45">
            Issued {formatIssued(cert.date)}
          </p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 z-[2] rounded-xl", face.edge)}
      />
    </div>
  );
}
