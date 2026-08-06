# Tasks Mini-App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a polished local-first Tasks mini-app with CRUD, completion, date and priority metadata, useful views, search, deletion undo, and responsive desktop integration.

**Architecture:** Storage-neutral task types and an asynchronous `TasksRepository` isolate persistence. A Dexie adapter owns IndexedDB and first-run examples, `useTasks` owns filtering and optimistic behavior, small Tasks components render the Quiet Ledger interface, and the existing dock composes the app and its monochromatic icon.

**Tech Stack:** Next.js 16, React 19, strict TypeScript, Tailwind CSS 4, Motion, Lucide, Dexie, Vitest, Testing Library, fake-indexeddb.

## Global Constraints

- Keep the Tasks UI and dock icon entirely monochromatic; use only neutral design tokens and gray gradients.
- Store data in IndexedDB and keep Dexie out of React components and domain types.
- Use UUID strings, ISO 8601 timestamps, and local `YYYY-MM-DD` due dates.
- Include Today, Upcoming, All, and Completed views with case-insensitive title search.
- Include create, rename, complete, reopen, due date, priority, delete, five-second undo, retry, and rollback behavior.
- Do not add projects, lists, subtasks, recurrence, reminders, notifications, attachments, drag-and-drop, accounts, sync, API routes, or PostgreSQL.
- Follow strict TypeScript, `@/` imports, named exports, Tailwind, `cn()`, direct Lucide imports, and existing shadcn/Radix patterns.
- Use the user-approved `main` workflow and preserve unrelated existing lint debt.

---

## File Structure

- `lib/tasks/types.ts`: storage-neutral task types and view identifiers.
- `lib/tasks/repository.ts`: asynchronous repository contract and normalized error.
- `lib/tasks/example-tasks.ts`: deterministic first-use task seeds.
- `lib/tasks/indexed-db-tasks-repository.ts`: Dexie schema, seed transaction, ordering, search, and CRUD.
- `lib/tasks/index.ts`: local adapter composition point.
- `lib/tasks/indexed-db-tasks-repository.test.ts`: repository contract tests.
- `hooks/use-tasks.ts`: loading, active view, search, selection, optimistic mutations, delete, undo, retry, and rollback.
- `hooks/use-tasks.test.tsx`: controller behavior tests using an in-memory repository.
- `components/mini-apps/tasks.tsx`: responsive Tasks composition shell.
- `components/mini-apps/tasks/TasksSidebar.tsx`: filter rail and counts.
- `components/mini-apps/tasks/TasksToolbar.tsx`: active-view title, count, mobile rail action, and search.
- `components/mini-apps/tasks/TaskQuickAdd.tsx`: accessible Enter-to-create form.
- `components/mini-apps/tasks/TaskList.tsx`: list and empty states.
- `components/mini-apps/tasks/TaskRow.tsx`: completion, inline title, details, priority, date, and delete.
- `components/mini-apps/tasks/TasksUndo.tsx`: temporary undo surface.
- `components/mini-apps/tasks/tasks-ui.test.tsx`: user-facing component behavior tests.
- `components/AppIcon.tsx`: sixth monochromatic Tasks icon treatment.
- `components/dock.tsx`: Tasks window registration.
- `components/dock.test.tsx`: Tasks launcher coverage.

---

### Task 1: Add the Task Domain and IndexedDB Repository

**Files:**
- Create: `lib/tasks/types.ts`
- Create: `lib/tasks/repository.ts`
- Create: `lib/tasks/example-tasks.ts`
- Create: `lib/tasks/indexed-db-tasks-repository.test.ts`
- Create: `lib/tasks/indexed-db-tasks-repository.ts`
- Create: `lib/tasks/index.ts`

**Interfaces:**
- Produces: `Task`, `TaskPriority`, `TaskView`, `CreateTaskInput`, `UpdateTaskInput`, `TasksQuery`, `TasksRepository`, `TasksRepositoryError`, `IndexedDbTasksRepository`, and `getTasksRepository`.
- Consumes: Dexie and the existing test harness.

- [ ] **Step 1: Define the desired repository behavior in a failing test**

Create isolated-database tests that prove seed-once behavior, CRUD and restore, title search, deterministic ordering, completion timestamps, and normalized errors for missing tasks.

Use literal tasks and a fixed `now()` sequence. The ordering expectation is high priority before medium before low before none, then due date ascending, then newest `createdAt`.

