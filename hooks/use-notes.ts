import * as React from "react";

import type { NotesRepository } from "@/lib/notes/repository";
import type {
  Note,
  SaveState,
  UpdateNoteInput,
} from "@/lib/notes/types";

export type NotesStatus = "loading" | "ready" | "error";

export interface UseNotesResult {
  status: NotesStatus;
  error: string | null;
  notes: Note[];
  filteredNotes: Note[];
  selectedNote: Note | null;
  selectedNoteId: string | null;
  query: string;
  saveState: SaveState;
  deletedNote: Note | null;
  focusTitleRequest: number;
  setQuery(query: string): void;
  selectNote(id: string): void;
  createNote(): Promise<void>;
  updateDraft(changes: UpdateNoteInput): void;
  deleteSelectedNote(): Promise<void>;
  undoDelete(): Promise<void>;
  retryLoad(): Promise<void>;
  retrySave(): Promise<void>;
}

interface PendingSave {
  id: string;
  changes: UpdateNoteInput;
}

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function useNotes(
  repositoryFactory: () => Promise<NotesRepository>
): UseNotesResult {
  const factoryRef = React.useRef(repositoryFactory);
  const repositoryPromiseRef = React.useRef<Promise<NotesRepository> | null>(
    null
  );
  const mountedRef = React.useRef(true);
  const selectedNoteIdRef = React.useRef<string | null>(null);
  const pendingSavesRef = React.useRef(new Map<string, UpdateNoteInput>());
  const saveTimersRef = React.useRef(
    new Map<string, ReturnType<typeof globalThis.setTimeout>>()
  );
  const failedSaveRef = React.useRef<PendingSave | null>(null);
  const deletedNoteRef = React.useRef<Note | null>(null);
  const undoTimerRef = React.useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);

  const [status, setStatus] = React.useState<NotesStatus>("loading");
  const [error, setError] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(
    null
  );
  const [query, setQuery] = React.useState("");
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [deletedNote, setDeletedNote] = React.useState<Note | null>(null);
  const [focusTitleRequest, setFocusTitleRequest] = React.useState(0);

  const getRepository = React.useCallback(() => {
    repositoryPromiseRef.current ??= factoryRef.current();
    return repositoryPromiseRef.current;
  }, []);

  const updateDeletedNote = React.useCallback((note: Note | null) => {
    deletedNoteRef.current = note;
    setDeletedNote(note);
  }, []);

  const updateSelection = React.useCallback((id: string | null) => {
    selectedNoteIdRef.current = id;
    setSelectedNoteId(id);

    if (!id) {
      setSaveState("idle");
    } else if (failedSaveRef.current?.id === id) {
      setSaveState("error");
    } else if (pendingSavesRef.current.has(id)) {
      setSaveState("saving");
    } else {
      setSaveState("saved");
    }
  }, []);

  const loadNotes = React.useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const repository = await getRepository();
      const loadedNotes = await repository.list();
      if (!mountedRef.current) return;

      const sortedNotes = sortNotes(loadedNotes);
      setNotes(sortedNotes);
      const currentSelection = selectedNoteIdRef.current;
      const nextSelection = sortedNotes.some(
        (note) => note.id === currentSelection
      )
        ? currentSelection
        : (sortedNotes[0]?.id ?? null);
      updateSelection(nextSelection);
      setStatus("ready");
    } catch {
      if (!mountedRef.current) return;
      setStatus("error");
      setError("Could not load notes.");
    }
  }, [getRepository, updateSelection]);

  React.useEffect(() => {
    mountedRef.current = true;
    const saveTimers = saveTimersRef.current;
    void loadNotes();

    return () => {
      mountedRef.current = false;
      saveTimers.forEach((timer) => globalThis.clearTimeout(timer));
      saveTimers.clear();
      if (undoTimerRef.current) globalThis.clearTimeout(undoTimerRef.current);
    };
  }, [loadNotes]);

  const persistNote = async (id: string) => {
    const changes = pendingSavesRef.current.get(id);
    if (!changes) return;

    pendingSavesRef.current.delete(id);
    saveTimersRef.current.delete(id);

    try {
      const repository = await getRepository();
      const savedNote = await repository.update(id, changes);
      if (!mountedRef.current) return;

      failedSaveRef.current =
        failedSaveRef.current?.id === id ? null : failedSaveRef.current;
      setNotes((currentNotes) => {
        const newerChanges = pendingSavesRef.current.get(id);
        return sortNotes(
          currentNotes.map((note) =>
            note.id === id
              ? { ...savedNote, ...(newerChanges ?? {}) }
              : note
          )
        );
      });
      if (selectedNoteIdRef.current === id) {
        setSaveState(pendingSavesRef.current.has(id) ? "saving" : "saved");
      }
    } catch {
      if (!mountedRef.current) return;
      failedSaveRef.current = { id, changes };
      if (selectedNoteIdRef.current === id) setSaveState("error");
    }
  };

  const createNote = async () => {
    setError(null);
    try {
      const repository = await getRepository();
      const note = await repository.create();
      if (!mountedRef.current) return;

      setNotes((currentNotes) => sortNotes([note, ...currentNotes]));
      updateSelection(note.id);
      setFocusTitleRequest((request) => request + 1);
    } catch {
      if (mountedRef.current) setError("Could not create note.");
    }
  };

  const updateDraft = (changes: UpdateNoteInput) => {
    const id = selectedNoteIdRef.current;
    if (!id || Object.keys(changes).length === 0) return;

    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === id ? { ...note, ...changes } : note
      )
    );
    setSaveState("saving");

    const failedChanges =
      failedSaveRef.current?.id === id ? failedSaveRef.current.changes : {};
    const pendingChanges = pendingSavesRef.current.get(id) ?? {};
    pendingSavesRef.current.set(id, {
      ...failedChanges,
      ...pendingChanges,
      ...changes,
    });
    if (failedSaveRef.current?.id === id) failedSaveRef.current = null;

    const existingTimer = saveTimersRef.current.get(id);
    if (existingTimer) globalThis.clearTimeout(existingTimer);
    const timer = globalThis.setTimeout(() => {
      void persistNote(id);
    }, 500);
    saveTimersRef.current.set(id, timer);
  };

  const selectNote = (id: string) => {
    updateSelection(id);
    setError(null);
  };

  const deleteSelectedNote = async () => {
    const note = notes.find((candidate) => candidate.id === selectedNoteId);
    if (!note) return;

    setError(null);
    const remainingNotes = notes.filter((candidate) => candidate.id !== note.id);
    const pendingTimer = saveTimersRef.current.get(note.id);
    if (pendingTimer) globalThis.clearTimeout(pendingTimer);
    saveTimersRef.current.delete(note.id);
    pendingSavesRef.current.delete(note.id);
    if (failedSaveRef.current?.id === note.id) failedSaveRef.current = null;

    setNotes(remainingNotes);
    updateSelection(remainingNotes[0]?.id ?? null);
    updateDeletedNote(note);
    if (undoTimerRef.current) globalThis.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = globalThis.setTimeout(() => {
      updateDeletedNote(null);
      undoTimerRef.current = null;
    }, 5_000);

    try {
      const repository = await getRepository();
      await repository.delete(note.id);
    } catch {
      if (!mountedRef.current) return;
      if (undoTimerRef.current) globalThis.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
      setNotes((currentNotes) => sortNotes([...currentNotes, note]));
      updateSelection(note.id);
      updateDeletedNote(null);
      setError("Could not delete note.");
    }
  };

  const undoDelete = async () => {
    const note = deletedNoteRef.current;
    if (!note) return;
    if (undoTimerRef.current) globalThis.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;

    try {
      const repository = await getRepository();
      const restoredNote = await repository.restore(note);
      if (!mountedRef.current) return;

      setNotes((currentNotes) => sortNotes([...currentNotes, restoredNote]));
      updateSelection(restoredNote.id);
      updateDeletedNote(null);
      setError(null);
    } catch {
      if (!mountedRef.current) return;
      setError("Could not restore note.");
      undoTimerRef.current = globalThis.setTimeout(() => {
        updateDeletedNote(null);
        undoTimerRef.current = null;
      }, 5_000);
    }
  };

  const retrySave = async () => {
    const failedSave = failedSaveRef.current;
    if (!failedSave) return;

    pendingSavesRef.current.set(failedSave.id, failedSave.changes);
    failedSaveRef.current = null;
    setSaveState("saving");
    await persistNote(failedSave.id);
  };

  const selectedNote =
    notes.find((note) => note.id === selectedNoteId) ?? null;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredNotes = normalizedQuery
    ? notes.filter(
        (note) =>
          note.title.toLocaleLowerCase().includes(normalizedQuery) ||
          note.content.toLocaleLowerCase().includes(normalizedQuery)
      )
    : notes;

  return {
    status,
    error,
    notes,
    filteredNotes,
    selectedNote,
    selectedNoteId,
    query,
    saveState,
    deletedNote,
    focusTitleRequest,
    setQuery,
    selectNote,
    createNote,
    updateDraft,
    deleteSelectedNote,
    undoDelete,
    retryLoad: loadNotes,
    retrySave,
  };
}
