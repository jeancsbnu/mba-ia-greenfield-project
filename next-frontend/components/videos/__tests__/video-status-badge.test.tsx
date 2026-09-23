// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { VideoStatusBadge } from "../video-status-badge";

// Dois eixos independentes (TD-02): publicação vem de published_at, ciclo de vida
// vem de status. O chip mostra o status do worker quando ele ainda não terminou.
describe("VideoStatusBadge", () => {
  it("shows Publicado for a ready, published video", () => {
    render(<VideoStatusBadge status="ready" isPublished />);
    expect(screen.getByText("Publicado")).toHaveAttribute(
      "data-status",
      "published"
    );
  });

  it("shows Rascunho for a ready video that was never published", () => {
    render(<VideoStatusBadge status="ready" isPublished={false} />);
    expect(screen.getByText("Rascunho")).toHaveAttribute("data-status", "draft");
  });

  it("shows Rascunho for a draft video", () => {
    render(<VideoStatusBadge status="draft" isPublished={false} />);
    expect(screen.getByText("Rascunho")).toBeInTheDocument();
  });

  it("shows Processando while the worker is processing", () => {
    render(<VideoStatusBadge status="processing" isPublished={false} />);
    expect(screen.getByText("Processando")).toHaveAttribute(
      "data-status",
      "processing"
    );
  });

  it("shows Falhou when processing failed", () => {
    render(<VideoStatusBadge status="failed" isPublished={false} />);
    const badge = screen.getByText("Falhou");
    expect(badge).toHaveAttribute("data-status", "failed");
    expect(badge).toHaveAttribute("data-variant", "destructive");
  });

  it("keeps showing the worker status even for a published video", () => {
    // Publicado e reprocessando: os eixos são independentes.
    render(<VideoStatusBadge status="processing" isPublished />);
    expect(screen.getByText("Processando")).toBeInTheDocument();
    expect(screen.queryByText("Publicado")).not.toBeInTheDocument();
  });
});
