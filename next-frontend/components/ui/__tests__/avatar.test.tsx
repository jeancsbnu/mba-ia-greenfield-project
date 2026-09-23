// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "../avatar";

// O Avatar da Fase 04 é usado sem upload de imagem: o fallback com as iniciais do
// canal é o caminho principal (SI-04.10 / SI-04.14b). Em jsdom o AvatarImage do Radix
// nunca resolve o load, então o fallback é o que fica visível.
describe("Avatar", () => {
  it("renders with data-slot=avatar", () => {
    render(<Avatar />);
    expect(document.querySelector("[data-slot='avatar']")).toBeInTheDocument();
  });

  it("exposes the size as data-size (default when not given)", () => {
    const { rerender } = render(<Avatar />);
    expect(document.querySelector("[data-slot='avatar']")).toHaveAttribute(
      "data-size",
      "default"
    );

    rerender(<Avatar size="lg" />);
    expect(document.querySelector("[data-slot='avatar']")).toHaveAttribute(
      "data-size",
      "lg"
    );
  });

  it("renders the fallback content (channel initials)", () => {
    render(
      <Avatar>
        <AvatarFallback>JC</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText("JC")).toBeInTheDocument();
  });

  it("gives the fallback its own data-slot anchor", () => {
    render(
      <Avatar>
        <AvatarFallback>JC</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText("JC")).toHaveAttribute(
      "data-slot",
      "avatar-fallback"
    );
  });

  it("groups avatars and renders the overflow count", () => {
    render(
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+2</AvatarGroupCount>
      </AvatarGroup>
    );
    expect(
      document.querySelector("[data-slot='avatar-group']")
    ).toBeInTheDocument();
    expect(screen.getByText("+2")).toHaveAttribute(
      "data-slot",
      "avatar-group-count"
    );
  });
});
