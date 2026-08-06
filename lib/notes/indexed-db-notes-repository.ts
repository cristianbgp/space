import Dexie, { type Table } from "dexie";

import {
  NotesRepositoryError,
  type NotesRepository,
} from "@/lib/notes/repository";
import type {
  CreateNoteInput,
  Note,
  NotesQuery,
  UpdateNoteInput,
} from "@/lib/notes/types";

interface NotesMetadata {
  key: string;
  value: boolean;
}

interface IndexedDbNotesRepositoryOptions {
  databaseName: string;
  seeds: ReadonlyArray<Required<CreateNoteInput>>;
  now?: () => Date;
}

class NotesDatabase extends Dexie {
  notes!: Table<Note, string>;
  metadata!: Table<NotesMetadata, string>;

  constructor(databaseName: string) {
    super(databaseName);
    this.version(1).stores({
      notes: "id, updatedAt",
      metadata: "key",
    });
  }
}

function normalizeRepositoryError(error: unknown, fallback: string) {
  if (error instanceof NotesRepositoryError) return error;

  return new NotesRepositoryError(fallback, {
    cause: error instanceof Error ? error : undefined,
  });
}

export class IndexedDbNotesRepository implements NotesRepository {
  private readonly database: NotesDatabase;
  private readonly now: () => Date;
  private readonly seeds: ReadonlyArray<Required<CreateNoteInput>>;
  private initializePromise: Promise<void> | null = null;

  constructor({
    databaseName,
    seeds,
    now = () => new Date(),
  }: IndexedDbNotesRepositoryOptions) {
    this.database = new NotesDatabase(databaseName);
    this.seeds = seeds;
    this.now = now;
  }

  async list(options?: NotesQuery): Promise<Note[]> {
    try {
      await this.initialize();
      const query = options?.query?.trim().toLocaleLowerCase();
      const notes = await this.database.notes.toArray();
      const filteredNotes = query
        ? notes.filter(
            (note) =>
              note.title.toLocaleLowerCase().includes(query) ||
              note.content.toLocaleLowerCase().includes(query)
          )
        : notes;

      return filteredNotes.sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
      );
    } catch (error) {
      throw normalizeRepositoryError(error, "Could not load notes.");
    }
  }

  async get(id: string): Promise<Note | null> {
    try {
      await this.initialize();
      return (await this.database.notes.get(id)) ?? null;
    } catch (error) {
      throw normalizeRepositoryError(error, "Could not load note.");
    }
  }

  async create(input: CreateNoteInput = {}): Promise<Note> {
    try {
      await this.initialize();
      const timestamp = this.now().toISOString();
      const note: Note = {
        id: crypto.randomUUID(),
        title: input.title ?? "Untitled",
        content: input.content ?? "",
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await this.database.notes.add(note);
      return note;
    } catch (error) {
      throw normalizeRepositoryError(error, "Could not create note.");
    }
  }

  async update(id: string, changes: UpdateNoteInput): Promise<Note> {
    try {
      await this.initialize();
      const existingNote = await this.database.notes.get(id);

      if (!existingNote) {
        throw new NotesRepositoryError("Could not update note.");
      }

      const updatedNote: Note = {
        ...existingNote,
        ...changes,
        updatedAt: this.now().toISOString(),
      };

      await this.database.notes.put(updatedNote);
      return updatedNote;
    } catch (error) {
      throw normalizeRepositoryError(error, "Could not update note.");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.initialize();
      await this.database.notes.delete(id);
    } catch (error) {
      throw normalizeRepositoryError(error, "Could not delete note.");
    }
  }

  async restore(note: Note): Promise<Note> {
    try {
      await this.initialize();
      await this.database.notes.put(note);
      return note;
    } catch (error) {
      throw normalizeRepositoryError(error, "Could not restore note.");
    }
  }

  private initialize(): Promise<void> {
    this.initializePromise ??= this.seedOnce();
    return this.initializePromise;
  }

  private async seedOnce(): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.notes,
      this.database.metadata,
      async () => {
        const seeded = await this.database.metadata.get("seeded");
        if (seeded) return;

        const initialTimestamp = this.now().getTime();
        const notes = this.seeds.map<Note>((seed, index) => {
          const timestamp = new Date(initialTimestamp - index).toISOString();
          return {
            id: crypto.randomUUID(),
            title: seed.title,
            content: seed.content,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
        });

        if (notes.length > 0) {
          await this.database.notes.bulkAdd(notes);
        }
        await this.database.metadata.put({ key: "seeded", value: true });
      }
    );
  }
}
