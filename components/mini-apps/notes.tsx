"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";

import { NotesEditor } from "@/components/mini-apps/notes/NotesEditor";
import { NotesEmptyState } from "@/components/mini-apps/notes/NotesEmptyState";
import { NotesSidebar } from "@/components/mini-apps/notes/NotesSidebar";
import { NotesUndo } from "@/components/mini-apps/notes/NotesUndo";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotes } from "@/hooks/use-notes";
import { getNotesRepository } from "@/lib/notes";

export function NotesApp() {
  const notes = useNotes(getNotesRepository);
  const isMobile = useIsMobile();
  const [libraryOpen, setLibraryOpen] = React.useState(false);

  const handleCreate = async () => {
    await notes.createNote();
    if (isMobile) setLibraryOpen(false);
  };

  const handleSelect = (id: string) => {
    notes.selectNote(id);
    if (isMobile) setLibraryOpen(false);
  };

  const sidebar = (
    <NotesSidebar
      notes={notes.filteredNotes}
      onCreate={() => void handleCreate()}
      onQueryChange={notes.setQuery}
      onSelect={handleSelect}
      query={notes.query}
      selectedNoteId={notes.selectedNoteId}
    />
  );

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-card">
      <div className="hidden h-full shrink-0 md:flex">{sidebar}</div>

      <Sheet onOpenChange={setLibraryOpen} open={libraryOpen}>
        <SheetContent
          className="w-[min(84vw,16rem)] gap-0 border-sidebar-border p-0"
          side="left"
        >
          <SheetTitle className="sr-only">Note library</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      <AnimatePresence mode="wait">
        {notes.status === "loading" ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="min-w-0 flex-1"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="loading"
            transition={{ duration: 0.15 }}
          >
            <NotesEmptyState mode="loading" />
          </motion.div>
        ) : notes.status === "error" ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="min-w-0 flex-1"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="error"
            transition={{ duration: 0.15 }}
          >
            <NotesEmptyState mode="error" onRetry={notes.retryLoad} />
          </motion.div>
        ) : notes.selectedNote ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="min-w-0 flex-1"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key={notes.selectedNote.id}
            transition={{ duration: 0.18 }}
          >
            <NotesEditor
              focusTitleRequest={notes.focusTitleRequest}
              note={notes.selectedNote}
              onChange={notes.updateDraft}
              onDelete={() => void notes.deleteSelectedNote()}
              onOpenLibrary={() => setLibraryOpen(true)}
              onRetrySave={() => void notes.retrySave()}
              saveState={notes.saveState}
            />
          </motion.div>
        ) : (
          <motion.div
            animate={{ opacity: 1 }}
            className="min-w-0 flex-1"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="empty"
            transition={{ duration: 0.15 }}
          >
            <NotesEmptyState
              mode="empty"
              onOpenLibrary={() => setLibraryOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {notes.status === "ready" && notes.error ? (
        <div
          aria-live="polite"
          className="absolute right-3 bottom-3 z-10 rounded-md border border-border bg-popover/95 px-3 py-2 text-xs text-popover-foreground shadow-md backdrop-blur-xl"
        >
          {notes.error}
        </div>
      ) : null}

      <AnimatePresence>
        {notes.deletedNote ? (
          <NotesUndo
            key={notes.deletedNote.id}
            note={notes.deletedNote}
            onUndo={() => void notes.undoDelete()}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
