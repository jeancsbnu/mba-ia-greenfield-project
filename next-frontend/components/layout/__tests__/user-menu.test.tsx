// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { UserMenu } from "../user-menu";

// Avatar + "Sair" como unidade dona do logout. A chamada ao endpoint é injetada
// por quem renderiza (SI-04.10).
describe("UserMenu", () => {
  it("shows the channel initials in the avatar", () => {
    render(<UserMenu channelName="Joana Cria" />);
    expect(screen.getByText("JC")).toBeInTheDocument();
  });

  it("labels the avatar with the channel name", () => {
    render(<UserMenu channelName="Joana Cria" />);
    expect(document.querySelector("[data-slot='avatar']")).toHaveAttribute(
      "aria-label",
      "Joana Cria"
    );
  });

  it("uses a single initial for a one-word channel name", () => {
    render(<UserMenu channelName="Joana" />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("calls onSignOut when the user clicks Sair", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    render(<UserMenu channelName="Joana Cria" onSignOut={onSignOut} />);

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("disables Sair while signing out", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    render(
      <UserMenu channelName="Joana Cria" isSigningOut onSignOut={onSignOut} />
    );

    const button = screen.getByRole("button", { name: "Sair" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onSignOut).not.toHaveBeenCalled();
  });
});
