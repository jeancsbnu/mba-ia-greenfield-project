// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { VideoVisibilityBadge } from "../video-visibility-badge";

describe("VideoVisibilityBadge", () => {
  it("shows Público for a published public video", () => {
    render(<VideoVisibilityBadge visibility="public" isPublished />);
    expect(screen.getByText("Público")).toHaveAttribute(
      "data-visibility",
      "public"
    );
  });

  it("labels unlisted as Indisponível", () => {
    render(<VideoVisibilityBadge visibility="unlisted" isPublished />);
    expect(screen.getByText("Indisponível")).toHaveAttribute(
      "data-visibility",
      "unlisted"
    );
  });

  it("never shows the English term Unlisted", () => {
    render(<VideoVisibilityBadge visibility="unlisted" isPublished />);
    expect(screen.queryByText(/unlisted/i)).not.toBeInTheDocument();
  });

  it("shows a dash for a draft, whatever the stored visibility is", () => {
    const { rerender } = render(
      <VideoVisibilityBadge visibility="public" isPublished={false} />
    );
    expect(screen.getByText("—")).toHaveAttribute("data-visibility", "none");

    rerender(<VideoVisibilityBadge visibility="unlisted" isPublished={false} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("Indisponível")).not.toBeInTheDocument();
  });
});
