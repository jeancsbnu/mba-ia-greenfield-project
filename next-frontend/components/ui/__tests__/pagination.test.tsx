// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../pagination";

// A paginação do painel e da página pública navega por URL (TD-06): o contrato
// observável é a semântica de navegação — nav rotulado, links com href e
// aria-current na página atual.
describe("Pagination", () => {
  it("renders a labelled navigation landmark", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="?page=1">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    expect(screen.getByRole("navigation", { name: "pagination" })).toBeInTheDocument();
  });

  it("marks the active page with aria-current=page and leaves the others without it", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="?page=1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="?page=2" isActive>
              2
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );

    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "1" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("renders previous/next links with their own accessible names and hrefs", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="?page=1" text="Anterior" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="?page=3" text="Próxima" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );

    // Rótulos em pt-BR desde a SI-04.11a: o app inteiro é pt-BR, e o
    // aria-label estava fixo em inglês.
    const previous = screen.getByRole("link", {
      name: "Ir para a página anterior",
    });
    const next = screen.getByRole("link", { name: "Ir para a próxima página" });
    expect(previous).toHaveAttribute("href", "?page=1");
    expect(next).toHaveAttribute("href", "?page=3");
    expect(screen.getByText("Anterior")).toBeInTheDocument();
    expect(screen.getByText("Próxima")).toBeInTheDocument();
  });

  it("hides the ellipsis from assistive tech but keeps a screen-reader label", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );

    const ellipsis = document.querySelector("[data-slot='pagination-ellipsis']");
    expect(ellipsis).toHaveAttribute("aria-hidden");
    expect(screen.getByText("More pages")).toBeInTheDocument();
  });
});
