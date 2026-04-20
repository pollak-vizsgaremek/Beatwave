import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import CommentComposer from "../src/components/discussion/CommentComposer";

afterEach(() => {
  cleanup();
});

describe("CommentComposer", () => {
  it("submits on Enter key", () => {
    const onSubmit = vi.fn();

    render(
      <CommentComposer
        value="Hello world"
        maxLength={2000}
        isSubmitting={false}
        onChange={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    const textarea = screen.getByPlaceholderText("What are your thoughts?");
    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not submit on Shift+Enter", () => {
    const onSubmit = vi.fn();

    render(
      <CommentComposer
        value="Hello world"
        maxLength={2000}
        isSubmitting={false}
        onChange={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    const textarea = screen.getByPlaceholderText("What are your thoughts?");
    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
      shiftKey: true,
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables submit while posting", () => {
    const onSubmit = vi.fn();

    render(
      <CommentComposer
        value="Hello world"
        maxLength={2000}
        isSubmitting
        onChange={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    const textarea = screen.getByPlaceholderText("What are your thoughts?");
    const button = screen.getByRole("button", { name: "Posting..." });

    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
    });
    fireEvent.click(button);

    expect(button).toBeTruthy();
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
