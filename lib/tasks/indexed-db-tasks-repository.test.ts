import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import { IndexedDbTasksRepository } from "@/lib/tasks/indexed-db-tasks-repository";

const databaseNames: string[] = [];

function createRepository(options?: {
  seeds?: Array<{
    title: string;
    priority?: "none" | "low" | "medium" | "high";
    dueDate?: string | null;
    completed?: boolean;
  }>;
}) {
  const databaseName = `space-tasks-${crypto.randomUUID()}`;
  databaseNames.push(databaseName);
  let currentTime = new Date("2026-08-06T12:00:00.000Z");

  return {
    repository: new IndexedDbTasksRepository({
      databaseName,
      seeds: options?.seeds ?? [],
      now: () => currentTime,
    }),
    setTime(value: string) {
      currentTime = new Date(value);
    },
  };
}

afterEach(async () => {
  await Promise.all(databaseNames.splice(0).map((name) => Dexie.delete(name)));
});

describe("IndexedDbTasksRepository", () => {
  it("seeds once and does not reseed after every task is deleted", async () => {
    const { repository } = createRepository({
      seeds: [{ title: "First task", priority: "medium" }],
    });

    const seeded = await repository.list();
    expect(seeded.map((task) => task.title)).toEqual(["First task"]);

    await repository.delete(seeded[0].id);

    expect(await repository.list()).toEqual([]);
  });

  it("creates, completes, reopens, retrieves, deletes, and restores a task", async () => {
    const { repository, setTime } = createRepository();

    const created = await repository.create({ title: "  Draft task  " });
    expect(created).toMatchObject({
      title: "Draft task",
      completed: false,
      completedAt: null,
      dueDate: null,
      priority: "none",
    });

    setTime("2026-08-06T13:00:00.000Z");
    const completed = await repository.update(created.id, { completed: true });
    expect(completed.completedAt).toBe("2026-08-06T13:00:00.000Z");

    setTime("2026-08-06T14:00:00.000Z");
    const reopened = await repository.update(created.id, {
      completed: false,
      dueDate: "2026-08-08",
      priority: "high",
      title: "  Revised task  ",
    });
    expect(reopened).toMatchObject({
      title: "Revised task",
      completed: false,
      completedAt: null,
      dueDate: "2026-08-08",
      priority: "high",
    });
    expect(await repository.get(created.id)).toEqual(reopened);

    await repository.delete(created.id);
    expect(await repository.get(created.id)).toBeNull();

    await repository.restore(reopened);
    expect(await repository.get(created.id)).toEqual(reopened);
  });

  it("orders by completion, priority, due date, and creation time and searches titles", async () => {
    const { repository, setTime } = createRepository();

    setTime("2026-08-06T10:00:00.000Z");
    await repository.create({ title: "No priority", dueDate: "2026-08-07" });
    setTime("2026-08-06T11:00:00.000Z");
    await repository.create({
      title: "Medium plan",
      priority: "medium",
      dueDate: "2026-08-06",
    });
    setTime("2026-08-06T12:00:00.000Z");
    const high = await repository.create({ title: "High focus", priority: "high" });
    await repository.update(high.id, { completed: true });

    expect((await repository.list()).map((task) => task.title)).toEqual([
      "Medium plan",
      "No priority",
      "High focus",
    ]);
    expect((await repository.list({ query: "MEDIUM" })).map((task) => task.title)).toEqual([
      "Medium plan",
    ]);
  });

  it("throws a normalized error when updating a missing task", async () => {
    const { repository } = createRepository();

    await expect(
      repository.update("missing", { title: "Unavailable" })
    ).rejects.toMatchObject({ name: "TasksRepositoryError" });
  });
});
