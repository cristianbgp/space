import type { TaskSeed } from "@/lib/tasks/types";

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function offsetDate(referenceDate: Date, days: number): string {
  const date = new Date(referenceDate);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function createExampleTaskSeeds(referenceDate = new Date()): TaskSeed[] {
  return [
    {
      title: "Review the project roadmap",
      priority: "high",
      dueDate: offsetDate(referenceDate, 0),
    },
    {
      title: "Refine the Tasks mini-app",
      priority: "medium",
      dueDate: offsetDate(referenceDate, 1),
    },
    {
      title: "Choose the next mini-app",
      priority: "low",
      dueDate: null,
    },
    {
      title: "Set up local-first storage",
      completed: true,
      priority: "none",
      dueDate: offsetDate(referenceDate, -1),
    },
  ];
}