- [ ] **Step 2: Run the focused repository test**

Run:

```bash
npm run test -- lib/tasks/indexed-db-tasks-repository.test.ts
```

Expected: FAIL because `@/lib/tasks/indexed-db-tasks-repository` does not exist.

- [ ] **Step 3: Add storage-neutral types and contract**

Define:

```ts
export type TaskPriority = "none" | "low" | "medium" | "high";
export type TaskView = "today" | "upcoming" | "all" | "completed";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateTaskInput {
  title: string;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export type UpdateTaskInput = Partial<
  Pick<Task, "title" | "completed" | "priority" | "dueDate">
>;

export interface TasksQuery {
  query?: string;
}
```

Define `TasksRepository` with `list`, `get`, `create`, `update`, `delete`, and `restore` methods matching the design specification.

- [ ] **Step 4: Implement the minimal Dexie adapter**

Create database tables for `tasks` and `metadata`, seed once inside one transaction, trim titles on create/update, set or clear `completedAt` with completion changes, and normalize adapter errors.

- [ ] **Step 5: Add deterministic examples and composition**

Create three incomplete example tasks and one completed example using local dates relative to construction time. Construct the production adapter only from `lib/tasks/index.ts` with database name `space-tasks`.

- [ ] **Step 6: Run repository tests and typecheck**

Run:

```bash
npm run test -- lib/tasks/indexed-db-tasks-repository.test.ts
npx tsc --noEmit
```

Expected: repository tests pass and TypeScript exits with code 0.

- [ ] **Step 7: Commit the repository boundary**

```bash
git add lib/tasks
git commit -m "feat: add local tasks repository"
```

---

### Task 2: Implement the Tasks Controller

**Files:**
- Create: `hooks/use-tasks.test.tsx`
- Create: `hooks/use-tasks.ts`

**Interfaces:**
- Consumes: `TasksRepository`, `Task`, `TaskView`, `CreateTaskInput`, and `UpdateTaskInput`.
- Produces: `useTasks(repositoryFactory, options?)` and `UseTasksResult`.

- [ ] **Step 1: Write failing controller behavior tests**

Use a complete in-memory `TasksRepository`. Test:

- Initial load and deterministic Today, Upcoming, All, and Completed filtering.
- Case-insensitive search within the active view.
- Blank creation is ignored and trimmed creation is persisted.
- Completion is optimistic and a failed repository update rolls back.
- Title, date, and priority updates persist and preserve unrelated fields.
- Delete removes immediately, undo restores, and failed delete rolls back.
- Initial load retry recovers from a one-time repository failure.

- [ ] **Step 2: Verify the tests fail for the missing hook**

Run:

```bash
npm run test -- hooks/use-tasks.test.tsx
```

Expected: FAIL because `@/hooks/use-tasks` does not exist.

- [ ] **Step 3: Implement view derivation and counts**

Inject `today?: () => string` in options, defaulting to a local-date helper. Derive `visibleTasks` and counts from the loaded task array, current view, and query without duplicating persisted state.

- [ ] **Step 4: Implement optimistic mutations with rollback**

Expose:

```ts
createTask(input: CreateTaskInput): Promise<void>;
updateTask(id: string, changes: UpdateTaskInput): Promise<void>;
toggleTask(id: string): Promise<void>;
deleteTask(id: string): Promise<void>;
undoDelete(): Promise<void>;
retryLoad(): Promise<void>;
```

Use the pre-mutation task for rollback. Keep one concise application error string and clear it on the next successful action.

- [ ] **Step 5: Run controller tests and the full suite**

Run:

```bash
npm run test -- hooks/use-tasks.test.tsx
npm run test
```

Expected: all tests pass.

- [ ] **Step 6: Commit the controller**

```bash
git add hooks/use-tasks.ts hooks/use-tasks.test.tsx
git commit -m "feat: add local tasks controller"
```

---

### Task 3: Build the Quiet Ledger Interface

**Files:**
- Create: `components/mini-apps/tasks/tasks-ui.test.tsx`
- Create: `components/mini-apps/tasks/TasksSidebar.tsx`
- Create: `components/mini-apps/tasks/TasksToolbar.tsx`
- Create: `components/mini-apps/tasks/TaskQuickAdd.tsx`
- Create: `components/mini-apps/tasks/TaskRow.tsx`
- Create: `components/mini-apps/tasks/TaskList.tsx`
- Create: `components/mini-apps/tasks/TasksUndo.tsx`
- Create: `components/mini-apps/tasks.tsx`

