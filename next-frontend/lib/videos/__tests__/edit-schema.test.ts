import { describe, it, expect } from "vitest";

import {
  THUMBNAIL_MAX_BYTES,
  VIDEO_CATEGORIES,
  validateThumbnail,
  videoEditSchema,
} from "@/lib/videos/edit-schema";

const VALID = {
  title: "Tour pelo estúdio",
  description: "Setup de 2026",
  category: "Tecnologia" as const,
  visibility: "public" as const,
};

function fileOf(type: string, size: number): File {
  const file = new File(["x"], "thumb", { type });
  // File.size é somente leitura; redefinir é o jeito de simular um arquivo
  // grande sem alocar megabytes no runner.
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("videoEditSchema", () => {
  it("accepts a valid payload", () => {
    expect(videoEditSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = videoEditSchema.safeParse({ ...VALID, title: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a title longer than 100 characters", () => {
    const result = videoEditSchema.safeParse({
      ...VALID,
      title: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts an empty description", () => {
    expect(
      videoEditSchema.safeParse({ ...VALID, description: "" }).success
    ).toBe(true);
  });

  it("rejects a category outside the eight TD-10 values", () => {
    // "Tutoriais" aparece no mock do Figma e não pertence ao enum.
    const result = videoEditSchema.safeParse({
      ...VALID,
      category: "Tutoriais",
    });
    expect(result.success).toBe(false);
  });

  it("offers exactly the eight categories of TD-10", () => {
    expect(VIDEO_CATEGORIES).toHaveLength(8);
    expect(VIDEO_CATEGORIES).not.toContain("Tutoriais");
  });

  it("rejects a visibility outside public/unlisted", () => {
    const result = videoEditSchema.safeParse({
      ...VALID,
      visibility: "private",
    });
    expect(result.success).toBe(false);
  });
});

describe("validateThumbnail", () => {
  it("accepts no file at all", () => {
    expect(validateThumbnail(null)).toBeNull();
  });

  it.each(["image/jpeg", "image/png", "image/webp"])(
    "accepts %s within the size limit",
    (type) => {
      expect(validateThumbnail(fileOf(type, 1024))).toBeNull();
    }
  );

  it("rejects an unsupported MIME type", () => {
    expect(validateThumbnail(fileOf("image/gif", 1024))).toBe("type");
  });

  it("rejects a file above 2 MiB", () => {
    expect(validateThumbnail(fileOf("image/png", THUMBNAIL_MAX_BYTES + 1))).toBe(
      "size"
    );
  });

  it("accepts a file exactly at the limit", () => {
    expect(
      validateThumbnail(fileOf("image/png", THUMBNAIL_MAX_BYTES))
    ).toBeNull();
  });

  it("checks the type before the size", () => {
    // Um GIF gigante deve reportar o tipo: é o erro que o usuário resolve
    // trocando o arquivo, não comprimindo.
    expect(
      validateThumbnail(fileOf("image/gif", THUMBNAIL_MAX_BYTES + 1))
    ).toBe("type");
  });
});
