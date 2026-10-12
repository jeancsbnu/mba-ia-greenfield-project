// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { VideoCard } from "../video-card";

const BASE = {
  publicId: "abc123",
  title: "Receita de bolo de cenoura",
  thumbnailUrl: "https://cdn.example.com/thumb.jpg",
  durationSeconds: 492,
  viewsCount: 1284,
  publishedAt: "há 3 dias",
};

describe("VideoCard", () => {
  it("renders the title as a heading", () => {
    render(<VideoCard {...BASE} />);
    expect(
      screen.getByRole("heading", { name: "Receita de bolo de cenoura" })
    ).toBeInTheDocument();
  });

  it("formats the duration as m:ss", () => {
    render(<VideoCard {...BASE} />);
    expect(screen.getByText("8:12")).toBeInTheDocument();
  });

  it("pads the seconds below ten", () => {
    render(<VideoCard {...BASE} durationSeconds={330} />);
    expect(screen.getByText("5:30")).toBeInTheDocument();
  });

  it("omits the duration overlay when the duration is unknown", () => {
    render(<VideoCard {...BASE} durationSeconds={null} />);
    expect(
      document.querySelector("[data-slot='video-card-duration']")
    ).not.toBeInTheDocument();
  });

  it("formats the view count compactly, as the design writes it", () => {
    render(<VideoCard {...BASE} />);
    // "1,3 mil" e não "1.284": a linha já trunca, e é assim que o Figma
    // escreve (decisão de drift da SI-04.14.0).
    expect(
      screen.getByText("1,3 mil visualizações · há 3 dias")
    ).toBeInTheDocument();
  });

  it("renders the thumbnail with an empty alt (title carries the name)", () => {
    render(<VideoCard {...BASE} />);
    const image = document.querySelector("img");
    expect(image).toHaveAttribute("alt", "");
  });

  it("renders without a thumbnail when the video has none", () => {
    render(<VideoCard {...BASE} thumbnailUrl={null} />);
    expect(document.querySelector("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Receita de bolo de cenoura" })
    ).toBeInTheDocument();
  });

  it("links the thumbnail and the title to the watch page", () => {
    render(<VideoCard {...BASE} />);

    expect(
      screen.getByRole("link", { name: "Receita de bolo de cenoura" })
    ).toHaveAttribute("href", "/videos/abc123");
    const thumbnailLink = document.querySelector("img")?.closest("a");
    expect(thumbnailLink).toHaveAttribute("href", "/videos/abc123");
  });

  it("links the channel avatar and name to the public channel page", () => {
    render(
      <VideoCard
        {...BASE}
        channel={{ name: "Joana Cria", nickname: "joana_cria" }}
      />
    );

    expect(screen.getByRole("link", { name: "Joana Cria" })).toHaveAttribute(
      "href",
      "/@joana_cria"
    );
    const initials = screen.getByText("JC");
    expect(initials.closest("a")).toHaveAttribute("href", "/@joana_cria");
  });

  it("leaves the channel row out when no channel is given", () => {
    render(<VideoCard {...BASE} />);

    expect(
      document.querySelector("[data-slot='video-card-channel']")
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("never nests a link inside another", () => {
    render(
      <VideoCard
        {...BASE}
        channel={{ name: "Joana Cria", nickname: "joana_cria" }}
      />
    );

    expect(document.querySelector("a a")).toBeNull();
  });

  it("serves the mobile thumbnail at full width and the desktop one at the column width", () => {
    const { unmount } = render(<VideoCard {...BASE} size="mobile" />);
    const mobileSizes = document.querySelector("img")?.getAttribute("sizes");
    unmount();
    render(<VideoCard {...BASE} size="desktop" />);
    const desktopSizes = document.querySelector("img")?.getAttribute("sizes");

    expect(mobileSizes).toBe("100vw");
    expect(desktopSizes).not.toBe(mobileSizes);
  });
});
