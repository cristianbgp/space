import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import { IndexedDbNotesRepository } from "@/lib/notes/indexed-db-notes-repository";

const databaseNames: string[] = [];

function createRepository() {
  const databaseName = `space-notes-${crypto.randomUUID()}`;
  let timestamp = Date.parse("2026-08-05T12:00:00.000Z");
  databaseNames.push(databaseName);

  return new IndexedDbNotesRepository({
    databaseName,
    now: () => new Date((timestamp += 1_000)),
    seeds: [{ title: "Welcome", content: "First local note" }],
  });
}

afterEach(async () => {
  await Promise.all(
    databaseNames.splice(0).map((databaseName) => Dexie.delete(databaseName))
  );
});

describe("IndexedDbNotesRepository", () => {
  it("seeds once and does not reseed after every note is deleted", async () => {
    const repository = createRepository();
    const seeded = await repository.list();

    expect(seeded).toHaveLength(1);

    await repository.delete(seeded[0].id);

    expect(await repository.list()).toEqual([]);
  });

  it("creates, updates, retrieves, deletes, and restores a note", async () => {
    const repository = createRepository();
    const created = await repository.create({
      title: "Draft",
      content: "One",
    });
    const updated = await repository.update(created.id, { content: "Two" });

    expect(updated.content).toBe("Two");
    expect(await repository.get(created.id)).toEqual(updated);

    await repository.delete(created.id);
    expect(await repository.get(created.id)).toBeNull();

    await repository.restore(created);
    expect(await repository.get(created.id)).toEqual(created);
  });

  it("orders by updatedAt descending", async () => {
    const repository = createRepository();
    const alpha = await repository.create({ title: "Alpha" });
    await repository.create({ title: "Beta" });
    const latest = await repository.update(alpha.id, { content: "Latest" });

    expect((await repository.list()).map((note) => note.id)).toEqual([
      latest.id,
      expect.any(String),
      expect.any(String),
    ]);
  });

  it("searches titles and content case-insensitively", async () => {
    const repository = createRepository();
    await repository.create({ title: "Alpha", content: "quiet" });
    await repository.create({ title: "Beta", content: "LOUD idea" });

    expect(
      (await repository.list({ query: "loud" })).map((note) => note.title)
    ).toEqual(["Beta"]);
    expect(
      (await repository.list({ query: "ALPHA" })).map((note) => note.title)
    ).toEqual(["Alpha"]);
  });

  it("throws a normalized error when updating a missing note", async () => {
    const repository = createRepository();

    await expect(
      repository.update("missing", { title: "Nope" })
    ).rejects.toMatchObject({
      message: "Could not update note.",
      name: "NotesRepositoryError",
    });
  });
});
