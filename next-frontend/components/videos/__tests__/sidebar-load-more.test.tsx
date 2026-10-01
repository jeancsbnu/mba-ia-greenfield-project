// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SuggestedVideoListItem } from "@/lib/api/contracts";

import { SidebarLoadMore } from "../sidebar-load-more";

const PUBLIC_ID = "watch-video";

// O GET vai para o Route Handler same-origin, que o MSW não intercepta — ele
// finge apenas a API upstream.
const fetchMock = vi.fn();

function buildItem(index: number): SuggestedVideoListItem {
  return {
    publicId: `suggestion-${String(index)}`,
    title: `Sugestão ${String(index)}`,
    thumbnailUrl: "/window.svg",
    durationSeconds: 300,
    viewsCount: 100 + index,
    publishedAt: "2026-01-01T00:00:00.000Z",
    channel: { nickname: "joana_cria", name: "Joana Cria" },
  };
}

function pageResponse(items: SuggestedVideoListItem[], total: number) {
  return new Response(JSON.stringify({ items, total }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SidebarLoadMore", () => {
  it("asks for the next page starting at what is already on screen", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(pageResponse([buildItem(4), buildItem(5)], 6));

    render(
      <SidebarLoadMore publicId={PUBLIC_ID} initialCount={4} total={6} />
    );
    await user.click(screen.getByRole("button", { name: "Ver mais" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/videos/${PUBLIC_ID}/suggestions?offset=4&limit=4`
      );
    });
  });

  it("appends the new cards instead of replacing what is there", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(pageResponse([buildItem(4), buildItem(5)], 10))
      .mockResolvedValueOnce(pageResponse([buildItem(6), buildItem(7)], 10));

    render(
      <SidebarLoadMore publicId={PUBLIC_ID} initialCount={4} total={10} />
    );

    await user.click(screen.getByRole("button", { name: "Ver mais" }));
    await screen.findByText("Sugestão 4");

    await user.click(screen.getByRole("button", { name: "Ver mais" }));
    await screen.findByText("Sugestão 6");

    // Os dois primeiros continuam lá: acrescenta, não substitui.
    expect(screen.getByText("Sugestão 4")).toBeInTheDocument();
    expect(screen.getByText("Sugestão 5")).toBeInTheDocument();
    // E a segunda página pediu a partir do acumulado, não do zero.
    expect(fetchMock).toHaveBeenLastCalledWith(
      `/api/videos/${PUBLIC_ID}/suggestions?offset=6&limit=4`
    );
  });

  it("disappears once the loaded count reaches the total", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(pageResponse([buildItem(4), buildItem(5)], 6));

    render(
      <SidebarLoadMore publicId={PUBLIC_ID} initialCount={4} total={6} />
    );
    await user.click(screen.getByRole("button", { name: "Ver mais" }));
    await screen.findByText("Sugestão 5");

    // Some em vez de ficar inerte, para não deixar na sidebar um alvo que não
    // faz nada; o fim da lista é anunciado ao leitor de tela.
    expect(
      screen.queryByRole("button", { name: "Ver mais" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Não há mais sugestões")).toBeInTheDocument();
  });

  it("is absent from the start when there is nothing more to load", () => {
    render(
      <SidebarLoadMore publicId={PUBLIC_ID} initialCount={2} total={2} />
    );

    expect(
      screen.queryByRole("button", { name: "Ver mais" })
    ).not.toBeInTheDocument();
  });

  it("shows a busy state while the page is in flight", async () => {
    const user = userEvent.setup();
    let release: (() => void) | undefined;
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => {
            resolve(pageResponse([buildItem(4)], 6));
          };
        })
    );

    render(
      <SidebarLoadMore publicId={PUBLIC_ID} initialCount={4} total={6} />
    );
    await user.click(screen.getByRole("button", { name: "Ver mais" }));

    const busy = await screen.findByRole("button", { name: "Carregando…" });
    expect(busy).toHaveAttribute("aria-busy", "true");

    release?.();
    await screen.findByText("Sugestão 4");
  });

  it("keeps the sidebar quiet when the request fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new Error("network down"));

    render(
      <SidebarLoadMore publicId={PUBLIC_ID} initialCount={4} total={6} />
    );
    await user.click(screen.getByRole("button", { name: "Ver mais" }));

    // Degrada em silêncio: sem alerta, e o botão volta a ficar disponível.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Ver mais" })
      ).toHaveAttribute("aria-busy", "false");
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
