// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FeedError from "../error";

describe("FeedError", () => {
  it("tells the visitor the list could not be loaded", () => {
    render(<FeedError error={new Error("boom")} reset={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Não foi possível carregar os vídeos" })
    ).toBeInTheDocument();
  });

  it("retries through reset when Tentar novamente is clicked", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<FeedError error={new Error("boom")} reset={reset} />);

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
