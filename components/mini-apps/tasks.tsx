"use client";

import * as React from "react";
import { AnimatePresence } from "motion/react";
import { LoaderCircle, TriangleAlert } from "lucide-react";

import { TaskList } from "@/components/mini-apps/tasks/TaskList";
import { TaskQuickAdd } from "@/components/mini-apps/tasks/TaskQuickAdd";
import { TasksSidebar } from "@/components/mini-apps/tasks/TasksSidebar";
import { TasksToolbar } from "@/components/mini-apps/tasks/TasksToolbar";
import { TasksUndo } from "@/components/mini-apps/tasks/TasksUndo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTasks } from "@/hooks/use-tasks";
import { getTasksRepository } from "@/lib/tasks";

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TasksApp() {
  const tasks = useTasks(getTasksRepository);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [today] = React.useState(() => localDateKey());

  const handleViewChange = (view: typeof tasks.activeView) => {
    tasks.setView(view);
    if (isMobile) setSidebarOpen(false);
  };

  const sidebar = (
    <TasksSidebar
      activeView={tasks.activeView}
      counts={tasks.counts}
      onViewChange={handleViewChange}
    />
  );

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-card">
      <div className="hidden h-full shrink-0 md:flex">{sidebar}</div>

      <Sheet onOpenChange={setSidebarOpen} open={sidebarOpen}>
        <SheetContent
          className="w-[min(80vw,12rem)] gap-0 border-sidebar-border p-0"
          side="left"
        >
          <SheetTitle className="sr-only">Task views</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col bg-card">
        {tasks.status === "loading" ? (
          <div className="flex h-full min-h-48 items-center justify-center p-6 text-center">
            <div>
              <LoaderCircle
                aria-hidden="true"
                className="mx-auto mb-3 size-6 animate-spin stroke-1 text-muted-foreground"
              />
              <p className="text-sm font-medium">Loading tasks...</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Opening your local ledger.
              </p>
            </div>
          </div>
        ) : tasks.status === "error" ? (
          <div className="flex h-full min-h-48 items-center justify-center p-6 text-center">
            <div className="max-w-56">
              <TriangleAlert
                aria-hidden="true"
                className="mx-auto mb-3 size-6 stroke-1 text-muted-foreground"
              />
              <p className="text-sm font-medium">Could not load tasks.</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Your local tasks are still on this device.
              </p>
              <Button
                className="mt-4"
                onClick={() => void tasks.retryLoad()}
                size="sm"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            <TasksToolbar
              count={tasks.visibleTasks.length}
              onOpenSidebar={() => setSidebarOpen(true)}
              onQueryChange={tasks.setQuery}
              query={tasks.query}
              view={tasks.activeView}
            />
            <TaskQuickAdd onCreate={(input) => void tasks.createTask(input)} />
            <TaskList
              expandedTaskId={tasks.expandedTaskId}
              onDelete={(id) => void tasks.deleteTask(id)}
              onToggle={(id) => void tasks.toggleTask(id)}
              onToggleExpanded={tasks.toggleExpanded}
              onUpdate={(id, changes) => void tasks.updateTask(id, changes)}
              query={tasks.query}
              tasks={tasks.visibleTasks}
              today={today}
              view={tasks.activeView}
            />
          </>
        )}
      </main>

      {tasks.status === "ready" && tasks.error ? (
        <div
          aria-live="polite"
          className="absolute right-3 bottom-3 z-10 rounded-md border border-border bg-popover/95 px-3 py-2 text-xs text-popover-foreground shadow-md backdrop-blur-xl"
        >
          {tasks.error}
        </div>
      ) : null}

      <AnimatePresence>
        {tasks.deletedTask ? (
          <TasksUndo
            key={tasks.deletedTask.id}
            onUndo={() => void tasks.undoDelete()}
            task={tasks.deletedTask}
          />
        ) : null}
      </AnimatePresence>

    </div>
  );
}
