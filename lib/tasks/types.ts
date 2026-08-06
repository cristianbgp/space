export type TaskPriority = "none" | "low" | "medium" | "high";

export type TaskView = "today" | "upcoming" | "all" | "completed";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateTaskInput {
  title: string;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export type UpdateTaskInput = Partial<
  Pick<Task, "title" | "completed" | "priority" | "dueDate">
>;

export interface TasksQuery {
  query?: string;
}

export interface TaskSeed extends CreateTaskInput {
  completed?: boolean;
}
