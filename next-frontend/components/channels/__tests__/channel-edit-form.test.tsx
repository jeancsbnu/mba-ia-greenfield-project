// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { ChannelEditForm } from "../channel-edit-form";

// O formulário passou a ser dono da mutação na SI-04.13b; estes casos seguem
// cobrindo a apresentação, então o router é apenas silenciado.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const DEFAULTS = {
  nickname: "joana_cria",
  name: "Joana Cria",
  description: "Vídeos de culinária",
};

// Versão apresentacional do formulário: os três campos vêm preenchidos com os
// dados atuais do canal. O wiring de mutação é da SI-04.13b.
describe("ChannelEditForm", () => {
  it("renders the three fields pre-filled with the current channel data", () => {
    render(<ChannelEditForm defaultValues={DEFAULTS} />);

    expect(screen.getByLabelText("Nickname")).toHaveValue("joana_cria");
    expect(screen.getByLabelText("Nome do canal")).toHaveValue("Joana Cria");
    expect(screen.getByLabelText("Descrição")).toHaveValue("Vídeos de culinária");
  });

  it("renders an empty description when the channel has none", () => {
    render(
      <ChannelEditForm defaultValues={{ ...DEFAULTS, description: "" }} />
    );
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
  });

  it("renders the @ prefix as decoration, out of the accessible name", () => {
    render(<ChannelEditForm defaultValues={DEFAULTS} />);

    const prefix = screen.getByText("@");
    expect(prefix).toHaveAttribute("aria-hidden", "true");
    // O nome acessível do campo continua sendo o label, não o adorno.
    expect(screen.getByLabelText("Nickname")).toBeInTheDocument();
  });

  it("ties the nickname helper and the URL warning to the field", () => {
    render(<ChannelEditForm defaultValues={DEFAULTS} />);

    const nickname = screen.getByLabelText("Nickname");
    const describedBy = nickname.getAttribute("aria-describedby") ?? "";
    const ids = describedBy.split(" ").filter(Boolean);

    expect(ids).toHaveLength(2);
    const texts = ids.map((id) => document.getElementById(id)?.textContent);
    expect(texts).toContain("Único e global para o sistema");
    expect(texts).toContain(
      "Alterar o nickname muda o endereço público do canal"
    );
  });

  it("renders the submit button", () => {
    render(<ChannelEditForm defaultValues={DEFAULTS} />);
    expect(
      screen.getByRole("button", { name: "Salvar alterações" })
    ).toHaveAttribute("type", "submit");
  });

  it("renders extra actions passed as children", () => {
    render(
      <ChannelEditForm defaultValues={DEFAULTS}>
        <a href="/channel/videos">Cancelar</a>
      </ChannelEditForm>
    );
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
      "href",
      "/channel/videos"
    );
  });
});
