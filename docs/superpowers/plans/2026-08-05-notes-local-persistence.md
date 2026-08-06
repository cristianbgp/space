# Notes Local Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static Notes demo with a polished local-first notes application that persists CRUD operations in IndexedDB and can later switch to an API backed by Drizzle or Prisma without changing UI components.

**Architecture:** Domain types and an asynchronous `NotesRepository` contract isolate persistence. A Dexie adapter implements the contract locally, `useNotes` owns application behavior and autosave, and small Notes components render the approved Quiet Editor layout. The local repository is selected in one composition module so a future API repository can replace it.

**Tech Stack:** Next.js 16, React 19, strict TypeScript, Tailwind CSS 4, Motion, Lucide, MDXEditor, Dexie, Vitest, Testing Library, fake-indexeddb.

## Global Constraints

- Preserve the approved Quiet Editor direction and the existing grayscale `.space` visual language.
- Store data locally in IndexedDB; do not add accounts, synchronization, folders, tags, attachments, import/export, or PostgreSQL.
- Keep Dexie types and queries out of React components and application domain types.
- Use UUID strings and ISO 8601 date strings in the domain model.
- Debounce title and markdown persistence by exactly 500 ms.
- Keep deleted notes recoverable for exactly five seconds.
- Use the existing 768 px breakpoint for the mobile slide-over library.
- Follow strict TypeScript, `@/` imports, named component exports, Tailwind, `cn()`, Lucide, and existing shadcn/Radix patterns.
- Preserve unrelated user changes and do not broaden lint cleanup outside files touched by this feature.

---

## File Structure

- `lib/notes/types.ts`: storage-neutral note, input, and save-state types.
- `lib/notes/repository.ts`: asynchronous repository interface and user-facing repository error.
- `lib/notes/example-notes.ts`: seed content, separated from rendering.
- `lib/notes/indexed-db-notes-repository.ts`: Dexie schema, first-run seeding, search, ordering, CRUD, and restore.
- `lib/notes/index.ts`: the only composition point that constructs the local adapter.
- `lib/notes/indexed-db-notes-repository.test.ts`: persistence contract and seed behavior tests.
- `hooks/use-notes.ts`: note loading, selection, optimistic drafts, debounced save, search, delete, undo, retry, and error state.
- `hooks/use-notes.test.tsx`: behavior tests against an in-memory repository double.
- `components/mini-apps/notes/NotesSidebar.tsx`: search, create action, note list, and list states.
- `components/mini-apps/notes/NotesEditor.tsx`: title input, save status, delete action, and MDX editor bridge.
- `components/mini-apps/notes/NotesEmptyState.tsx`: loading, initial error, and no-selection states.
- `components/mini-apps/notes/NotesUndo.tsx`: five-second undo affordance.
- `components/mini-apps/notes.tsx`: repository composition and responsive Quiet Editor shell.
- `components/initialized-mdx-editor.tsx`: extend the existing editor toolbar and Quiet Editor surface styling.
- `package.json`, `bun.lock`: Dexie and test dependencies plus a deterministic test script.

---

### Task 1: Add the Notes Domain and Test Harness

**Files:**
- Create: `lib/notes/types.ts`
- Create: `lib/notes/repository.ts`
- Modify: `package.json`
- Modify: `bun.lock`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

**Interfaces:**
- Produces: `Note`, `CreateNoteInput`, `UpdateNoteInput`, `NotesQuery`, `SaveState`, `NotesRepository`, and `NotesRepositoryError`.
- Consumes: no feature-specific interfaces.

- [ ] **Step 1: Install runtime and test dependencies**

Run:

```bash
bun add dexie
bun add --dev vitest jsdom fake-indexeddb @testing-library/react
```

Expected: `package.json` contains `dexie` under dependencies and the four test packages under devDependencies; `bun.lock` is updated.

- [ ] **Step 2: Add the test command and Vitest browser-like environment**

Add to `package.json` scripts:

```json
"test": "vitest run"
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
  },
});
```

Create `vitest.setup.ts`:

```ts
import "fake-indexeddb/auto";
```

- [ ] **Step 3: Define storage-neutral domain types**

Create `lib/notes/types.ts`:

```ts
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
```

- [ ] **Step 4: Define the repository contract and normalized error**

