// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { VideoTable, type VideoTableRow } from "../video-table";

const PUBLISHED: VideoTableRow = {
  publicId: "abc123",
  title: "Receita de bolo de cenoura",
  thumbnailUrl: "https://cdn.example.com/a.jpg",
  durationSeconds: 492,
  status: "ready",
  visibility: "public",
  publishedAt: "2026-07-28T12:00:00.000Z",
  viewsCount: 1284,
  likesCount: 97,
  commentsCount: 12,
};

const DRAFT: VideoTableRow = {
  publicId: "def456",
  title: "Rascunho sem publicar",
  thumbnailUrl: null,
  durationSeconds: 330,
  status: "ready",
  visibility: "public",
  publishedAt: null,
  viewsCount: 0,
  likesCount: 0,
  commentsCount: 0,
};

describe("VideoTable", () => {
  it("renders one row per video", () => {
    render(<VideoTable videos={[PUBLISHED, DRAFT]} />);
    expect(
      document.querySelectorAll("[data-slot='video-table-row']")
    ).toHaveLength(2);
  });

  it("renders the visible column headers plus a screen-reader-only actions header", () => {
    render(<VideoTable videos={[PUBLISHED]} />);
    for (const header of [
      "Vídeo",
      "Visibilidade",
      "Status",
      "Views",
      "Likes",
      "Coment.",
      "Publicação",
    ]) {
      expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
    expect(screen.getByRole("columnheader", { name: "Ações" })).toBeInTheDocument();
  });

  it("formats counters in pt-BR for a published video", () => {
    render(<VideoTable videos={[PUBLISHED]} />);
    expect(screen.getByText("1.284")).toBeInTheDocument();
    expect(screen.getByText("97")).toBeInTheDocument();
  });

  it("shows the duration as m:ss", () => {
    render(<VideoTable videos={[PUBLISHED]} />);
    expect(screen.getByText("8:12")).toBeInTheDocument();
  });

  it("shows a dash for visibility, counters and publication on a draft row", () => {
    render(<VideoTable videos={[DRAFT]} />);
    const row = document.querySelector("[data-slot='video-table-row']");
    // visibilidade + 3 contadores + publicação
    expect(within(row as HTMLElement).getAllByText("—")).toHaveLength(5);
  });

  it("gives each Editar button an accessible name including the title", () => {
    render(<VideoTable videos={[PUBLISHED, DRAFT]} />);
    expect(
      screen.getByRole("link", { name: "Editar Receita de bolo de cenoura" })
    ).toHaveAttribute("href", "/videos/abc123/edit");
    expect(
      screen.getByRole("link", { name: "Editar Rascunho sem publicar" })
    ).toHaveAttribute("href", "/videos/def456/edit");
  });

  it("renders the publication date with the absolute value in the title attribute", () => {
    render(
      <VideoTable
        videos={[PUBLISHED]}
        formatPublishedAt={() => ({
          label: "há 3 dias",
          absolute: "28/07/2026",
        })}
      />
    );
    const time = screen.getByText("há 3 dias");
    expect(time).toHaveAttribute("title", "28/07/2026");
    expect(time).toHaveAttribute("datetime", PUBLISHED.publishedAt as string);
  });

  it("renders an empty tbody when the channel has no videos", () => {
    render(<VideoTable videos={[]} />);
    expect(
      document.querySelectorAll("[data-slot='video-table-row']")
    ).toHaveLength(0);
  });
});
