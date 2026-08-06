# Notes Local Persistence Design

## Goal

Turn the existing Notes demo into a polished, useful local-first mini-app while preserving the visual language of `.space`. Notes must persist without an account or server database today, and its UI must remain independent of the storage technology so a future Next.js API backed by Drizzle or Prisma and PostgreSQL can replace local storage cleanly.

## Scope

The first release includes:

- Persistent notes stored in the current browser.
- Create, edit, rename, search, and delete operations.
- Debounced autosave with visible save state.
- Recently updated ordering.
- Example notes seeded only on first use.
- An undo period after deletion.
- Loading, empty, no-results, and storage-error states.
- A responsive library/editor layout suitable for desktop and mobile windows.

Folders, tags, accounts, collaboration, synchronization, rich attachments, import/export, and PostgreSQL are intentionally excluded.

## Visual Direction

Use the approved **Quiet Editor** direction.

The app keeps a balanced two-pane layout: a compact note library on the left and a spacious editor on the right. Search and the primary new-note action sit at the top of the library. The selected note uses a low-contrast neutral surface rather than a saturated accent. The editor header contains the editable title and a quiet save-state label; the formatting toolbar visually recedes below it.

The implementation must reuse the project's existing grayscale design tokens, Geist typography, fine borders, small radii, translucent surfaces, restrained shadows, and short Motion transitions. It must feel like part of the existing menu bar, dock, and window system rather than a separate design system.

Below the project's existing 768 px mobile breakpoint, the library becomes a slide-over panel and the editor occupies the available window. Empty and error states use concise copy and Lucide icons without oversized illustrations.

## Domain Model

The application-level note model remains independent of Dexie and any future ORM:

```ts
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

IDs are portable UUID strings generated with `crypto.randomUUID()`. Dates are ISO 8601 strings so they cross IndexedDB, JSON, API, and PostgreSQL boundaries without adapter-specific conversion in UI components.

## Persistence Boundary

All persistence is accessed through an asynchronous repository contract:

```ts
interface NotesRepository {
  list(options?: { query?: string }): Promise<Note[]>;
  get(id: string): Promise<Note | null>;
  create(input?: { title?: string; content?: string }): Promise<Note>;
  update(id: string, changes: Partial<Pick<Note, "title" | "content">>): Promise<Note>;
  delete(id: string): Promise<void>;
  restore(note: Note): Promise<Note>;
}
```

The local implementation uses IndexedDB through Dexie. Dexie types, tables, and query expressions stay inside the adapter. The repository returns domain `Note` values only.

The repository is selected at one composition point and supplied to application logic. React components and editor components must not import Dexie directly.

The future server-backed shape is:

```text
Notes UI
  -> NotesRepository
  -> ApiNotesRepository
  -> Next.js route handlers
  -> DrizzleNotesRepository or PrismaNotesRepository
  -> PostgreSQL
```

Changing ORM later affects only the server repository. Switching the browser app from local data to server data replaces the local adapter with the API adapter. Migrating existing browser notes to an account is separate future work and can use the same repository methods.

## Application State and Data Flow

A focused Notes controller hook owns list loading, selection, search, mutations, autosave state, and recoverable errors. Presentational components receive typed state and callbacks from that hook.

Startup proceeds as follows:

1. Open the local database.
2. Seed the existing examples in a single local transaction only when the database has never been initialized.
3. Load notes ordered by `updatedAt` descending.
4. Select the most recently updated note.

Creating a note persists an `Untitled` record immediately, selects it, and focuses the title. Title and markdown changes update the visible draft immediately and are persisted after a 500 ms debounce. Each save is tied to the note ID that produced it so switching notes cannot save content into the wrong record.

Search is case-insensitive across title and markdown content. Because the first release is local and modest in size, filtering can occur after an ordered repository read while the repository contract retains a query option for a future server-side implementation.

Deletion removes the selected note immediately and selects the next available note. The deleted value is retained in memory for a five-second undo window. Undo calls `restore`; expiration only clears the temporary value because the record has already been removed.

## Component Boundaries

- `NotesApp`: composition shell and responsive layout.
- `NotesSidebar`: search, new-note action, note list, empty results, and selection.
- `NotesEditor`: editable title, save state, delete action, and MDX editor.
- `NotesEmptyState`: shown when no note is selected.
- `NotesUndo`: temporary undo affordance after deletion.
- `useNotes`: controller for repository reads, mutations, selection, and error recovery.
- `NotesRepository`: storage-neutral contract.
- `IndexedDbNotesRepository`: Dexie adapter and local schema.

Components should remain small enough that storage behavior, editor behavior, and layout can evolve independently.

## Error Handling

Initial storage failure displays an in-window error state with a retry action. A failed create leaves the current list unchanged and reports a concise error near the library controls. A failed autosave keeps the local draft visible, changes the indicator to `Not saved`, and offers retry without discarding text. A failed delete restores the note in the visible list.

Repository errors are normalized into application-facing errors. Raw Dexie messages and stack traces are not shown to users.

The app must tolerate an empty database. Unsupported or unavailable browser storage results in the same recoverable error UI rather than a blank Notes window.

## Accessibility and Interaction

All icon-only controls receive accessible names and visible focus styles. Search and title inputs use semantic labels. Keyboard interaction supports creating a note from the primary action, navigating controls by Tab, and editing without window-level shortcuts stealing ordinary editor input.

Animations communicate selection and panel changes but respect reduced-motion preferences through Motion and CSS behavior already used by the project.

## Verification

The repository has no configured test framework, so this increment will be verified with:

- Strict TypeScript checking.
- ESLint on all changed files, followed by the project-wide lint command to expose existing unrelated failures separately.
- A production build when network access permits the existing Google Fonts download.
- Manual browser checks for first-run seeding, reload persistence, CRUD, title/content autosave, rapid note switching, search, delete/undo, empty state, storage errors where practical, and narrow-screen layout.

The repository contract and controller boundaries are intentionally structured so unit tests can be added later without mounting the complete desktop environment.