Create `lib/notes/repository.ts`:

```ts
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
```

- [ ] **Step 5: Verify the harness and types**

Run:

```bash
npm run test -- --passWithNoTests
npx tsc --noEmit
```

Expected: Vitest exits successfully with `--passWithNoTests`, and TypeScript exits with code 0.

- [ ] **Step 6: Commit the domain boundary**

```bash
git add package.json bun.lock vitest.config.ts vitest.setup.ts lib/notes/types.ts lib/notes/repository.ts
git commit -m "test: add notes domain and test harness"
```

---

### Task 2: Implement the IndexedDB Repository

**Files:**
- Create: `lib/notes/example-notes.ts`
- Create: `lib/notes/indexed-db-notes-repository.ts`
- Create: `lib/notes/indexed-db-notes-repository.test.ts`
- Create: `lib/notes/index.ts`
- Modify: `components/mini-apps/notes.tsx` (remove embedded `exampleNotes` after the new seed module is used)

**Interfaces:**
- Consumes: `NotesRepository`, `Note`, `CreateNoteInput`, `UpdateNoteInput`, and `NotesQuery` from Task 1.
- Produces: `IndexedDbNotesRepository`, `getNotesRepository(): Promise<NotesRepository>`, and `exampleNoteSeeds`.

- [ ] **Step 1: Write repository contract tests before implementation**

Create `lib/notes/indexed-db-notes-repository.test.ts` with isolated database names:

```ts
import { afterEach, describe, expect, it } from "vitest";
import Dexie from "dexie";
import { IndexedDbNotesRepository } from "@/lib/notes/indexed-db-notes-repository";

const databases: string[] = [];

function createRepository() {
  const databaseName = `space-notes-${crypto.randomUUID()}`;
  databases.push(databaseName);
  return new IndexedDbNotesRepository({
    databaseName,
    seeds: [{ title: "Welcome", content: "First local note" }],
  });
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map((name) => Dexie.delete(name)));
});

describe("IndexedDbNotesRepository", () => {
  it("seeds once and does not reseed after every note is deleted", async () => {
    const repository = createRepository();
    const seeded = await repository.list();
    expect(seeded).toHaveLength(1);
    await repository.delete(seeded[0].id);
    expect(await repository.list()).toEqual([]);
  });

  it("creates, updates, retrieves, deletes, and restores a note", async () => {
    const repository = createRepository();
    const created = await repository.create({ title: "Draft", content: "One" });
    const updated = await repository.update(created.id, { content: "Two" });
    expect(updated.content).toBe("Two");
    expect(await repository.get(created.id)).toEqual(updated);
    await repository.delete(created.id);
    expect(await repository.get(created.id)).toBeNull();
    await repository.restore(created);
    expect(await repository.get(created.id)).toEqual(created);
  });

  it("orders by updatedAt and searches title and content case-insensitively", async () => {
    const repository = createRepository();
    const alpha = await repository.create({ title: "Alpha", content: "quiet" });
    await repository.create({ title: "Beta", content: "LOUD idea" });
    await repository.update(alpha.id, { content: "latest" });
    expect((await repository.list())[0].id).toBe(alpha.id);
    expect((await repository.list({ query: "loud" })).map((note) => note.title)).toEqual(["Beta"]);
  });

  it("throws a normalized error when updating a missing note", async () => {
    const repository = createRepository();
    await expect(repository.update("missing", { title: "Nope" })).rejects.toMatchObject({
      name: "NotesRepositoryError",
    });
  });
});
```

- [ ] **Step 2: Run the repository test to verify it fails**

Run:

```bash
npm run test -- lib/notes/indexed-db-notes-repository.test.ts
```

Expected: FAIL because `IndexedDbNotesRepository` does not exist.

- [ ] **Step 3: Move example content into typed seed data**

Create `lib/notes/example-notes.ts` and move the six existing titles and markdown bodies out of `components/mini-apps/notes.tsx`:

