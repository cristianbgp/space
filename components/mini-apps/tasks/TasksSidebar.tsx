import * as React from "react";
import {
  CalendarCheck,
  CalendarDays,
  CircleCheckBig,
  ListTodo,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { TaskView } from "@/lib/tasks/types";

interface TasksSidebarProps {
  activeView: TaskView;
  counts: Record<TaskView, number>;
  onViewChange(view: TaskView): void;
}

interface ViewItem {
  id: TaskView;
  label: string;
  icon: LucideIcon;
}

const views: ViewItem[] = [
  { id: "today", label: "Today", icon: CalendarCheck },
  { id: "upcoming", label: "Upcoming", icon: CalendarDays },
  { id: "all", label: "All", icon: ListTodo },
  { id: "completed", label: "Completed", icon: CircleCheckBig },
];

export function TasksSidebar({
  activeView,
  counts,
  onViewChange,
}: TasksSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-sidebar-border bg-sidebar/88 text-sidebar-foreground backdrop-blur-xl md:w-44">
      <div className="border-b border-sidebar-border px-3 py-3.5">
        <p className="text-xs font-semibold tracking-tight">Tasks</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Local to this browser</p>
      </div>

      <nav aria-label="Task views" className="space-y-1 p-2">
        {views.map((view) => {
          const Icon = view.icon;
          const active = activeView === view.id;
          return (
            <button
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
              key={view.id}
              onClick={() => onViewChange(view.id)}
              type="button"
            >
              <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
              <span>{view.label}</span>
              <span className="ml-auto min-w-4 text-right text-[10px] tabular-nums text-muted-foreground">
                {counts[view.id]}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border px-3 py-3 text-[10px] leading-4 text-muted-foreground">
        Changes save automatically on this device.
      </div>
    </aside>
  );
}
