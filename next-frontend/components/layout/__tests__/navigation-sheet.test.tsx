// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NavigationSheet } from "../navigation-sheet";

const VIEWER = { name: "Joana Cria", nickname: "joana_cria" };

async function openSheet(
  props: Partial<React.ComponentProps<typeof NavigationSheet>> = {}
) {
  const user = userEvent.setup();
  const onSignOut = vi.fn();
  render(
    <NavigationSheet
      viewer={VIEWER}
      pathname="/"
      onSignOut={onSignOut}
      {...props}
    />
  );
  await user.click(screen.getByRole("button", { name: "Abrir menu" }));
  const dialog = await screen.findByRole("dialog", { name: "Menu" });
  return { user, onSignOut, dialog };
}

describe("NavigationSheet", () => {
  it("shows the identity, the three links and Sair to a signed-in viewer", async () => {
    const { dialog } = await openSheet();

    const identity = within(dialog).getByRole("link", { name: /Joana Cria/ });
    expect(identity).toHaveAttribute("href", "/@joana_cria");
    expect(within(dialog).getByText("@joana_cria")).toBeInTheDocument();

    const nav = within(dialog).getByRole("navigation", {
      name: "Menu de navegação",
    });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")])
    ).toEqual([
      ["Início", "/"],
      ["Canais seguidos", "/channel/subscriptions"],
      ["Meus vídeos", "/channel/videos"],
    ]);
    expect(
      within(dialog).getByRole("button", { name: "Sair" })
    ).toBeInTheDocument();
  });

  it("marks the link of the current route", async () => {
    const { dialog } = await openSheet({ pathname: "/channel/videos" });

    expect(
      within(dialog).getByRole("link", { name: "Meus vídeos" })
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(dialog).getByRole("link", { name: "Início" })
    ).not.toHaveAttribute("aria-current");
  });

  it("offers Entrar and only Início to an anonymous visitor, without Sair", async () => {
    const { dialog } = await openSheet({ viewer: null });

    expect(within(dialog).getByRole("link", { name: "Entrar" })).toHaveAttribute(
      "href",
      "/login"
    );
    const nav = within(dialog).getByRole("navigation", {
      name: "Menu de navegação",
    });
    expect(within(nav).getAllByRole("link").map((l) => l.textContent)).toEqual([
      "Início",
    ]);
    expect(
      within(dialog).queryByRole("button", { name: "Sair" })
    ).not.toBeInTheDocument();
  });

  it("calls onSignOut when Sair is clicked", async () => {
    const { user, onSignOut, dialog } = await openSheet();

    await user.click(within(dialog).getByRole("button", { name: "Sair" }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("disables Sair while signing out", async () => {
    const { dialog } = await openSheet({ isSigningOut: true });

    expect(within(dialog).getByRole("button", { name: "Sair" })).toBeDisabled();
  });

  it("closes from the close button and returns focus to the menu button", async () => {
    const { user, dialog } = await openSheet();

    await user.click(within(dialog).getByRole("button", { name: "Fechar menu" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveFocus();
  });

  it("closes when a link is followed", async () => {
    const { user, dialog } = await openSheet();

    await user.click(within(dialog).getByRole("link", { name: "Meus vídeos" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