```ts
import type { CreateNoteInput } from "@/lib/notes/types";

export const exampleNoteSeeds: ReadonlyArray<Required<CreateNoteInput>> = [
  { title: "Welcome to Notes", content: "# Welcome to Notes\n\nStart writing your thoughts here..." },
  { title: "Todo List", content: "# Todo List\n\n## Today's Tasks\n\n- [ ] Review project proposal" },
  { title: "Meeting Notes - Project Planning", content: "# Meeting Notes - Project Planning\n\n**Date:** Today" },
  { title: "Project Ideas", content: "# Project Ideas\n\n## Web App Concepts" },
  { title: "Code Snippets", content: "# Code Snippets\n\n## Useful Functions" },
  { title: "Daily Journal", content: "# Daily Journal\n\n## Today's Reflection" },
];
```

Use the complete existing markdown bodies rather than truncating them when performing the task.

- [ ] **Step 4: Implement the Dexie adapter and one-time metadata flag**

Create `lib/notes/indexed-db-notes-repository.ts` with two Dexie tables: `notes` indexed by `id` and `updatedAt`, and `metadata` keyed by `key`. Accept `{ databaseName, seeds }` in the constructor for isolated tests. Before every public operation, await a cached `initialize()` promise that runs one transaction: if metadata key `seeded` is absent, insert all seed notes with UUIDs and deterministic, descending timestamps, then store `{ key: "seeded", value: true }` even when the seed list is empty.

Normalize caught IndexedDB/Dexie errors:

```ts
function normalizeRepositoryError(error: unknown, fallback: string) {
  if (error instanceof NotesRepositoryError) return error;
  return new NotesRepositoryError(fallback, {
    cause: error instanceof Error ? error : undefined,
  });
}
```

Implement `list` with `toArray()`, case-insensitive title/content filtering, and descending `updatedAt` ordering. Implement `update` by reading the existing record, rejecting missing IDs, merging only title/content, and assigning a fresh `updatedAt`. Implement `restore` with `put(note)` so Undo preserves identity and timestamps.

- [ ] **Step 5: Add the single repository composition point**

Create `lib/notes/index.ts`:

```ts
import type { NotesRepository } from "@/lib/notes/repository";
import { exampleNoteSeeds } from "@/lib/notes/example-notes";

let repositoryPromise: Promise<NotesRepository> | null = null;

export function getNotesRepository(): Promise<NotesRepository> {
  repositoryPromise ??= import("@/lib/notes/indexed-db-notes-repository").then(
    ({ IndexedDbNotesRepository }) =>
      new IndexedDbNotesRepository({
        databaseName: "space-notes",
        seeds: exampleNoteSeeds,
      })
  );
  return repositoryPromise;
}
```

This dynamic import keeps Dexie and IndexedDB construction on the client path and is the only module the Notes application layer uses to select persistence.

- [ ] **Step 6: Run persistence tests and type checking**

Run:

```bash
npm run test -- lib/notes/indexed-db-notes-repository.test.ts
npx tsc --noEmit
```

Expected: repository tests pass and TypeScript exits with code 0.

- [ ] **Step 7: Commit the local repository**

```bash
git add lib/notes components/mini-apps/notes.tsx
git commit -m "feat: add indexeddb notes repository"
```

---

### Task 3: Build the Notes Controller and Autosave Behavior

**Files:**
- Create: `hooks/use-notes.ts`
- Create: `hooks/use-notes.test.tsx`

**Interfaces:**
- Consumes: `NotesRepository`, `Note`, and `SaveState`.
- Produces: `useNotes(repositoryFactory: () => Promise<NotesRepository>): UseNotesResult` with notes, filtered notes, selection, search, CRUD, undo, retry, and save state.

- [ ] **Step 1: Write hook tests against a deterministic in-memory repository**

Create `hooks/use-notes.test.tsx`. Define a local `MemoryNotesRepository` that implements the complete Task 1 interface and clones returned values. Use `renderHook`, `act`, and `waitFor` to cover:

