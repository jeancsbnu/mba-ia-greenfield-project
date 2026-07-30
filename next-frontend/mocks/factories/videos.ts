import type { paths } from "@/lib/api/types.gen";

export type Video =
  paths["/videos/{publicId}"]["get"]["responses"][200]["content"]["application/json"];

const baseVideo: Video = {
  publicId: "fixture-video",
  title: "Fixture Video",
  description: "A fixture video for tests",
  status: "ready",
  durationSeconds: 42,
  createdAt: "2026-01-01T00:00:00.000Z",
};

export const buildVideo = (overrides: Partial<Video> = {}): Video => ({
  ...baseVideo,
  ...overrides,
});
