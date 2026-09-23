// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { VIDEO_CATEGORIES } from "@/lib/videos/edit-schema";

import { VideoEditForm } from "../video-edit-form";

// O formulário passou a ser dono da mutação na SI-04.12b; estes casos seguem
// cobrindo a apresentação, então o router é apenas silenciado.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const DEFAULTS = {
  title: "Receita de bolo",
  description: "Passo a passo",
  category: "Educação" as const,
  visibility: "public" as const,
};

const PUBLIC_ID = "abc123";

describe("VideoEditForm", () => {
  it("renders title and description pre-filled", () => {
    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} />);
    expect(screen.getByLabelText("Título")).toHaveValue("Receita de bolo");
    expect(screen.getByLabelText("Descrição")).toHaveValue("Passo a passo");
  });

  it("renders an empty description when the video has none", () => {
    render(
      <VideoEditForm publicId={PUBLIC_ID} defaultValues={{ ...DEFAULTS, description: "" }} />
    );
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
  });

  it("shows the current category on the select trigger", () => {
    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Educação");
  });

  it("offers exactly the eight categories decided in TD-10", () => {
    expect(VIDEO_CATEGORIES).toEqual([
      "Música",
      "Jogos",
      "Educação",
      "Entretenimento",
      "Notícias",
      "Esportes",
      "Tecnologia",
      "Outros",
    ]);
    // "Tutoriais" aparecia no mock do Figma e não pertence ao enum.
    expect(VIDEO_CATEGORIES).not.toContain("Tutoriais");
  });

  it("renders visibility as a labelled radiogroup with the current value checked", () => {
    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} />);

    const group = screen.getByRole("radiogroup", { name: "Visibilidade" });
    expect(group).toBeInTheDocument();

    expect(screen.getByRole("radio", { name: "Público" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("radio", { name: "Indisponível" })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("labels unlisted as Indisponível, never the English term", () => {
    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} />);
    expect(screen.getByRole("radio", { name: "Indisponível" })).toBeInTheDocument();
    expect(screen.queryByText("Unlisted")).not.toBeInTheDocument();
  });

  it("shows draft actions when the video is not published", () => {
    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} />);
    expect(screen.getByRole("button", { name: "Salvar rascunho" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Despublicar" })).not.toBeInTheDocument();
  });

  it("shows published actions when the video is already published", () => {
    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} isPublished />);
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Despublicar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publicar" })).not.toBeInTheDocument();
  });

  it("disables Publicar and explains why when the video is not ready", () => {
    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} canPublish={false} />);

    const publish = screen.getByRole("button", { name: "Publicar" });
    expect(publish).toBeDisabled();

    const describedBy = publish.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy)?.textContent).toContain(
      "processamento"
    );
  });
});
