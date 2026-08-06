export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title?: string;
  content?: string;
}

export type UpdateNoteInput = Partial<Pick<Note, "title" | "content">>;

export interface NotesQuery {
  query?: string;
}

export type SaveState = "idle" | "saving" | "saved" | "error";
