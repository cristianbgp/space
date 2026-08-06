import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTasks } from "@/hooks/use-tasks";
import type { TasksRepository } from "@/lib/tasks/repository";
import type {
  CreateTaskInput,
  Task,
  TasksQuery,
  UpdateTaskInput,
} from "@/lib/tasks/types";

const tasks: Task[] = [
  {
    id: "overdue",
    title: "Overdue review",
    completed: false,
    priority: "high",
    dueDate: "2026-08-05",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    completedAt: null,
  },
  {
    id: "today",
    title: "Today focus",
    completed: false,
    priority: "medium",
    dueDate: "2026-08-06",
    createdAt: "2026-08-02T10:00:00.000Z",
    updatedAt: "2026-08-02T10:00:00.000Z",
    completedAt: null,
  },
  {
    id: "future",
    title: "Future plan",
    completed: false,
    priority: "low",
    dueDate: "2026-08-08",
    createdAt: "2026-08-03T10:00:00.000Z",
    updatedAt: "2026-08-03T10:00:00.000Z",
    completedAt: null,
  },
  {
    id: "anytime",
    title: "Anytime idea",
    completed: false,
    priority: "none",
    dueDate: null,
    createdAt: "2026-08-04T10:00:00.000Z",
    updatedAt: "2026-08-04T10:00:00.000Z",
    completedAt: null,
  },
  {
    id: "complete",
    title: "Finished setup",
    completed: true,
    priority: "none",
    dueDate: "2026-08-04",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-05T09:00:00.000Z",
    completedAt: "2026-08-05T09:00:00.000Z",
  },
];

function copyTask(task: Task): Task {
  return { ...task };
}

class MemoryTasksRepository implements TasksRepository {
  tasks: Task[];
  failLoad = false;
  failDelete = false;
  failUpdate = false;

  constructor(initialTasks: Task[]) {
    this.tasks = initialTasks.map(copyTask);
  }

  async list(options?: TasksQuery): Promise<Task[]> {
    if (this.failLoad) throw new Error("load failed");
    const query = options?.query?.toLocaleLowerCase();
    return this.tasks
      .filter((task) => !query || task.title.toLocaleLowerCase().includes(query))
      .map(copyTask);
  }

  async get(id: string): Promise<Task | null> {
    const task = this.tasks.find((candidate) => candidate.id === id);
    return task ? copyTask(task) : null;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const task: Task = {
      id: `created-${this.tasks.length}`,
      title: input.title.trim(),
      completed: false,
      priority: input.priority ?? "none",
      dueDate: input.dueDate ?? null,
      createdAt: "2026-08-06T15:00:00.000Z",
      updatedAt: "2026-08-06T15:00:00.000Z",
      completedAt: null,
    };
    this.tasks.push(task);
    return copyTask(task);
  }

  async update(id: string, changes: UpdateTaskInput): Promise<Task> {
    if (this.failUpdate) throw new Error("update failed");
    const index = this.tasks.findIndex((task) => task.id === id);
    if (index < 0) throw new Error("missing task");
    const completed = changes.completed ?? this.tasks[index].completed;
    this.tasks[index] = {
      ...this.tasks[index],
      ...changes,
      title: changes.title?.trim() ?? this.tasks[index].title,
      completed,
      completedAt:
        changes.completed === undefined
          ? this.tasks[index].completedAt
          : completed
            ? "2026-08-06T16:00:00.000Z"
            : null,
      updatedAt: "2026-08-06T16:00:00.000Z",
    };
    return copyTask(this.tasks[index]);
  }

  async delete(id: string): Promise<void> {
    if (this.failDelete) throw new Error("delete failed");
    this.tasks = this.tasks.filter((task) => task.id !== id);
  }

  async restore(task: Task): Promise<Task> {
    this.tasks.push(copyTask(task));
    return copyTask(task);
  }
}

