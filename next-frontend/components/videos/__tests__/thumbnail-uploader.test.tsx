// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeAll } from "vitest";

import { ThumbnailUploader } from "../thumbnail-uploader";

// jsdom não implementa object URLs; o preview local depende delas.
beforeAll(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

const REMOTE = "https://cdn.example.com/thumb.jpg";

describe("ThumbnailUploader", () => {
  it("shows the resolved thumbnail coming from the API", () => {
    render(<ThumbnailUploader thumbnailUrl={REMOTE} />);
    expect(
      screen.getByAltText("Pré-visualização da thumbnail do vídeo")
    ).toHaveAttribute("src", REMOTE);
  });

  it("renders the helper text tied to the file input", () => {
    render(<ThumbnailUploader thumbnailUrl={REMOTE} />);
    const input = screen.getByLabelText("Alterar thumbnail", {
      selector: "input",
    });
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy)?.textContent).toBe(
      "Auto-gerada ou personalizada - 16:9 recomendada"
    );
  });

  it("previews the chosen file without sending it", async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    render(
      <ThumbnailUploader thumbnailUrl={REMOTE} onFileSelect={onFileSelect} />
    );

    const file = new File(["x"], "nova.png", { type: "image/png" });
    await user.upload(
      screen.getByLabelText("Alterar thumbnail", { selector: "input" }),
      file
    );

    // O preview troca para o arquivo local...
    expect(
      screen.getByAltText("Pré-visualização da thumbnail do vídeo")
    ).toHaveAttribute("src", "blob:preview");
    // ...e o arquivo é entregue ao form, que envia no submit (TD-03).
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("only accepts the image types the backend allows", () => {
    render(<ThumbnailUploader thumbnailUrl={REMOTE} />);
    expect(
      screen.getByLabelText("Alterar thumbnail", { selector: "input" })
    ).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  });

  it("renders the error as an alert tied to the input", () => {
    render(
      <ThumbnailUploader
        thumbnailUrl={REMOTE}
        error="A imagem excede o limite de tamanho"
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "A imagem excede o limite de tamanho"
    );
  });

  it("renders no preview when the video has no thumbnail yet", () => {
    render(<ThumbnailUploader thumbnailUrl={null} />);
    expect(
      screen.queryByAltText("Pré-visualização da thumbnail do vídeo")
    ).not.toBeInTheDocument();
  });
});
