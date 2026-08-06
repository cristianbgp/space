import { exampleNoteSeeds } from "@/lib/notes/example-notes";
import type { NotesRepository } from "@/lib/notes/repository";

let repositoryPromise: Promise<NotesRepository> | null = null;

export function getNotesRepository(): Promise<NotesRepository> {
  repositoryPromise ??= import(
    "@/lib/notes/indexed-db-notes-repository"
  ).then(
    ({ IndexedDbNotesRepository }) =>
      new IndexedDbNotesRepository({
        databaseName: "space-notes",
        seeds: exampleNoteSeeds,
      })
  );

  return repositoryPromise;
}
