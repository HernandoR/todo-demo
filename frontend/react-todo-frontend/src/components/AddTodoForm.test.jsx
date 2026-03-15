import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AddTodoForm from "./AddTodoForm";

describe("AddTodoForm", () => {
  it("supports typing and submit", () => {
    const onValueChange = vi.fn();
    const onSubmit = vi.fn((e) => e.preventDefault());

    render(
      <AddTodoForm
        form={{ value: "", loading: false }}
        handlers={{ onValueChange, onSubmit }}
      />,
    );

    const input = screen.getByPlaceholderText("输入新的待办事项...");
    fireEvent.change(input, { target: { value: "新任务" } });
    expect(onValueChange).toHaveBeenCalledWith("新任务");

    fireEvent.submit(input.closest("form"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
