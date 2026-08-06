import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NotesEditor } from "@/components/mini-apps/notes/NotesEditor";
import { NotesEmptyState } from "@/components/mini-apps/notes/NotesEmptyState";
import { NotesSidebar } from "@/components/mini-apps/notes/NotesSidebar";
import { NotesUndo } from "@/components/mini-apps/notes/NotesUndo";
import type { Note } from "@/lib/notes/types";

vi.mock("@/components/mdx-editor", async () => {
  const ReactModule = await import("react");
  const Editor = ReactModule.forwardRef<
    { setMarkdown(markdown: string): void },
    { markdown: string; onChange?(markdown: string): void }
  >(function Editor({ markdown, onChange }, ref) {
    const [value, setValue] = ReactModule.useState(markdown);
    ReactModule.useImperativeHandle(ref, () => ({ setMarkdown: setValue }));

    return (
      <textarea
        aria-label="Note content"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          onChange?.(event.target.value);
        }}
      />
    );
  });

  return { MDXEditor: Editor };
});

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

describe("NotesSidebar", () => {
  it("renders search, create, note rows, and selected state", () => {
    render(
      <NotesSidebar
        notes={[newerNote, olderNote]}
        query=""
        selectedNoteId={newerNote.id}
        onCreate={vi.fn()}
        onQueryChange={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    expect(
      screen.getByRole("searchbox", { name: "Search notes" })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /New note/i })).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: /Newer note/i })
        .getAttribute("aria-current")
    ).toBe("true");
  });

  it("sends search, create, and selection interactions through callbacks", () => {
    const onCreate = vi.fn();
    const onQueryChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <NotesSidebar
        notes={[newerNote]}
        query=""
        selectedNoteId={null}
        onCreate={onCreate}
        onQueryChange={onQueryChange}
        onSelect={onSelect}
      />
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search notes" }), {
      target: { value: "new" },
    });
    fireEvent.click(screen.getByRole("button", { name: /New note/i }));
    fireEvent.click(screen.getByRole("button", { name: /Newer note/i }));

    expect(onQueryChange).toHaveBeenCalledWith("new");
    expect(onCreate).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(newerNote.id);
  });

  it("shows distinct empty-library and no-results messages", () => {
    const { rerender } = render(
      <NotesSidebar
        notes={[]}
        query=""
        selectedNoteId={null}
        onCreate={vi.fn()}
        onQueryChange={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText("Create your first note")).toBeTruthy();

    rerender(
      <NotesSidebar
        notes={[]}
        query="missing"
        selectedNoteId={null}
        onCreate={vi.fn()}
        onQueryChange={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText("No notes found")).toBeTruthy();
  });
});

describe("NotesEditor", () => {
  it("sends title and markdown edits through storage-neutral callbacks", () => {
    const onChange = vi.fn();
    render(
      <NotesEditor
        focusTitleRequest={0}
        note={newerNote}
        saveState="saved"
        onChange={onChange}
        onDelete={vi.fn()}
        onRetrySave={vi.fn()}
      />
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Note title" }), {
      target: { value: "Renamed" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Note content" }), {
      target: { value: "Updated markdown" },
    });

    expect(onChange).toHaveBeenCalledWith({ title: "Renamed" });
    expect(onChange).toHaveBeenCalledWith({ content: "Updated markdown" });
  });

  it("shows save status, retry, and an accessible delete control", () => {
    const onDelete = vi.fn();
    const onRetrySave = vi.fn();
    const { rerender } = render(
      <NotesEditor
        focusTitleRequest={0}
        note={newerNote}
        saveState="saving"
        onChange={vi.fn()}
        onDelete={onDelete}
        onRetrySave={onRetrySave}
      />
    );
    expect(screen.getByText("Saving…")).toBeTruthy();

    rerender(
      <NotesEditor
        focusTitleRequest={0}
        note={newerNote}
        saveState="error"
        onChange={vi.fn()}
        onDelete={onDelete}
        onRetrySave={onRetrySave}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry save" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete note" }));

    expect(screen.getByText("Not saved")).toBeTruthy();
    expect(onRetrySave).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});

describe("Notes support states", () => {
  it("renders a recoverable load error", () => {
    const onRetry = vi.fn();
    render(<NotesEmptyState mode="error" onRetry={onRetry} />);

    expect(screen.getByText("Could not load notes.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading notes" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("announces deletion and invokes Undo", () => {
    const onUndo = vi.fn();
    render(<NotesUndo note={olderNote} onUndo={onUndo} />);

    expect(screen.getByRole("status").textContent).toContain("Note deleted");
    fireEvent.click(screen.getByRole("button", { name: "Undo delete" }));
    expect(onUndo).toHaveBeenCalledOnce();
  });
});
