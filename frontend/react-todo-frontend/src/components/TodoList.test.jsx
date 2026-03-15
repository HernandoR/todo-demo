import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TodoList from "./TodoList";

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

describe("TodoList", () => {
  it("renders loading text", () => {
    render(
      <TodoList
        state={{
          loading: true,
          todos: [],
          editingTodoId: null,
          editingTodoTitle: "",
        }}
        handlers={createHandlers()}
      />,
    );

    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });

  it("renders todo items when data exists", () => {
    render(
      <TodoList
        state={{
          loading: false,
          todos: [{ id: 1, title: "任务A", completed: false }],
          editingTodoId: null,
          editingTodoTitle: "",
        }}
        handlers={createHandlers()}
      />,
    );

    expect(screen.getByText("任务A")).toBeInTheDocument();
  });
});
