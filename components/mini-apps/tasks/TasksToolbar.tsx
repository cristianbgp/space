import * as React from "react";
import { PanelLeft, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TaskView } from "@/lib/tasks/types";

const viewTitles: Record<TaskView, string> = {
  today: "Today",
  upcoming: "Upcoming",
  all: "All tasks",
  completed: "Completed",
};

interface TasksToolbarProps {
  view: TaskView;
  count: number;
  query: string;
  onOpenSidebar(): void;
  onQueryChange(query: string): void;
}

export function TasksToolbar({
  view,
  count,
  query,
  onOpenSidebar,
  onQueryChange,
}: TasksToolbarProps) {
  return (
    <header className="flex min-h-14 shrink-0 items-center gap-3 border-b border-border px-3 md:px-4">
      <Button
        aria-label="Open task views"
        className="md:hidden"
        onClick={onOpenSidebar}
        size="icon-sm"
        variant="ghost"
      >
        <PanelLeft aria-hidden="true" className="size-4" strokeWidth={1.8} />
      </Button>
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold tracking-tight">
          {viewTitles[view]}
        </h2>
        <p className="text-[10px] text-muted-foreground">
          {count} {count === 1 ? "task" : "tasks"}
        </p>
      </div>
      <div className="relative ml-auto w-[min(44%,13rem)]">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.8}
        />
        <Input
          aria-label="Search tasks"
          className="h-8 bg-background/60 pl-8 text-xs shadow-none"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search"
          type="search"
          value={query}
        />
      </div>
    </header>
  );
}
