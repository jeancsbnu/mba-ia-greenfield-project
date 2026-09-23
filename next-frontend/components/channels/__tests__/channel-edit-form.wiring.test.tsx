// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

import { ChannelEditForm } from "../channel-edit-form";

const push = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh }),
}));

const DEFAULTS = {
  nickname: "joana_cria",
  name: "Joana Cria",
  description: "Canal de tutoriais",
};

// O submit vai ao Route Handler same-origin, fora do alcance do MSW.
const fetchMock = vi.fn();

function okResponse() {
  return new Response(JSON.stringify(DEFAULTS), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, error: string, message = "erro") {
  return new Response(
    JSON.stringify({ statusCode: status, error, message, code: null }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  refresh.mockClear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(okResponse());
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ChannelEditForm — wiring", () => {
  it("sends the channel fields and reports success", async () => {
    const user = userEvent.setup();
    render(<ChannelEditForm defaultValues={DEFAULTS} />);

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/me/channel",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    const call = fetchMock.mock.calls.at(-1) as [string, { body: string }];
    expect(JSON.parse(call[1].body)).toMatchObject({
      nickname: "joana_cria",
      name: "Joana Cria",
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Alterações salvas");
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("blocks a dotted nickname before reaching the API", async () => {
    const user = userEvent.setup();
    render(<ChannelEditForm defaultValues={DEFAULTS} />);

    const nickname = screen.getByLabelText("Nickname");
    await user.clear(nickname);
    await user.type(nickname, "joana.cria");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(
        screen.getByText(/apenas letras minúsculas/i)
      ).toBeInTheDocument();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows NICKNAME_ALREADY_EXISTS inline under the nickname field", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(errorResponse(409, "NICKNAME_ALREADY_EXISTS"));

    render(<ChannelEditForm defaultValues={DEFAULTS} />);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(
        screen.getByText("Esse nickname já pertence a outro canal")
      ).toBeInTheDocument();
    });
    // Erro de campo, não alerta global.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("routes a 401 to /login", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(errorResponse(401, "UNAUTHORIZED"));

    render(<ChannelEditForm defaultValues={DEFAULTS} />);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/login");
    });
  });

  it("routes CHANNEL_NOT_FOUND to the not-found page", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(errorResponse(404, "CHANNEL_NOT_FOUND"));

    render(<ChannelEditForm defaultValues={DEFAULTS} />);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/channel/settings/not-found");
    });
  });

  it("warns that changing the nickname changes the public URL", () => {
    render(<ChannelEditForm defaultValues={DEFAULTS} />);

    const describedBy =
      screen.getByLabelText("Nickname").getAttribute("aria-describedby") ?? "";
    const texts = describedBy
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ");

    expect(texts).toContain("endereço público");
  });
});
