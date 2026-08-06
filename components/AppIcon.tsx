import * as React from "react";
import {
  AudioWaveform,
  Calculator,
  NotebookPen,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type AppIconId =
  | "calculator"
  | "notes"
  | "ai"
  | "music"
  | "settings";

interface AppIconTreatment {
  glyph: LucideIcon;
  surface: string;
  glow: string;
  glyphColor: string;
}

const treatments: Record<AppIconId, AppIconTreatment> = {
  calculator: {
    glyph: Calculator,
    surface: "from-neutral-400 via-neutral-700 to-neutral-950",
    glow: "bg-white/28",
    glyphColor: "text-white",
  },
  notes: {
    glyph: NotebookPen,
    surface: "from-neutral-50 via-neutral-200 to-neutral-500",
    glow: "bg-white/55",
    glyphColor: "text-neutral-950",
  },
  ai: {
    glyph: Sparkles,
    surface: "from-neutral-200 via-neutral-600 to-neutral-950",
    glow: "bg-white/45",
    glyphColor: "text-white",
  },
  music: {
    glyph: AudioWaveform,
    surface: "from-neutral-600 via-neutral-800 to-neutral-950",
    glow: "bg-white/22",
    glyphColor: "text-white",
  },
  settings: {
    glyph: SlidersHorizontal,
    surface: "from-neutral-50 via-neutral-300 to-neutral-600",
    glow: "bg-white/60",
    glyphColor: "text-neutral-950",
  },
};

interface AppIconProps {
  app: AppIconId;
  className?: string;
}

export function AppIcon({ app, className }: AppIconProps) {
  const treatment = treatments[app];
  const Glyph = treatment.glyph;

  return (
    <span
      aria-hidden="true"
      data-app-icon={app}
      className={cn(
        "relative isolate flex size-10 shrink-0 overflow-hidden rounded-[13px] border border-white/45 bg-linear-to-br shadow-[0_8px_18px_-8px_rgba(23,23,23,0.72),inset_0_1px_0_rgba(255,255,255,0.5)] md:size-11 md:rounded-[14px]",
        treatment.surface,
        className
      )}
    >
      <span
        className={cn(
          "absolute -left-2 -top-4 size-9 rounded-full blur-md",
          treatment.glow
        )}
      />
      <span className="absolute inset-px rounded-[11px] bg-linear-to-b from-white/25 via-white/0 to-black/15 md:rounded-[12px]" />
      <span className="absolute inset-x-2 bottom-1 h-px bg-white/25" />
      <Glyph
        strokeWidth={1.8}
        className={cn(
          "relative z-10 m-auto size-[19px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.22)] md:size-[21px]",
          treatment.glyphColor
        )}
      />
    </span>
  );
}
