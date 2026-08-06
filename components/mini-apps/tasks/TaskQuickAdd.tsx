import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreateTaskInput } from "@/lib/tasks/types";

interface TaskQuickAddProps {
  onCreate(input: CreateTaskInput): void;
}

export function TaskQuickAdd({ onCreate }: TaskQuickAddProps) {
  const [title, setTitle] = React.useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;
    onCreate({ title: normalizedTitle });
    setTitle("");
  };

  return (
    <form
      aria-label="Add task"
      className="flex items-center gap-2 border-b border-border px-4 py-3"
      onSubmit={handleSubmit}
      role="form"
    >
      <div className="relative min-w-0 flex-1">
        <Plus
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.8}
        />
        <Input
          aria-label="New task title"
          className="h-9 border-border/80 bg-background/60 pl-9 text-sm shadow-none"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task"
          value={title}
        />
      </div>
      <Button
        aria-label="Create task"
        className="size-9 px-0"
        disabled={!title.trim()}
        type="submit"
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={1.8} />
      </Button>
    </form>
  );
}
