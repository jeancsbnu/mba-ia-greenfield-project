// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { ChannelHeader } from "../channel-header";

// O cabeçalho da página pública mostra nome, @nickname · N vídeos, a descrição
// quando existe, e o avatar com as iniciais (não há upload nesta fase).
describe("ChannelHeader", () => {
  it("renders the channel name as the page heading", () => {
    render(
      <ChannelHeader name="Joana Cria" nickname="joana_cria" videosCount={12} />
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Joana Cria" })
    ).toBeInTheDocument();
  });

  it("renders the meta line with nickname and video count", () => {
    render(
      <ChannelHeader name="Joana Cria" nickname="joana_cria" videosCount={12} />
    );
    expect(screen.getByText("@joana_cria · 12 vídeos")).toBeInTheDocument();
  });

  it("uses the singular form for exactly one video", () => {
    render(
      <ChannelHeader name="Joana Cria" nickname="joana_cria" videosCount={1} />
    );
    expect(screen.getByText("@joana_cria · 1 vídeo")).toBeInTheDocument();
  });

  it("renders zero videos in the plural form", () => {
    render(
      <ChannelHeader name="Joana Cria" nickname="joana_cria" videosCount={0} />
    );
    expect(screen.getByText("@joana_cria · 0 vídeos")).toBeInTheDocument();
  });

  it("renders the description when present", () => {
    render(
      <ChannelHeader
        name="Joana Cria"
        nickname="joana_cria"
        description="Vídeos de culinária"
        videosCount={12}
      />
    );
    expect(screen.getByText("Vídeos de culinária")).toBeInTheDocument();
  });

  it("omits the description when null", () => {
    render(
      <ChannelHeader
        name="Joana Cria"
        nickname="joana_cria"
        description={null}
        videosCount={12}
      />
    );
    // Só o heading e a linha de meta devem aparecer como texto do cabeçalho.
    expect(screen.queryByText("Vídeos de culinária")).not.toBeInTheDocument();
  });

  it("labels the avatar with the channel name and shows its initials", () => {
    render(
      <ChannelHeader name="Joana Cria" nickname="joana_cria" videosCount={12} />
    );
    const avatar = document.querySelector("[data-slot='avatar']");
    expect(avatar).toHaveAttribute("aria-label", "Joana Cria");
    expect(screen.getByText("JC")).toBeInTheDocument();
  });
});
