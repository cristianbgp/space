import { createExampleTaskSeeds } from "@/lib/tasks/example-tasks";
import type { TasksRepository } from "@/lib/tasks/repository";

let repositoryPromise: Promise<TasksRepository> | null = null;

export function getTasksRepository(): Promise<TasksRepository> {
  repositoryPromise ??= import(
    "@/lib/tasks/indexed-db-tasks-repository"
  ).then(
    ({ IndexedDbTasksRepository }) =>
      new IndexedDbTasksRepository({
        databaseName: "space-tasks",
        seeds: createExampleTaskSeeds(),
      })
  );

  return repositoryPromise;
}
