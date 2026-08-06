import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useNotes } from "@/hooks/use-notes";
import type { NotesRepository } from "@/lib/notes/repository";
import type {
  CreateNoteInput,
  Note,
  NotesQuery,
  UpdateNoteInput,
} from "@/lib/notes/types";

const olderNote: Note = {
  id: "older",
  title: "Older note",
  content: "A quiet draft",
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
};

const newerNote: Note = {
  id: "newer",
  title: "Newer note",
  content: "A louder thought",
  createdAt: "2026-08-02T10:00:00.000Z",
  updatedAt: "2026-08-02T10:00:00.000Z",
};

function copyNote(note: Note): Note {
  return { ...note };
}

class MemoryNotesRepository implements NotesRepository {
  notes: Note[];
  failLoad = false;
  failDelete = false;

  constructor(notes: Note[]) {
    this.notes = notes.map(copyNote);
  }

  async list(options?: NotesQuery): Promise<Note[]> {
    if (this.failLoad) throw new Error("load failed");
    const query = options?.query?.toLocaleLowerCase();
    return this.notes
      .filter(
        (note) =>
          !query ||
          note.title.toLocaleLowerCase().includes(query) ||
          note.content.toLocaleLowerCase().includes(query)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(copyNote);
  }

  async get(id: string): Promise<Note | null> {
    const note = this.notes.find((candidate) => candidate.id === id);
    return note ? copyNote(note) : null;
  }

  async create(input: CreateNoteInput = {}): Promise<Note> {
    const timestamp = "2026-08-03T10:00:00.000Z";
    const note: Note = {
      id: crypto.randomUUID(),
      title: input.title ?? "Untitled",
      content: input.content ?? "",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.notes.push(note);
    return copyNote(note);
  }

  async update(id: string, changes: UpdateNoteInput): Promise<Note> {
    const index = this.notes.findIndex((note) => note.id === id);
    if (index < 0) throw new Error("missing note");
    this.notes[index] = {
      ...this.notes[index],
      ...changes,
      updatedAt: "2026-08-04T10:00:00.000Z",
    };
    return copyNote(this.notes[index]);
  }

  async delete(id: string): Promise<void> {
    if (this.failDelete) throw new Error("delete failed");
    this.notes = this.notes.filter((note) => note.id !== id);
  }

  async restore(note: Note): Promise<Note> {
    this.notes.push(copyNote(note));
    return copyNote(note);
  }
}

async function renderNotes(repository: MemoryNotesRepository) {
  const hook = renderHook(() =>
    useNotes(() => Promise.resolve(repository))
  );
  await waitFor(() => expect(hook.result.current.status).toBe("ready"));
  return hook;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useNotes", () => {
  it("loads notes and selects the most recently updated note", async () => {
    const repository = new MemoryNotesRepository([olderNote, newerNote]);
    const { result } = await renderNotes(repository);

    expect(result.current.notes.map((note) => note.id)).toEqual([
      newerNote.id,
      olderNote.id,
    ]);
    expect(result.current.selectedNote?.id).toBe(newerNote.id);
  });

  it("creates and selects an Untitled note", async () => {
    const repository = new MemoryNotesRepository([]);
    const { result } = await renderNotes(repository);

    await act(() => result.current.createNote());

    expect(result.current.selectedNote?.title).toBe("Untitled");
    expect(result.current.focusTitleRequest).toBe(1);
  });

  it("debounces merged draft persistence for 500 ms", async () => {
    const repository = new MemoryNotesRepository([olderNote]);
    const update = vi.spyOn(repository, "update");
    const { result } = await renderNotes(repository);
    vi.useFakeTimers();

    act(() => result.current.updateDraft({ title: "Changed" }));
    act(() => result.current.updateDraft({ content: "Changed body" }));

    expect(result.current.saveState).toBe("saving");
    expect(update).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(500));

    expect(update).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith(olderNote.id, {
      title: "Changed",
      content: "Changed body",
    });
    expect(result.current.saveState).toBe("saved");
  });

  it("keeps a failed draft visible and retries the same changes", async () => {
    const repository = new MemoryNotesRepository([olderNote]);
    const update = vi
      .spyOn(repository, "update")
      .mockRejectedValueOnce(new Error("offline"));
    const { result } = await renderNotes(repository);
    vi.useFakeTimers();

    act(() => result.current.updateDraft({ title: "Still visible" }));
    await act(async () => vi.advanceTimersByTimeAsync(500));

    expect(result.current.saveState).toBe("error");
    expect(result.current.selectedNote?.title).toBe("Still visible");

    await act(() => result.current.retrySave());

    expect(update).toHaveBeenCalledTimes(2);
    expect(result.current.saveState).toBe("saved");
  });

  it("filters notes by title and content without changing selection", async () => {
    const repository = new MemoryNotesRepository([olderNote, newerNote]);
    const { result } = await renderNotes(repository);

    act(() => result.current.setQuery("QUIET"));

    expect(result.current.filteredNotes.map((note) => note.id)).toEqual([
      olderNote.id,
    ]);
    expect(result.current.selectedNote?.id).toBe(newerNote.id);
  });

  it("deletes immediately and restores within the undo window", async () => {
    const repository = new MemoryNotesRepository([olderNote]);
    const { result } = await renderNotes(repository);
    vi.useFakeTimers();

    await act(() => result.current.deleteSelectedNote());
    expect(result.current.notes).toEqual([]);
    expect(result.current.deletedNote?.id).toBe(olderNote.id);

    await act(() => result.current.undoDelete());

    expect(result.current.selectedNote?.id).toBe(olderNote.id);
    expect(result.current.deletedNote).toBeNull();
  });

  it("rolls back an optimistic delete when persistence fails", async () => {
    const repository = new MemoryNotesRepository([olderNote]);
    repository.failDelete = true;
    const { result } = await renderNotes(repository);

    await act(() => result.current.deleteSelectedNote());

    expect(result.current.notes.map((note) => note.id)).toEqual([olderNote.id]);
    expect(result.current.error).toBe("Could not delete note.");
    expect(result.current.deletedNote).toBeNull();
  });

  it("retries an initial load failure", async () => {
    const repository = new MemoryNotesRepository([olderNote]);
    repository.failLoad = true;
    const { result } = renderHook(() =>
      useNotes(() => Promise.resolve(repository))
    );
    await waitFor(() => expect(result.current.status).toBe("error"));

    repository.failLoad = false;
    await act(() => result.current.retryLoad());

    expect(result.current.status).toBe("ready");
    expect(result.current.selectedNote?.id).toBe(olderNote.id);
  });

  it("expires the deleted-note undo state after five seconds", async () => {
    const repository = new MemoryNotesRepository([olderNote]);
    const { result } = await renderNotes(repository);
    vi.useFakeTimers();

    await act(() => result.current.deleteSelectedNote());
    expect(result.current.deletedNote).not.toBeNull();

    act(() => vi.advanceTimersByTime(5_000));

    expect(result.current.deletedNote).toBeNull();
  });
});
