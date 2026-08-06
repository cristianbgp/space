import type {
  CreateNoteInput,
  Note,
  NotesQuery,
  UpdateNoteInput,
} from "@/lib/notes/types";

export interface NotesRepository {
  list(options?: NotesQuery): Promise<Note[]>;
  get(id: string): Promise<Note | null>;
  create(input?: CreateNoteInput): Promise<Note>;
  update(id: string, changes: UpdateNoteInput): Promise<Note>;
  delete(id: string): Promise<void>;
  restore(note: Note): Promise<Note>;
}

export class NotesRepositoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "NotesRepositoryError";
  }
}
