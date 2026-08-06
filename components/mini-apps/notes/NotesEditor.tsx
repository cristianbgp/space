import * as React from "react";
import { PanelLeft, Trash2 } from "lucide-react";
import type { MDXEditorMethods } from "@mdxeditor/editor";

import { MDXEditor } from "@/components/mdx-editor";
import { Button } from "@/components/ui/button";
import type { Note, SaveState, UpdateNoteInput } from "@/lib/notes/types";

interface NotesEditorProps {
  note: Note;
  saveState: SaveState;
  focusTitleRequest: number;
  onChange(changes: UpdateNoteInput): void;
  onDelete(): void;
  onRetrySave(): void;
  onOpenLibrary?(): void;
}

function SaveIndicator({
  saveState,
  onRetrySave,
}: Pick<NotesEditorProps, "saveState" | "onRetrySave">) {
  if (saveState === "error") {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Not saved</span>
        <button
          aria-label="Retry save"
          className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          onClick={onRetrySave}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <span className="text-[10px] text-muted-foreground" role="status">
      {saveState === "saving" ? "Saving…" : "Saved locally"}
    </span>
  );
}

export function NotesEditor({
  note,
  saveState,
  focusTitleRequest,
  onChange,
  onDelete,
  onRetrySave,
  onOpenLibrary,
}: NotesEditorProps) {
  const editorRef = React.useRef<MDXEditorMethods>(null);
  const titleRef = React.useRef<HTMLInputElement>(null);
  const previousNoteIdRef = React.useRef(note.id);

  React.useEffect(() => {
    if (previousNoteIdRef.current !== note.id) {
      previousNoteIdRef.current = note.id;
      editorRef.current?.setMarkdown(note.content);
    }
  }, [note.content, note.id]);

  React.useEffect(() => {
    if (focusTitleRequest > 0) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [focusTitleRequest]);

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-card">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card/85 px-3 backdrop-blur-xl">
        {onOpenLibrary ? (
          <Button
            aria-label="Open note library"
            className="size-7 shrink-0 md:hidden"
            onClick={onOpenLibrary}
            size="icon"
            variant="ghost"
          >
            <PanelLeft aria-hidden="true" className="size-3.5" />
          </Button>
        ) : null}
        <input
          aria-label="Note title"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Untitled"
          ref={titleRef}
          value={note.title}
        />
        <SaveIndicator onRetrySave={onRetrySave} saveState={saveState} />
        <Button
          aria-label="Delete note"
          className="size-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          size="icon"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-card">
        <MDXEditor
          markdown={note.content}
          onChange={(content) => onChange({ content })}
          ref={editorRef}
        />
      </div>
    </section>
  );
}