```ts
it("loads notes and selects the most recently updated note", async () => {
  const repository = new MemoryNotesRepository([olderNote, newerNote]);
  const { result } = renderHook(() => useNotes(() => Promise.resolve(repository)));
  await waitFor(() => expect(result.current.status).toBe("ready"));
  expect(result.current.selectedNote?.id).toBe(newerNote.id);
});

it("creates and selects an Untitled note", async () => {
  const repository = new MemoryNotesRepository([]);
  const { result } = renderHook(() => useNotes(() => Promise.resolve(repository)));
  await waitFor(() => expect(result.current.status).toBe("ready"));
  await act(() => result.current.createNote());
  expect(result.current.selectedNote?.title).toBe("Untitled");
});

it("debounces draft persistence for 500 ms", async () => {
  vi.useFakeTimers();
  const repository = new MemoryNotesRepository([olderNote]);
  const update = vi.spyOn(repository, "update");
  const { result } = renderHook(() => useNotes(() => Promise.resolve(repository)));
  await act(async () => Promise.resolve());
  act(() => result.current.updateDraft({ content: "Changed" }));
  expect(result.current.saveState).toBe("saving");
  expect(update).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTimeAsync(500));
  expect(update).toHaveBeenCalledWith(olderNote.id, { content: "Changed" });
  vi.useRealTimers();
});

it("keeps a failed draft visible and exposes retry", async () => {
  const repository = new MemoryNotesRepository([olderNote]);
  vi.spyOn(repository, "update").mockRejectedValueOnce(new Error("offline"));
  const { result } = renderHook(() => useNotes(() => Promise.resolve(repository)));
  await waitFor(() => expect(result.current.status).toBe("ready"));
  act(() => result.current.updateDraft({ title: "Still visible" }));
  await waitFor(() => expect(result.current.saveState).toBe("error"));
  expect(result.current.selectedNote?.title).toBe("Still visible");
  await act(() => result.current.retrySave());
  expect(result.current.saveState).toBe("saved");
});

it("deletes immediately and restores within the undo window", async () => {
  vi.useFakeTimers();
  const repository = new MemoryNotesRepository([olderNote]);
  const { result } = renderHook(() => useNotes(() => Promise.resolve(repository)));
  await waitFor(() => expect(result.current.status).toBe("ready"));
  await act(() => result.current.deleteSelectedNote());
  expect(result.current.deletedNote?.id).toBe(olderNote.id);
  await act(() => result.current.undoDelete());
  expect(result.current.selectedNote?.id).toBe(olderNote.id);
  vi.useRealTimers();
});
```

Also test title/content search, delete failure rollback, initial load retry, and clearing `deletedNote` after 5,000 ms.

- [ ] **Step 2: Run hook tests to verify they fail**

Run:

```bash
npm run test -- hooks/use-notes.test.tsx
```

Expected: FAIL because `useNotes` does not exist.

- [ ] **Step 3: Implement the controller with explicit return types**

Create `hooks/use-notes.ts` with:

```ts
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
  setQuery(query: string): void;
  selectNote(id: string): void;
  createNote(): Promise<void>;
  updateDraft(changes: UpdateNoteInput): void;
  deleteSelectedNote(): Promise<void>;
  undoDelete(): Promise<void>;
  retryLoad(): Promise<void>;
  retrySave(): Promise<void>;
}
```

Implementation requirements:

- Call the repository factory once from the mount effect and keep the resolved repository in a ref. This ensures IndexedDB is never opened during server rendering.
- Load and sort notes on mount; ignore state updates after unmount.
- Keep optimistic drafts in `notes` state and re-sort after a successful update.
- Store the latest unsaved `{ id, changes }` in a ref.
- Reset the 500 ms timer on each edit and persist against the captured note ID.
- Merge title/content edits made within the same debounce window.
- Do not clear the visible draft on update failure.
- On selection changes, leave any scheduled save tied to its original note ID.
- Delete optimistically, roll back on failure, and manage a separate five-second undo timer.
- Clear both timers during unmount.
- Normalize user-facing copy to `Could not load notes.`, `Could not create note.`, `Not saved.`, and `Could not delete note.`.

- [ ] **Step 4: Run hook tests and type checking**

Run:

```bash
npm run test -- hooks/use-notes.test.tsx
npx tsc --noEmit
```

Expected: hook tests pass and TypeScript exits with code 0.

- [ ] **Step 5: Commit controller behavior**

```bash
git add hooks/use-notes.ts hooks/use-notes.test.tsx
git commit -m "feat: add local notes controller"
```

---

### Task 4: Implement the Quiet Editor Interface

