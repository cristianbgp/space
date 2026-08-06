import type {
  CreateTaskInput,
  Task,
  TasksQuery,
  UpdateTaskInput,
} from "@/lib/tasks/types";

export interface TasksRepository {
  list(options?: TasksQuery): Promise<Task[]>;
  get(id: string): Promise<Task | null>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, changes: UpdateTaskInput): Promise<Task>;
  delete(id: string): Promise<void>;
  restore(task: Task): Promise<Task>;
}

export class TasksRepositoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TasksRepositoryError";
  }
}
