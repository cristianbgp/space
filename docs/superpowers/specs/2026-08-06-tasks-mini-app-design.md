# Tasks Mini-App Design

## Goal

Build a useful local-first Tasks mini-app that feels native to the `.space` desktop, remains fully functional without an account or server, and can later switch to an API backed by Drizzle or Prisma without changing React components.

## Product Scope

The first release includes:

- Tasks persisted in IndexedDB.
- Create, rename, complete, reopen, search, and delete operations.
- Today, Upcoming, All, and Completed views.
- Optional due dates and four priority levels: none, low, medium, and high.
- Optimistic interactions with rollback and concise error messages.
- Five-second undo after deletion.
- Example tasks seeded once on first use.
- Loading, empty, no-results, and storage-error states.
- Responsive behavior inside desktop and mobile windows.

Projects, lists, subtasks, recurrence, reminders, notifications, attachments, drag-and-drop ordering, accounts, synchronization, and PostgreSQL are intentionally excluded.

## Visual Direction

Use a **Quiet Ledger** direction. The app is a compact monochromatic daily planner, not a dashboard or kanban board.

A narrow filter rail sits on the left with Today, Upcoming, All, and Completed destinations plus live counts. The main surface has a restrained heading, search control, one-line quick-add field, and a vertically ordered task list. Rows use whitespace and subtle separators instead of separate cards. A custom square check control is the strongest repeated shape.

Selecting a row reveals a compact inline detail area for due date, priority, and deletion. The row stays in context while being edited. Completed tasks recede through lower contrast and a line-through treatment. Overdue dates use stronger neutral contrast and plain text rather than a saturated warning color.

The app reuses the project's Geist typography, neutral design tokens, translucent sidebar surface, fine borders, small radii, and short Motion transitions. No chromatic utilities are used in the Tasks interface or its dock icon.

Below the existing 768 px breakpoint, the filter rail becomes a left Sheet and the main ledger fills the window. Row details stack without horizontal overflow. The dock gains a sixth monochromatic Tasks icon using the existing `AppIcon` geometry.

## Domain Model

The application-level model stays independent of Dexie and any future ORM:

```ts
type TaskPriority = "none" | "low" | "medium" | "high";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}
```

IDs are UUID strings. Timestamps are ISO 8601 strings. Due dates are local calendar values in `YYYY-MM-DD` form so filtering does not shift dates across time zones.

## Persistence Boundary

All storage is accessed through an asynchronous contract:

```ts
interface TasksRepository {
  list(options?: { query?: string }): Promise<Task[]>;
  get(id: string): Promise<Task | null>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, changes: UpdateTaskInput): Promise<Task>;
  delete(id: string): Promise<void>;
  restore(task: Task): Promise<Task>;
}
```

The local implementation uses Dexie. Dexie tables, schema details, and errors stay inside `IndexedDbTasksRepository`. UI components import domain values and controller callbacks only.

The future server-backed path remains:

```text
Tasks UI
  -> TasksRepository
  -> ApiTasksRepository
  -> Next.js route handlers
  -> DrizzleTasksRepository or PrismaTasksRepository
  -> PostgreSQL
```

## Ordering and Views

Incomplete tasks sort before completed tasks. Within each state, priority sorts high to low, dated tasks sort by due date ascending, undated tasks follow, and newer tasks break ties.

- Today includes incomplete tasks due today or earlier.
- Upcoming includes incomplete tasks due after today.
- All includes every incomplete task.
- Completed includes completed tasks, newest completion first.

Search is case-insensitive and filters the active view by title.

## Application State and Data Flow

A `useTasks` controller owns loading, filtering, selection, optimistic mutations, deletion undo, and recoverable errors.

Creation trims the submitted title and ignores blank values. A new task is persisted immediately, inserted into the visible list, and expanded for optional detail editing. Completion, title edits, due date changes, and priority changes update the interface optimistically, then call the repository. A failed mutation restores the previous task and shows a concise error.

Deleting removes the task immediately and stores the value in memory for five seconds. Undo calls `restore`. A failed delete returns the task to the list automatically.

The date used for view filtering is injected into controller logic so date behavior remains deterministic in tests.

## Component Boundaries

- `TasksApp`: repository composition, responsive shell, and filter Sheet.
- `TasksSidebar`: views, counts, and local-storage reassurance.
- `TasksToolbar`: active-view heading and search.
- `TaskQuickAdd`: keyboard-friendly title creation.
- `TaskList`: list and empty states.
- `TaskRow`: completion, title editing, metadata, expandable details, and delete action.
- `TasksUndo`: temporary undo affordance.
- `useTasks`: controller for repository reads, filters, mutations, and errors.
- `TasksRepository`: storage-neutral contract.
- `IndexedDbTasksRepository`: Dexie schema, seed transaction, ordering, and CRUD.

## Error Handling

An initial storage failure replaces the ledger with an error state and retry action. Create, update, completion, and delete failures preserve or restore the last valid visible state. Raw Dexie messages are never shown. Empty and no-results states include one clear next action.

## Accessibility

Every icon-only control has an accessible name and visible focus treatment. View navigation uses semantic buttons with `aria-current`. The quick-add field has an explicit accessible label and submits with Enter. Completion controls expose task titles in their names. Native date and select controls retain keyboard behavior. Motion communicates state change only and remains short.

## Verification

- Repository contract tests cover seed-once behavior, CRUD, restore, ordering, and normalized missing-task errors.
- Controller tests cover view filtering, blank-title rejection, creation, optimistic completion rollback, detail updates, deletion, and undo.
- UI tests cover quick-add submission, view navigation, task completion, and detail controls.
- Dock coverage verifies the Tasks launcher opens the new mini-app.
- Strict TypeScript, changed-file ESLint, full tests, production build, and desktop/mobile browser checks complete verification.