**Interfaces:**
- Consumes: `UseTasksResult`, task domain types, shadcn Button/Input/Sheet, Motion, and Lucide.
- Produces: `TasksApp` and focused presentational components.

- [ ] **Step 1: Write failing UI behavior tests**

Test real presentational components for:

- Quick-add trims and submits on Enter, then clears the input.
- Sidebar exposes four named view buttons and marks the active view.
- Task row exposes a named completion control, expands details, changes date and priority, commits title editing, and calls delete.
- Empty list copy differs for an empty view and an active search.

- [ ] **Step 2: Verify UI tests fail because components are missing**

Run:

```bash
npm run test -- components/mini-apps/tasks/tasks-ui.test.tsx
```

- [ ] **Step 3: Implement focused presentational components**

Use semantic forms, buttons, labels, and native date/select inputs. Keep every surface neutral. Rows use `border-b`, not card containers. Use `Check`, `CalendarDays`, `Flag`, `Search`, `Trash2`, `ListTodo`, and `PanelLeft` Lucide glyphs at a consistent stroke weight.

- [ ] **Step 4: Compose responsive TasksApp**

Use a desktop filter rail and mobile Sheet, inject `getTasksRepository` into `useTasks`, and render loading, storage error, list, transient mutation error, and undo states. Use only short opacity and height transitions.

- [ ] **Step 5: Run UI tests, typecheck, and changed-file lint**

Run:

```bash
npm run test -- components/mini-apps/tasks/tasks-ui.test.tsx
npx tsc --noEmit
npx eslint components/mini-apps/tasks.tsx components/mini-apps/tasks/*.tsx hooks/use-tasks.ts
```

- [ ] **Step 6: Commit the Tasks interface**

```bash
git add components/mini-apps/tasks.tsx components/mini-apps/tasks
git commit -m "feat: build tasks mini app"
```

---

### Task 4: Integrate Tasks with the Desktop

**Files:**
- Modify: `components/AppIcon.tsx`
- Modify: `components/dock.tsx`
- Modify: `components/dock.test.tsx`

**Interfaces:**
- Consumes: `TasksApp`, `AppIconId`, and the dock window contract.
- Produces: a sixth Tasks launcher and monochromatic icon.

- [ ] **Step 1: Extend the dock test first**

Add `Tasks` to the expected button names, click it, and assert the emitted window contains `id: "tasks"`, `title: "Tasks"`, and responsive preferred dimensions of 680 by 500 when the viewport permits.

- [ ] **Step 2: Run the dock test and verify the missing-launcher failure**

Run:

```bash
npm run test -- components/dock.test.tsx
```

- [ ] **Step 3: Add the icon and window registration**

Add `tasks` to `AppIconId` with `ListTodo` and a neutral medium-light gradient. Register `TasksApp` before Settings in the dock with preferred size `680x500` and position `220,90`.

- [ ] **Step 4: Run the dock test and full suite**

Run:

```bash
npm run test -- components/dock.test.tsx
npm run test
```

- [ ] **Step 5: Commit desktop integration**

```bash
git add components/AppIcon.tsx components/dock.tsx components/dock.test.tsx
git commit -m "feat: add tasks to desktop dock"
```

---

### Task 5: Verify and Ship

**Files:**
- Modify only files required by verified defects.

**Interfaces:**
- Consumes: completed Tasks mini-app.
- Produces: verified and pushed `main`.

- [ ] **Step 1: Run automated verification**

Run:

```bash
npm run test
npx tsc --noEmit
npx eslint lib/tasks hooks/use-tasks.ts hooks/use-tasks.test.tsx components/mini-apps/tasks.tsx components/mini-apps/tasks components/AppIcon.tsx components/dock.tsx components/dock.test.tsx
npm run build
```

- [ ] **Step 2: Run desktop and mobile browser checks**

Verify first-use examples, quick add, completion/reopen, Today and Completed filters, search, row expansion, title edit, date, priority, delete/undo, reload persistence, dock fit, and the 375 px layout. Confirm no console errors.

- [ ] **Step 3: Review scope and diff**

Confirm no chromatic utilities appear in Tasks files, no out-of-scope features were added, and no unrelated user files changed.

- [ ] **Step 4: Push main**

```bash
git push origin main
```
