import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TodoItem from "./TodoItem";

const baseTodo = { id: 1, title: "测试任务", completed: false };

function createHandlers() {
  return {
    onEditingTitleChange: vi.fn(),
    onToggle: vi.fn(),
    onStartEdit: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onDelete: vi.fn(),
  };
}

describe("TodoItem", () => {
  it("calls edit and delete handlers in view mode", () => {
    const handlers = createHandlers();

    render(
      <TodoItem
        todo={baseTodo}
        state={{ loading: false, isEditing: false, editingTitle: "" }}
        handlers={handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "编辑" }));
    expect(handlers.onStartEdit).toHaveBeenCalledWith(baseTodo);

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    expect(handlers.onDelete).toHaveBeenCalledWith(baseTodo.id);
  });

  it("disables save when title is unchanged in edit mode", () => {
    const handlers = createHandlers();

    render(
      <TodoItem
        todo={baseTodo}
        state={{ loading: false, isEditing: true, editingTitle: "测试任务" }}
        handlers={handlers}
      />,
    );

    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  });
});
