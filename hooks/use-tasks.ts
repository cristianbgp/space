import * as React from "react";

import type { TasksRepository } from "@/lib/tasks/repository";
import type {
  CreateTaskInput,
  Task,
  TaskPriority,
  TaskView,
  UpdateTaskInput,
} from "@/lib/tasks/types";

export type TasksStatus = "loading" | "ready" | "error";

export interface UseTasksResult {
  status: TasksStatus;
  error: string | null;
  tasks: Task[];
  visibleTasks: Task[];
  counts: Record<TaskView, number>;
  activeView: TaskView;
  query: string;
  expandedTaskId: string | null;
  deletedTask: Task | null;
  setView(view: TaskView): void;
  setQuery(query: string): void;
  toggleExpanded(id: string): void;
  createTask(input: CreateTaskInput): Promise<void>;
  updateTask(id: string, changes: UpdateTaskInput): Promise<void>;
  toggleTask(id: string): Promise<void>;
  deleteTask(id: string): Promise<void>;
  undoDelete(): Promise<void>;
  retryLoad(): Promise<void>;
}

interface UseTasksOptions {
  today?: () => string;
}

const priorityWeight: Record<TaskPriority, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nextDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day + 1, 12);
  return localDateKey(date);
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.completed) {
      return (b.completedAt ?? b.updatedAt).localeCompare(
        a.completedAt ?? a.updatedAt
      );
    }

    const priorityDifference = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDifference !== 0) return priorityDifference;
    if (a.dueDate !== b.dueDate) {
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function matchesView(task: Task, view: TaskView, today: string): boolean {
  if (view === "completed") return task.completed;
  if (task.completed) return false;
  if (view === "all") return true;
  if (view === "today") return task.dueDate !== null && task.dueDate <= today;
  return task.dueDate !== null && task.dueDate > today;
}

export function useTasks(
  repositoryFactory: () => Promise<TasksRepository>,
  options: UseTasksOptions = {}
): UseTasksResult {
  const factoryRef = React.useRef(repositoryFactory);
  const todayRef = React.useRef(options.today ?? (() => localDateKey()));
  const repositoryPromiseRef = React.useRef<Promise<TasksRepository> | null>(
    null
  );
  const mountedRef = React.useRef(true);
  const tasksRef = React.useRef<Task[]>([]);
  const deletedTaskRef = React.useRef<Task | null>(null);
  const undoTimerRef = React.useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);

  const [status, setStatus] = React.useState<TasksStatus>("loading");
  const [error, setError] = React.useState<string | null>(null);
  const [tasks, setTasksState] = React.useState<Task[]>([]);
  const [activeView, setActiveView] = React.useState<TaskView>("today");
  const [query, setQuery] = React.useState("");
  const [expandedTaskId, setExpandedTaskId] = React.useState<string | null>(null);
  const [deletedTask, setDeletedTaskState] = React.useState<Task | null>(null);

  const setTasks = React.useCallback((next: Task[] | ((current: Task[]) => Task[])) => {
    setTasksState((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      const sorted = sortTasks(resolved);
      tasksRef.current = sorted;
      return sorted;
    });
  }, []);

  const setDeletedTask = React.useCallback((task: Task | null) => {
    deletedTaskRef.current = task;
    setDeletedTaskState(task);
  }, []);

  const getRepository = React.useCallback(() => {
    repositoryPromiseRef.current ??= factoryRef.current();
    return repositoryPromiseRef.current;
  }, []);

  const loadTasks = React.useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const repository = await getRepository();
      const loadedTasks = await repository.list();
      if (!mountedRef.current) return;
      setTasks(loadedTasks);
      setStatus("ready");
    } catch {
      if (!mountedRef.current) return;
      setStatus("error");
      setError("Could not load tasks.");
    }
  }, [getRepository, setTasks]);

  React.useEffect(() => {
    mountedRef.current = true;
    void loadTasks();
    return () => {
      mountedRef.current = false;
      if (undoTimerRef.current) globalThis.clearTimeout(undoTimerRef.current);
    };
  }, [loadTasks]);

  const currentDate = todayRef.current();
  const counts = React.useMemo<Record<TaskView, number>>(
    () => ({
      today: tasks.filter((task) => matchesView(task, "today", currentDate)).length,
      upcoming: tasks.filter((task) => matchesView(task, "upcoming", currentDate))
        .length,
      all: tasks.filter((task) => matchesView(task, "all", currentDate)).length,
      completed: tasks.filter((task) => task.completed).length,
    }),
    [currentDate, tasks]
  );

  const visibleTasks = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return tasks.filter(
      (task) =>
        matchesView(task, activeView, currentDate) &&
        (!normalizedQuery || task.title.toLocaleLowerCase().includes(normalizedQuery))
    );
  }, [activeView, currentDate, query, tasks]);

  const setView = (view: TaskView) => {
    setActiveView(view);
    setExpandedTaskId(null);
    setError(null);
  };

  const toggleExpanded = (id: string) => {
    setExpandedTaskId((current) => (current === id ? null : id));
  };

  const createTask = async (input: CreateTaskInput) => {
    const title = input.title.trim();
    if (!title) return;

    const dueDate =
      input.dueDate !== undefined
        ? input.dueDate
        : activeView === "today"
          ? currentDate
          : activeView === "upcoming"
            ? nextDate(currentDate)
            : null;
    const normalizedInput: CreateTaskInput = { ...input, title, dueDate };

    setError(null);
    try {
      const repository = await getRepository();
      const createdTask = await repository.create(normalizedInput);
      if (!mountedRef.current) return;
      setTasks((current) => [createdTask, ...current]);
      setExpandedTaskId(createdTask.id);
      if (activeView === "completed") setActiveView("all");
    } catch {
      if (mountedRef.current) setError("Could not create task.");
    }
  };

  const updateTask = async (id: string, changes: UpdateTaskInput) => {
    const previousTask = tasksRef.current.find((task) => task.id === id);
    if (!previousTask) return;

    const normalizedChanges = { ...changes };
    if (normalizedChanges.title !== undefined) {
      normalizedChanges.title = normalizedChanges.title.trim();
      if (!normalizedChanges.title) {
        setError("Task title is required.");
        return;
      }
    }

    setError(null);
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, ...normalizedChanges } : task
      )
    );

    try {
      const repository = await getRepository();
      const savedTask = await repository.update(id, normalizedChanges);
      if (!mountedRef.current) return;
      setTasks((current) =>
        current.map((task) => (task.id === id ? savedTask : task))
      );
    } catch {
      if (!mountedRef.current) return;
      setTasks((current) =>
        current.map((task) => (task.id === id ? previousTask : task))
      );
      setError("Could not update task.");
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasksRef.current.find((candidate) => candidate.id === id);
    if (!task) return;
    await updateTask(id, { completed: !task.completed });
  };

  const deleteTask = async (id: string) => {
    const task = tasksRef.current.find((candidate) => candidate.id === id);
    if (!task) return;

    setError(null);
    setTasks((current) => current.filter((candidate) => candidate.id !== id));
    setExpandedTaskId((current) => (current === id ? null : current));
    setDeletedTask(task);
    if (undoTimerRef.current) globalThis.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = globalThis.setTimeout(() => {
      setDeletedTask(null);
      undoTimerRef.current = null;
    }, 5_000);

    try {
      const repository = await getRepository();
      await repository.delete(id);
    } catch {
      if (!mountedRef.current) return;
      if (undoTimerRef.current) globalThis.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
      setTasks((current) => [...current, task]);
      setDeletedTask(null);
      setError("Could not delete task.");
    }
  };

  const undoDelete = async () => {
    const task = deletedTaskRef.current;
    if (!task) return;
    if (undoTimerRef.current) globalThis.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;

    try {
      const repository = await getRepository();
      const restoredTask = await repository.restore(task);
      if (!mountedRef.current) return;
      setTasks((current) => [...current, restoredTask]);
      setDeletedTask(null);
      setExpandedTaskId(restoredTask.id);
      setError(null);
    } catch {
      if (!mountedRef.current) return;
      setError("Could not restore task.");
      undoTimerRef.current = globalThis.setTimeout(() => {
        setDeletedTask(null);
        undoTimerRef.current = null;
      }, 5_000);
    }
  };

  return {
    status,
    error,
    tasks,
    visibleTasks,
    counts,
    activeView,
    query,
    expandedTaskId,
    deletedTask,
    setView,
    setQuery,
    toggleExpanded,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    undoDelete,
    retryLoad: loadTasks,
  };
}
