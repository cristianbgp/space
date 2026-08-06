import { FileText, LoaderCircle, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NotesEmptyStateProps {
  mode: "loading" | "error" | "empty";
  onRetry?(): void;
  onOpenLibrary?(): void;
}

export function NotesEmptyState({
  mode,
  onRetry,
  onOpenLibrary,
}: NotesEmptyStateProps) {
  const isLoading = mode === "loading";
  const isError = mode === "error";
  const Icon = isLoading ? LoaderCircle : isError ? TriangleAlert : FileText;

  return (
    <div className="relative flex h-full min-h-48 flex-1 items-center justify-center bg-card p-6 text-center">
      {onOpenLibrary ? (
        <Button
          aria-label="Open note library"
          className="absolute top-2 left-2 md:hidden"
          onClick={onOpenLibrary}
          size="sm"
          variant="ghost"
        >
          Notes
        </Button>
      ) : null}
      <div className="max-w-56">
        <Icon
          aria-hidden="true"
          className={`mx-auto mb-3 size-6 stroke-1 text-muted-foreground ${
            isLoading ? "animate-spin" : ""
          }`}
        />
        <p className="text-sm font-medium">
          {isLoading
            ? "Loading notes…"
            : isError
              ? "Could not load notes."
              : "No note selected"}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {isLoading
            ? "Opening your local library."
            : isError
              ? "Your local notes are still on this device."
              : "Choose a note from the library or create a new one."}
        </p>
        {isError && onRetry ? (
          <Button
            aria-label="Retry loading notes"
            className="mt-4"
            onClick={onRetry}
            size="sm"
            variant="outline"
          >
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
