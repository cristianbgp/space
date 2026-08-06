import Dexie, { type Table } from "dexie";

import {
  TasksRepositoryError,
  type TasksRepository,
} from "@/lib/tasks/repository";
import type {
  CreateTaskInput,
  Task,
  TaskPriority,
  TaskSeed,
  TasksQuery,
  UpdateTaskInput,
} from "@/lib/tasks/types";

interface TasksMetadata {
  key: string;
  value: boolean;
}

interface IndexedDbTasksRepositoryOptions {
  databaseName: string;
  seeds: ReadonlyArray<TaskSeed>;
  now?: () => Date;
}

class TasksDatabase extends Dexie {
  tasks!: Table<Task, string>;
  metadata!: Table<TasksMetadata, string>;

  constructor(databaseName: string) {
    super(databaseName);
    this.version(1).stores({
      tasks: "id, completed, priority, dueDate, createdAt, updatedAt, completedAt",
      metadata: "key",
    });
  }
}

const priorityWeight: Record<TaskPriority, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

function compareTasks(a: Task, b: Task): number {
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
}

function normalizeRepositoryError(error: unknown, fallback: string) {
  if (error instanceof TasksRepositoryError) return error;

  return new TasksRepositoryError(fallback, {
    cause: error instanceof Error ? error : undefined,
  });
}

function normalizeTitle(title: string): string {
  const normalized = title.trim();
  if (!normalized) throw new TasksRepositoryError("Task title is required.");
  return normalized;
}

export class IndexedDbTasksRepository implements TasksRepository {
  private readonly database: TasksDatabase;
  private readonly now: () => Date;
  private readonly seeds: ReadonlyArray<TaskSeed>;
  private initializePromise: Promise<void> | null = null;

  constructor({
    databaseName,
    seeds,
    now = () => new Date(),
  }: IndexedDbTasksRepositoryOptions) {
    this.database = new TasksDatabase(databaseName);
    this.seeds = seeds;
    this.now = now;
  }

  async list(options?: TasksQuery): Promise<Task[]> {
    try {
      await this.initialize();
      const query = options?.query?.trim().toLocaleLowerCase();
      const tasks = await this.database.tasks.toArray();
      const filteredTasks = query
        ? tasks.filter((task) => task.title.toLocaleLowerCase().includes(query))
        : tasks;
      return filteredTasks.sort(compareTasks);
    } catch (error) {
      throw normalizeRepositoryError(error, "Could not load tasks.");
    }
  }

  async get(id: string): Promise<Task | null> {
    try {
      await this.initialize();
      return (await this.database.tasks.get(id)) ?? null;
    } catch (error) {
      throw normalizeRepositoryError(error, "Could not load task.");
    }
  }

  async create(input: CreateTaskInput): Promise<Task> {
    try {
      await this.initialize();
      const timestamp = this.now().toISOString();
      const task: Task = {
        id: crypto.randomUUID(),
        title: normalizeTitle(input.title),
        completed: false,
        priority: input.priority ?? "none",
        dueDate: input.dueDate ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: null,
      };

      await this.database.tasks.add(task);
      return task;
    } catch (error) {
      throw normalizeRepositoryError(error, "Could not create task.");
    }
  }

  async update(id: string, changes: UpdateTaskInput): Promise<Task> {
    try {
      await this.initialize();
      const existingTask = await this.database.tasks.get(id);
      if (!existingTask) throw new TasksRepositoryError("Could not update task.");

      const timestamp = this.now().toISOString();
      const completed = changes.completed ?? existingTask.completed;
      const updatedTask: Task = {
        ...existingTask,
        ...changes,
        title:
          changes.title === undefined
            ? existingTask.title
            : normalizeTitle(changes.title),
        completed,
        completedAt:
          changes.completed === undefined
            ? existingTask.completedAt
            : completed
              ? timestamp
              : null,
        updatedAt: timestamp,
      };

      await this.database.tasks.put(updatedTask);
      return updatedTask;
    } catch (error) {
      throw normalizeRepositoryError(error, "Could not update task.");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.initialize();
      await this.database.tasks.delete(id);
    } catch (error) {
      throw normalizeRepositoryError(error, "Could not delete task.");
    }
  }

  async restore(task: Task): Promise<Task> {
    try {
      await this.initialize();
      await this.database.tasks.put(task);
      return task;
    } catch (error) {
      throw normalizeRepositoryError(error, "Could not restore task.");
    }
  }

  private initialize(): Promise<void> {
    this.initializePromise ??= this.seedOnce();
    return this.initializePromise;
  }

  private async seedOnce(): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.tasks,
      this.database.metadata,
      async () => {
        if (await this.database.metadata.get("seeded")) return;

        const initialTime = this.now().getTime();
        const tasks = this.seeds.map<Task>((seed, index) => {
          const timestamp = new Date(initialTime - index).toISOString();
          const completed = seed.completed ?? false;
          return {
            id: crypto.randomUUID(),
            title: normalizeTitle(seed.title),
            completed,
            priority: seed.priority ?? "none",
            dueDate: seed.dueDate ?? null,
            createdAt: timestamp,
            updatedAt: timestamp,
            completedAt: completed ? timestamp : null,
          };
        });

        if (tasks.length > 0) await this.database.tasks.bulkAdd(tasks);
        await this.database.metadata.put({ key: "seeded", value: true });
      }
    );
  }
}
