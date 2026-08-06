import * as React from "react";
import { CircleCheckBig, ListTodo, SearchX } from "lucide-react";

import { TaskRow } from "@/components/mini-apps/tasks/TaskRow";
import type { Task, TaskView, UpdateTaskInput } from "@/lib/tasks/types";

interface TaskListProps {
  tasks: Task[];
  view: TaskView;
  query: string;
  today: string;
  expandedTaskId: string | null;
  onToggle(id: string): void;
  onToggleExpanded(id: string): void;
  onUpdate(id: string, changes: UpdateTaskInput): void;
  onDelete(id: string): void;
}

const emptyCopy: Record<TaskView, { title: string; body: string }> = {
  today: {
    title: "Nothing due today",
    body: "Add a task or enjoy the clear space.",
  },
  upcoming: {
    title: "No upcoming tasks",
    body: "Future work will appear here.",
  },
  all: {
    title: "No open tasks",
    body: "Add your first task above.",
  },
  completed: {
    title: "No completed tasks",
    body: "Finished work will collect here.",
  },
};

export function TaskList({
  tasks,
  view,
  query,
  today,
  expandedTaskId,
  onToggle,
  onToggleExpanded,
  onUpdate,
  onDelete,
}: TaskListProps) {
  if (tasks.length === 0) {
    const searching = Boolean(query.trim());
    const copy = searching
      ? { title: "No matching tasks", body: "Try a different search term." }
      : emptyCopy[view];
    const Icon = searching
      ? SearchX
      : view === "completed"
        ? CircleCheckBig
        : ListTodo;

    return (
      <div className="flex min-h-48 flex-1 items-center justify-center p-6 text-center">
        <div className="max-w-52">
          <Icon
            aria-hidden="true"
            className="mx-auto mb-3 size-6 stroke-1 text-muted-foreground"
          />
          <p className="text-sm font-medium">{copy.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy.body}</p>
        </div>
      </div>
    );
  }

  return (
    <ul aria-label="Tasks" className="min-h-0 flex-1 overflow-y-auto">
      {tasks.map((task) => (
        <TaskRow
          expanded={task.id === expandedTaskId}
          key={task.id}
          onDelete={onDelete}
          onToggle={onToggle}
          onToggleExpanded={onToggleExpanded}
          onUpdate={onUpdate}
          task={task}
          today={today}
        />
      ))}
    </ul>
  );
}