async function renderTasks(repository: MemoryTasksRepository) {
  const hook = renderHook(() =>
    useTasks(() => Promise.resolve(repository), {
      today: () => "2026-08-06",
    })
  );
  await waitFor(() => expect(hook.result.current.status).toBe("ready"));
  return hook;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useTasks", () => {
  it("derives views and counts from the current local date", async () => {
    const { result } = await renderTasks(new MemoryTasksRepository(tasks));

    expect(result.current.visibleTasks.map((task) => task.id)).toEqual([
      "overdue",
      "today",
    ]);
    expect(result.current.counts).toEqual({
      today: 2,
      upcoming: 1,
      all: 4,
      completed: 1,
    });

    act(() => result.current.setView("upcoming"));
    expect(result.current.visibleTasks.map((task) => task.id)).toEqual(["future"]);

    act(() => result.current.setView("all"));
    expect(result.current.visibleTasks.map((task) => task.id)).toEqual([
      "overdue",
      "today",
      "future",
      "anytime",
    ]);

    act(() => result.current.setView("completed"));
    expect(result.current.visibleTasks.map((task) => task.id)).toEqual(["complete"]);
  });

  it("searches case-insensitively inside the active view", async () => {
    const { result } = await renderTasks(new MemoryTasksRepository(tasks));

    act(() => result.current.setView("all"));
    act(() => result.current.setQuery("PLAN"));

    expect(result.current.visibleTasks.map((task) => task.id)).toEqual(["future"]);
  });

  it("ignores blank creation and persists a trimmed task", async () => {
    const repository = new MemoryTasksRepository([]);
    const create = vi.spyOn(repository, "create");
    const { result } = await renderTasks(repository);

    await act(() => result.current.createTask({ title: "   " }));
    expect(create).not.toHaveBeenCalled();

    await act(() => result.current.createTask({ title: "  New focus  " }));

    expect(create).toHaveBeenCalledWith({
      title: "New focus",
      dueDate: "2026-08-06",
    });
    expect(result.current.tasks[0].title).toBe("New focus");
    expect(result.current.expandedTaskId).toBe(result.current.tasks[0].id);
  });

  it("rolls back an optimistic completion when persistence fails", async () => {
    const repository = new MemoryTasksRepository(tasks);
    repository.failUpdate = true;
    const { result } = await renderTasks(repository);

    await act(() => result.current.toggleTask("today"));

    expect(result.current.tasks.find((task) => task.id === "today")?.completed).toBe(
      false
    );
    expect(result.current.error).toBe("Could not update task.");
  });

  it("persists title, date, and priority changes", async () => {
    const repository = new MemoryTasksRepository(tasks);
    const update = vi.spyOn(repository, "update");
    const { result } = await renderTasks(repository);

    await act(() =>
      result.current.updateTask("anytime", {
        title: "  Sharpened idea  ",
        dueDate: "2026-08-09",
        priority: "high",
      })
    );

    expect(update).toHaveBeenCalledWith("anytime", {
      title: "Sharpened idea",
      dueDate: "2026-08-09",
      priority: "high",
    });
    expect(result.current.tasks.find((task) => task.id === "anytime")).toMatchObject({
      title: "Sharpened idea",
      dueDate: "2026-08-09",
      priority: "high",
    });
  });

  it("deletes immediately and restores during the undo window", async () => {
    const repository = new MemoryTasksRepository(tasks);
    const { result } = await renderTasks(repository);
    vi.useFakeTimers();

    await act(() => result.current.deleteTask("today"));
    expect(result.current.tasks.some((task) => task.id === "today")).toBe(false);
    expect(result.current.deletedTask?.id).toBe("today");

    await act(() => result.current.undoDelete());

    expect(result.current.tasks.some((task) => task.id === "today")).toBe(true);
    expect(result.current.deletedTask).toBeNull();
  });

  it("rolls back a failed delete", async () => {
    const repository = new MemoryTasksRepository(tasks);
    repository.failDelete = true;
    const { result } = await renderTasks(repository);

    await act(() => result.current.deleteTask("today"));

    expect(result.current.tasks.some((task) => task.id === "today")).toBe(true);
    expect(result.current.deletedTask).toBeNull();
    expect(result.current.error).toBe("Could not delete task.");
  });

  it("retries a failed initial load", async () => {
    const repository = new MemoryTasksRepository(tasks);
    repository.failLoad = true;
    const { result } = renderHook(() =>
      useTasks(() => Promise.resolve(repository), {
        today: () => "2026-08-06",
      })
    );
    await waitFor(() => expect(result.current.status).toBe("error"));

    repository.failLoad = false;
    await act(() => result.current.retryLoad());

    expect(result.current.status).toBe("ready");
    expect(result.current.tasks).toHaveLength(5);
  });
});
