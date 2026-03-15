import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConnectionError from "./ConnectionError";

describe("ConnectionError", () => {
  it("triggers retry when button is clicked", () => {
    const onRetry = vi.fn();

    render(<ConnectionError loading={false} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "重试连接" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