**Files:**
- Create: `components/mini-apps/notes/NotesSidebar.tsx`
- Create: `components/mini-apps/notes/NotesEditor.tsx`
- Create: `components/mini-apps/notes/NotesEmptyState.tsx`
- Create: `components/mini-apps/notes/NotesUndo.tsx`
- Modify: `components/mini-apps/notes.tsx`
- Modify: `components/initialized-mdx-editor.tsx`
- Create: `components/mini-apps/notes/notes-ui.test.tsx`

**Interfaces:**
- Consumes: `UseNotesResult`, `Note`, `UpdateNoteInput`, `SaveState`, `MDXEditorMethods`, and existing shadcn `Sheet`, `Button`, `Input`, and `Tooltip` primitives.
- Produces: the complete responsive Notes mini-app with no direct persistence imports below `NotesApp`.

- [ ] **Step 1: Write focused UI tests with the editor mocked**

Create `components/mini-apps/notes/notes-ui.test.tsx`. Mock `@/components/mdx-editor` as a textarea that invokes `onChange`. Render the presentational components with fixture notes and verify:

```ts
it("renders searchable note rows and the selected state", () => {
  render(
    <NotesSidebar
      notes={[olderNote, newerNote]}
      selectedNoteId={newerNote.id}
      query=""
      onQueryChange={vi.fn()}
      onCreate={vi.fn()}
      onSelect={vi.fn()}
    />
  );
  expect(screen.getByRole("searchbox", { name: "Search notes" })).toBeTruthy();
  expect(screen.getByRole("button", { name: /New note/i })).toBeTruthy();
  expect(screen.getByRole("button", { name: /Newer note/i }).getAttribute("aria-current")).toBe("true");
});

it("sends title and markdown edits through storage-neutral callbacks", async () => {
  const onChange = vi.fn();
  render(
    <NotesEditor
      note={newerNote}
      saveState="saved"
      onChange={onChange}
      onDelete={vi.fn()}
      onRetrySave={vi.fn()}
      focusTitle={false}
    />
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Note title" }), {
    target: { value: "Renamed" },
  });
  expect(onChange).toHaveBeenCalledWith({ title: "Renamed" });
});
```

Import `fireEvent`, `render`, and `screen` from `@testing-library/react`. Also verify the save labels, retry control, no-results copy, delete accessible name, and Undo callback.

- [ ] **Step 2: Run UI tests to verify they fail**

Run:

```bash
npm run test -- components/mini-apps/notes/notes-ui.test.tsx
```

Expected: FAIL because the new components do not exist.

- [ ] **Step 3: Build the compact library sidebar**

Implement `NotesSidebar` with typed props. Use a 208 px desktop width, a sticky header, a Lucide `Search` icon inside the search field, and a full-width high-contrast `Plus` action. Render note titles, a muted relative timestamp derived with `Intl.RelativeTimeFormat`, and `aria-current="true"` on the selected row. Render `No notes found` when a query has no results and `Create your first note` when the database is empty.

Use only neutral token classes such as `bg-sidebar/80`, `border-sidebar-border`, `bg-sidebar-accent`, `text-muted-foreground`, and `focus-visible:ring-ring`.

- [ ] **Step 4: Build the editor, empty states, and undo affordance**

Implement `NotesEditor` with:

- An unstyled title input in the 48 px header.
- `Saved locally`, `Saving…`, or a `Not saved · Retry` control derived from `SaveState`.
- A `Trash2` icon button with `aria-label="Delete note"` and a restrained destructive hover state.
- The existing `MDXEditor`, synchronized via `MDXEditorMethods.setMarkdown` when note identity changes.
- `onChange={(content) => onChange({ content })}` with no persistence import.

Implement `NotesEmptyState` for loading, load failure with Retry, and no selection. Implement `NotesUndo` as a bottom-centered, `aria-live="polite"` neutral surface containing `Note deleted` and an Undo button; Motion handles enter/exit without a bright toast aesthetic.

- [ ] **Step 5: Compose desktop and mobile layouts**

Rewrite `components/mini-apps/notes.tsx` to pass the stable `getNotesRepository` factory to `useNotes`; the hook invokes it only after mounting. On desktop render `NotesSidebar` beside the editor. Below 768 px, render the sidebar in the existing shadcn `Sheet`; a `PanelLeft` header button opens it, and selecting or creating a note closes it.

