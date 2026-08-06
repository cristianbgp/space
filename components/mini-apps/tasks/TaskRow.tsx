import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Check, ChevronDown, Flag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority, UpdateTaskInput } from "@/lib/tasks/types";

interface TaskRowProps {
  task: Task;
  expanded: boolean;
  today: string;
  onToggle(id: string): void;
  onToggleExpanded(id: string): void;
  onUpdate(id: string, changes: UpdateTaskInput): void;
  onDelete(id: string): void;
}

function formatDueDate(dueDate: string, today: string): string {
  const [year, month, day] = dueDate.split("-").map(Number);
  const formatted = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day, 12));

  if (dueDate < today) return `Overdue, ${formatted}`;
  if (dueDate === today) return "Today";
  return formatted;
}

export function TaskRow({
  task,
  expanded,
  today,
  onToggle,
  onToggleExpanded,
  onUpdate,
  onDelete,
}: TaskRowProps) {
  const [draftTitle, setDraftTitle] = React.useState(task.title);

  React.useEffect(() => {
    setDraftTitle(task.title);
  }, [task.title]);

  const commitTitle = () => {
    const normalized = draftTitle.trim();
    if (!normalized) {
      setDraftTitle(task.title);
      return;
    }
    if (normalized !== task.title) onUpdate(task.id, { title: normalized });
  };

  return (
    <motion.li
      layout
      className="border-b border-border/75 last:border-b-0"
      transition={{ duration: 0.16 }}
    >
      <div className="flex min-h-14 items-center gap-3 px-4 py-2">
        <button
          aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`}
          className={cn(
            "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            task.completed
              ? "border-foreground bg-foreground text-background"
              : "border-muted-foreground/55 bg-background hover:border-foreground"
          )}
          onClick={() => onToggle(task.id)}
          type="button"
        >
          {task.completed ? (
            <Check aria-hidden="true" className="size-3" strokeWidth={2.4} />
          ) : null}
        </button>

        <div className="min-w-0 flex-1">
          {expanded ? (
            <Input
              aria-label="Task title"
              className="h-7 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
              onBlur={commitTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") {
                  setDraftTitle(task.title);
                  event.currentTarget.blur();
                }
              }}
              value={draftTitle}
            />
          ) : (
            <p
              className={cn(
                "truncate text-sm font-medium",
                task.completed && "text-muted-foreground line-through"
              )}
            >
              {task.title}
            </p>
          )}
          <div className="mt-0.5 flex min-h-4 items-center gap-2 text-[10px] text-muted-foreground">
            {task.dueDate ? (
              <span className={cn(task.dueDate < today && !task.completed && "font-medium text-foreground")}>
                {formatDueDate(task.dueDate, today)}
              </span>
            ) : (
              <span>Anytime</span>
            )}
            {task.priority !== "none" ? (
              <span className="inline-flex items-center gap-1 capitalize">
                <Flag aria-hidden="true" className="size-2.5" strokeWidth={1.8} />
                {task.priority}
              </span>
            ) : null}
          </div>
        </div>

        <button
          aria-expanded={expanded}
          aria-label={`${expanded ? "Hide" : "Show"} details for ${task.title}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onToggleExpanded(task.id)}
          type="button"
        >
          <ChevronDown
            aria-hidden="true"
            className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
            strokeWidth={1.8}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <div className="grid gap-2 border-t border-border/60 bg-muted/25 px-4 py-3 pl-[3.25rem] sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto]">
              <label className="min-w-0 text-[10px] font-medium text-muted-foreground">
                <span className="mb-1 flex items-center gap-1">
                  <CalendarDays aria-hidden="true" className="size-3" strokeWidth={1.8} />
                  Due date
                </span>
                <Input
                  aria-label="Due date"
                  className="h-8 bg-background/75 px-2 text-xs shadow-none"
                  onChange={(event) =>
                    onUpdate(task.id, { dueDate: event.target.value || null })
                  }
                  type="date"
                  value={task.dueDate ?? ""}
                />
              </label>

              <label className="min-w-0 text-[10px] font-medium text-muted-foreground">
                <span className="mb-1 flex items-center gap-1">
                  <Flag aria-hidden="true" className="size-3" strokeWidth={1.8} />
                  Priority
                </span>
                <select
                  aria-label="Priority"
                  className="h-8 w-full rounded-md border border-input bg-background/75 px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  onChange={(event) =>
                    onUpdate(task.id, {
                      priority: event.target.value as TaskPriority,
                    })
                  }
                  value={task.priority}
                >
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <Button
                aria-label="Delete task"
                className="self-end text-muted-foreground hover:text-foreground"
                onClick={() => onDelete(task.id)}
                size="icon-sm"
                variant="ghost"
              >
                <Trash2 aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}
