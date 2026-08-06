import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskList } from "@/components/mini-apps/tasks/TaskList";
import { TaskQuickAdd } from "@/components/mini-apps/tasks/TaskQuickAdd";
import { TaskRow } from "@/components/mini-apps/tasks/TaskRow";
import { TasksSidebar } from "@/components/mini-apps/tasks/TasksSidebar";
import type { Task } from "@/lib/tasks/types";

const task: Task = {
  id: "task-1",
  title: "Refine the mini-app",
  completed: false,
  priority: "medium",
  dueDate: "2026-08-06",
  createdAt: "2026-08-06T10:00:00.000Z",
  updatedAt: "2026-08-06T10:00:00.000Z",
  completedAt: null,
};

describe("Tasks UI", () => {
  it("trims and submits quick-add input, then clears it", () => {
    const onCreate = vi.fn();
    render(<TaskQuickAdd onCreate={onCreate} />);

    const input = screen.getByRole("textbox", { name: "New task title" });
    fireEvent.change(input, { target: { value: "  New task  " } });
    fireEvent.submit(screen.getByRole("form", { name: "Add task" }));

    expect(onCreate).toHaveBeenCalledWith({ title: "New task" });
    expect(input).toHaveProperty("value", "");
  });

  it("exposes four views and marks the active destination", () => {
    const onViewChange = vi.fn();
    render(
      <TasksSidebar
        activeView="today"
        counts={{ today: 2, upcoming: 1, all: 4, completed: 1 }}
        onViewChange={onViewChange}
      />
    );

    expect(screen.getByRole("button", { name: /Today/ }).getAttribute("aria-current")).toBe(
      "page"
    );
    fireEvent.click(screen.getByRole("button", { name: /Upcoming/ }));
    expect(onViewChange).toHaveBeenCalledWith("upcoming");
    expect(screen.getByRole("button", { name: /All/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Completed/ })).toBeTruthy();
  });

  it("supports completion and expanded task details", () => {
    const onToggle = vi.fn();
    const onToggleExpanded = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const { rerender } = render(
      <TaskRow
        expanded={false}
        onDelete={onDelete}
        onToggle={onToggle}
        onToggleExpanded={onToggleExpanded}
        onUpdate={onUpdate}
        task={task}
        today="2026-08-06"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete Refine the mini-app" }));
    expect(onToggle).toHaveBeenCalledWith(task.id);

    fireEvent.click(
      screen.getByRole("button", { name: "Show details for Refine the mini-app" })
    );
    expect(onToggleExpanded).toHaveBeenCalledWith(task.id);

    rerender(
      <TaskRow
        expanded
        onDelete={onDelete}
        onToggle={onToggle}
        onToggleExpanded={onToggleExpanded}
        onUpdate={onUpdate}
        task={task}
        today="2026-08-06"
      />
    );

    const title = screen.getByRole("textbox", { name: "Task title" });
    fireEvent.change(title, { target: { value: "  Refined title  " } });
    fireEvent.blur(title);
    expect(onUpdate).toHaveBeenCalledWith(task.id, { title: "Refined title" });

    fireEvent.change(screen.getByLabelText("Due date"), {
      target: { value: "2026-08-09" },
    });
    expect(onUpdate).toHaveBeenCalledWith(task.id, { dueDate: "2026-08-09" });

    fireEvent.change(screen.getByLabelText("Priority"), {
      target: { value: "high" },
    });
    expect(onUpdate).toHaveBeenCalledWith(task.id, { priority: "high" });

    fireEvent.click(screen.getByRole("button", { name: "Delete task" }));
    expect(onDelete).toHaveBeenCalledWith(task.id);
  });

  it("distinguishes an empty view from empty search results", () => {
    const { rerender } = render(
      <TaskList
        expandedTaskId={null}
        onDelete={vi.fn()}
        onToggle={vi.fn()}
        onToggleExpanded={vi.fn()}
        onUpdate={vi.fn()}
        query=""
        tasks={[]}
        today="2026-08-06"
        view="today"
      />
    );
    expect(screen.getByText("Nothing due today")).toBeTruthy();

    rerender(
      <TaskList
        expandedTaskId={null}
        onDelete={vi.fn()}
        onToggle={vi.fn()}
        onToggleExpanded={vi.fn()}
        onUpdate={vi.fn()}
        query="missing"
        tasks={[]}
        today="2026-08-06"
        view="today"
      />
    );
    expect(screen.getByText("No matching tasks")).toBeTruthy();
  });
});
