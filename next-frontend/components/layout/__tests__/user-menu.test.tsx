// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { UserMenu } from "../user-menu";

const PROPS = { channelName: "Joana Cria", nickname: "joana_cria" };

// Avatar como "Seu canal" + "Sair" (home-busca/TD-07, Revision de 2026-10-11).
// O logout é injetado por quem renderiza.
describe("UserMenu", () => {
  it("shows the channel initials in the avatar", () => {
    render(<UserMenu {...PROPS} />);
    expect(screen.getByText("JC")).toBeInTheDocument();
  });

  it("uses a single initial for a one-word channel name", () => {
    render(<UserMenu {...PROPS} channelName="Joana" />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("links the avatar to the viewer's own channel as Seu canal", () => {
    render(<UserMenu {...PROPS} />);

    const link = screen.getByRole("link", { name: "Seu canal" });
    expect(link).toHaveAttribute("href", "/@joana_cria");
    expect(link).toContainElement(screen.getByText("JC"));
  });

  it("calls onSignOut when the user clicks Sair", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    render(<UserMenu {...PROPS} onSignOut={onSignOut} />);

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("disables Sair while signing out", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    render(<UserMenu {...PROPS} isSigningOut onSignOut={onSignOut} />);

    const button = screen.getByRole("button", { name: "Sair" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onSignOut).not.toHaveBeenCalled();
  });
});
