import * as React from "react";
import {
  Calculator,
  CircleCheck,
  Music2,
  Notebook,
  Settings,
  Sparkle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type AppIconId =
  | "calculator"
  | "notes"
  | "ai"
  | "music"
  | "tasks"
  | "settings";

interface AppIconTreatment {
  glyph: LucideIcon;
}

const treatments: Record<AppIconId, AppIconTreatment> = {
  calculator: {
    glyph: Calculator,
  },
  notes: {
    glyph: Notebook,
  },
  ai: {
    glyph: Sparkle,
  },
  music: {
    glyph: Music2,
  },
  tasks: {
    glyph: CircleCheck,
  },
  settings: {
    glyph: Settings,
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
        "flex size-10 shrink-0 rounded-xl border border-neutral-300/80 bg-neutral-100 text-neutral-800 shadow-[0_2px_8px_rgba(23,23,23,0.14)] md:size-11",
        className,
      )}
    >
      <Glyph
        absoluteStrokeWidth
        className="m-auto size-[18px] md:size-5"
        strokeWidth={1.75}
      />
    </span>
  );
}