Use `AnimatePresence` for editor/empty-state transitions, but keep durations between 150 and 220 ms and avoid scaling text. Keep the root `h-full min-h-0 overflow-hidden bg-card` so it behaves correctly inside the desktop window manager.

- [ ] **Step 6: Refine the MDX editor surface**

Modify `components/initialized-mdx-editor.tsx` to keep the current plugins and add the installed package's `ListsToggle`, `BlockTypeSelect`, and `CreateLink` toolbar controls. Enable `linkPlugin()` and `linkDialogPlugin()` so `CreateLink` is functional. Style toolbar and content through `className` and `contentEditableClassName` using project tokens; do not introduce hard-coded saturated colors. Keep the toolbar compact enough for a 500 px Notes window.

- [ ] **Step 7: Run UI and behavior tests**

Run:

```bash
npm run test -- components/mini-apps/notes/notes-ui.test.tsx hooks/use-notes.test.tsx
npx tsc --noEmit
```

Expected: all specified tests pass and TypeScript exits with code 0.

- [ ] **Step 8: Commit the Quiet Editor UI**

```bash
git add components/mini-apps/notes.tsx components/mini-apps/notes components/initialized-mdx-editor.tsx
git commit -m "feat: finish local-first notes app"
```

---

### Task 5: Verify Integration and Project Health

**Files:**
- Modify only changed Notes files if verification exposes feature defects.

**Interfaces:**
- Consumes: all deliverables from Tasks 1–4.
- Produces: verified first-run, persistence, CRUD, search, autosave, undo, responsive behavior, and documented remaining project-wide issues.

- [ ] **Step 1: Run all automated Notes tests**

Run:

```bash
npm run test
```

Expected: all repository, hook, and Notes UI tests pass.

- [ ] **Step 2: Run strict TypeScript and lint changed files**

Run:

```bash
npx tsc --noEmit
npx eslint lib/notes hooks/use-notes.ts hooks/use-notes.test.tsx components/mini-apps/notes.tsx components/mini-apps/notes components/initialized-mdx-editor.tsx vitest.config.ts vitest.setup.ts
```

Expected: both commands exit with code 0.

- [ ] **Step 3: Run project-wide lint**

Run:

```bash
npm run lint
```

Expected: no new Notes errors. Existing unrelated React-purity failures in `components/desktop.tsx`, `components/mini-apps/calculator.tsx`, and generated `components/ui/sidebar.tsx` may remain and must be reported rather than silently attributed to Notes.

- [ ] **Step 4: Run the production build**

Run:

```bash
npm run build
```

Expected: build succeeds when Google Fonts and `https://numa.channel/data.json` are reachable. If the environment blocks those network requests, record the external failure and rely on the successful test, type, and changed-file lint checks for feature verification.

- [ ] **Step 5: Perform the browser smoke path**

Run `npm run dev`, open the app, and verify this exact sequence:

1. Open Notes and confirm example notes appear only on first use.
2. Create a note, rename it, enter markdown, wait for `Saved locally`, close Notes, reload, and confirm persistence.
3. Edit one note and immediately switch to another; confirm content never crosses note IDs.
4. Search using title text and markdown body text with different letter casing.
5. Delete a note, Undo within five seconds, then delete again and let Undo expire.
6. Delete all notes and reload; confirm seeds do not return.
7. Narrow below 768 px and confirm the library opens as a sheet while the editor fills the window.
8. Confirm keyboard focus indicators and accessible labels on create, delete, search, title, sidebar toggle, retry, and Undo controls.

Expected: all eight checks pass without console errors.

- [ ] **Step 6: Review the final diff for scope and accidental artifacts**

Run:

```bash
git status --short
git diff --check
git diff --stat HEAD~3
```

Expected: only the planned Notes implementation, test harness, dependency lockfile, and approved documentation are present; `.superpowers/` is ignored.

- [ ] **Step 7: Commit any verification-only corrections**

If verification required source corrections, stage the planned feature paths and commit:

```bash
git add package.json bun.lock vitest.config.ts vitest.setup.ts lib/notes hooks/use-notes.ts hooks/use-notes.test.tsx components/mini-apps/notes.tsx components/mini-apps/notes components/initialized-mdx-editor.tsx
git commit -m "fix: address notes verification findings"
```

If no corrections were required, do not create an empty commit.
