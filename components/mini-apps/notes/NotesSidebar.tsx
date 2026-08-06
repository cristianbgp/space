import * as React from "react";
import { FileText, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/notes/types";

interface NotesSidebarProps {
  notes: Note[];
  selectedNoteId: string | null;
  query: string;
  onQueryChange(query: string): void;
  onCreate(): void;
  onSelect(id: string): void;
}

function formatUpdatedAt(updatedAt: string, now: number): string {
  const difference = new Date(updatedAt).getTime() - now;
  const absoluteDifference = Math.abs(difference);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absoluteDifference < 60_000) return "Just now";
  if (absoluteDifference < 3_600_000) {
    return formatter.format(Math.round(difference / 60_000), "minute");
  }
  if (absoluteDifference < 86_400_000) {
    return formatter.format(Math.round(difference / 3_600_000), "hour");
  }
  if (absoluteDifference < 604_800_000) {
    return formatter.format(Math.round(difference / 86_400_000), "day");
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(updatedAt));
}

export function NotesSidebar({
  notes,
  selectedNoteId,
  query,
  onQueryChange,
  onCreate,
  onSelect,
}: NotesSidebarProps) {
  const [now] = React.useState(Date.now);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-sidebar-border bg-sidebar/85 text-sidebar-foreground backdrop-blur-xl md:w-52">
      <div className="shrink-0 space-y-2.5 border-b border-sidebar-border p-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search notes"
            className="h-8 bg-background/70 pl-8 text-xs shadow-none"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search notes"
            type="search"
            value={query}
          />
        </div>
        <Button
          className="h-8 w-full justify-start gap-2 text-xs shadow-sm"
          onClick={onCreate}
          size="sm"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          New note
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-8 shrink-0 items-center px-3 text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Recent
        </div>
        <nav aria-label="Notes" className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {notes.length > 0 ? (
            <div className="space-y-0.5">
              {notes.map((note) => {
                const selected = note.id === selectedNoteId;
                const updatedAt = formatUpdatedAt(note.updatedAt, now);

                return (
                  <button
                    aria-current={selected ? "true" : undefined}
                    className={cn(
                      "group w-full rounded-md px-2.5 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      selected
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                    )}
                    key={note.id}
                    onClick={() => onSelect(note.id)}
                    type="button"
                  >
                    <span className="block truncate text-xs font-medium">
                      {note.title.trim() || "Untitled"}
                    </span>
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      {updatedAt}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full min-h-32 flex-col items-center justify-center px-4 text-center">
              <FileText
                aria-hidden="true"
                className="mb-2 size-5 stroke-1 text-muted-foreground"
              />
              <p className="text-xs font-medium">
                {query.trim() ? "No notes found" : "Create your first note"}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                {query.trim()
                  ? "Try a different title or phrase."
                  : "Your notes stay in this browser."}
              </p>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
