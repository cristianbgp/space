import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import type { Note } from "@/lib/notes/types";

interface NotesUndoProps {
  note: Note;
  onUndo(): void;
}

export function NotesUndo({ note, onUndo }: NotesUndoProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-3 left-1/2 z-20 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-popover/95 px-3 py-2 text-popover-foreground shadow-lg backdrop-blur-xl"
      exit={{ opacity: 0, y: 6 }}
      initial={{ opacity: 0, y: 6 }}
      role="status"
      transition={{ duration: 0.18 }}
    >
      <span className="min-w-0 truncate text-xs">
        Note deleted
        <span className="sr-only">: {note.title}</span>
      </span>
      <Button
        aria-label="Undo delete"
        className="h-6 px-2 text-[10px]"
        onClick={onUndo}
        size="sm"
        variant="outline"
      >
        Undo
      </Button>
    </motion.div>
  );
}
