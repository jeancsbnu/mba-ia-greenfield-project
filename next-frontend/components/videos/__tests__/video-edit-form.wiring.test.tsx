// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

import { VideoEditForm } from "../video-edit-form";

const push = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh }),
}));

const PUBLIC_ID = "abc123";
const DEFAULTS = {
  title: "Tour pelo estúdio",
  description: "Setup de 2026",
  category: "Tecnologia" as const,
  visibility: "public" as const,
};

// O submit vai para o Route Handler same-origin, que o MSW não intercepta —
// ele finge apenas a API upstream. O alvo aqui é o fetch do próprio formulário.
const fetchMock = vi.fn();

function okResponse() {
  return new Response(JSON.stringify({ publicId: PUBLIC_ID }), {
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

/** Corpo do último PATCH, para inspecionar os campos enviados. */
function lastBody(): FormData {
  const call = fetchMock.mock.calls.at(-1) as [string, { body: FormData }];
  return call[1].body;
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

describe("VideoEditForm — wiring", () => {
  it("sends the edited fields without `published` when saving a draft", async () => {
    const user = userEvent.setup();
    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} />);

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/videos/${PUBLIC_ID}`,
        expect.objectContaining({ method: "PATCH" })
      );
    });

    const body = lastBody();
    expect(body.get("title")).toBe(DEFAULTS.title);
    expect(body.get("category")).toBe(DEFAULTS.category);
    // Omitir `published` preserva o estado; enviar false despublicaria (TD-02).
    expect(body.has("published")).toBe(false);
  });

  it("sends published=true when publishing", async () => {
    const user = userEvent.setup();
    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} />);

    await user.click(screen.getByRole("button", { name: "Publicar" }));

    await waitFor(() => {
      expect(lastBody().get("published")).toBe("true");
    });
  });

  it("sends published=false when unpublishing", async () => {
    const user = userEvent.setup();
    render(
      <VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} isPublished />
    );

    await user.click(screen.getByRole("button", { name: "Despublicar" }));

    await waitFor(() => {
      expect(lastBody().get("published")).toBe("false");
    });
  });

  it("does not submit when the title is empty", async () => {
    const user = userEvent.setup();
    render(
      <VideoEditForm
        publicId={PUBLIC_ID}
        defaultValues={{ ...DEFAULTS, title: "" }}
      />
    );

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => {
      expect(screen.getByText("Informe um título")).toBeInTheDocument();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports an invalid thumbnail without calling the API", async () => {
    const user = userEvent.setup();
    const onThumbnailError = vi.fn();
    const gif = new File(["x"], "thumb.gif", { type: "image/gif" });

    render(
      <VideoEditForm
        publicId={PUBLIC_ID}
        defaultValues={DEFAULTS}
        thumbnailFile={gif}
        onThumbnailError={onThumbnailError}
      />
    );

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => {
      expect(onThumbnailError).toHaveBeenCalledWith(
        expect.stringContaining("JPEG")
      );
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("attaches the chosen thumbnail to the submit", async () => {
    const user = userEvent.setup();
    const png = new File(["x"], "thumb.png", { type: "image/png" });

    render(
      <VideoEditForm
        publicId={PUBLIC_ID}
        defaultValues={DEFAULTS}
        thumbnailFile={png}
      />
    );

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => {
      expect(lastBody().get("thumbnail")).toBeInstanceOf(File);
    });
  });

  it("shows a status message and refreshes on success", async () => {
    const user = userEvent.setup();
    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} />);

    await user.click(screen.getByRole("button", { name: "Publicar" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Vídeo publicado.");
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("surfaces VIDEO_NOT_PUBLISHABLE as an alert", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      errorResponse(
        409,
        "VIDEO_NOT_PUBLISHABLE",
        "Video is still processing or failed, so it cannot be published"
      )
    );

    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} />);
    await user.click(screen.getByRole("button", { name: "Publicar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "O vídeo só pode ser publicado depois que o processamento terminar."
      );
    });
    expect(screen.getByRole("alert")).not.toHaveTextContent("processing");
  });

  it("never shows the upstream English text on an unexpected error", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      errorResponse(500, "INTERNAL_ERROR", "Internal server error")
    );

    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} />);
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Não foi possível salvar o vídeo. Tente de novo."
      );
    });
  });

  it("routes a 401 to /login", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(errorResponse(401, "UNAUTHORIZED"));

    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} />);
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/login");
    });
  });

  it("routes FORBIDDEN to the not-found page", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(errorResponse(403, "FORBIDDEN"));

    render(<VideoEditForm publicId={PUBLIC_ID} defaultValues={DEFAULTS} />);
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        `/videos/${PUBLIC_ID}/edit/not-found`
      );
    });
  });

  it("shows a 413 under the uploader, not in the form body", async () => {
    const user = userEvent.setup();
    const onThumbnailError = vi.fn();
    fetchMock.mockResolvedValue(
      errorResponse(413, "PAYLOAD_TOO_LARGE", "File too large")
    );

    render(
      <VideoEditForm
        publicId={PUBLIC_ID}
        defaultValues={DEFAULTS}
        onThumbnailError={onThumbnailError}
      />
    );
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => {
      expect(onThumbnailError).toHaveBeenCalledWith(
        "A thumbnail deve ter no máximo 2 MB."
      );
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a server-side thumbnail rejection (400) in Portuguese under the uploader", async () => {
    const user = userEvent.setup();
    const onThumbnailError = vi.fn();
    fetchMock.mockResolvedValue(
      errorResponse(
        400,
        "VALIDATION_FAILED",
        "Validation failed (expected type is /^image\\/(jpeg|png|webp)$/)"
      )
    );

    render(
      <VideoEditForm
        publicId={PUBLIC_ID}
        defaultValues={DEFAULTS}
        onThumbnailError={onThumbnailError}
      />
    );
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => {
      expect(onThumbnailError).toHaveBeenCalledWith(
        "A thumbnail deve ser JPEG, PNG ou WebP."
      );
    });
  });
});
