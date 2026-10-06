// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react"
import { delay, http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  applyReactionDelta,
  reactionAfterClick,
  useReaction,
} from "@/hooks/use-reaction"
import { server } from "@/mocks/server"

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/videos/abc123",
}))

const ENDPOINT = "/api/videos/abc123/reaction"

beforeEach(() => {
  pushMock.mockClear()
})

describe("reaction helpers", () => {
  it("toggles off the active reaction and switches to the other one", () => {
    expect(reactionAfterClick(null, "like")).toBe("like")
    expect(reactionAfterClick("like", "like")).toBeNull()
    expect(reactionAfterClick("dislike", "like")).toBe("like")
  })

  it("applies the backend delta table to the like count", () => {
    expect(applyReactionDelta({ viewerReaction: null, likesCount: 10 }, "like")).toEqual({
      viewerReaction: "like",
      likesCount: 11,
    })
    expect(
      applyReactionDelta({ viewerReaction: "like", likesCount: 10 }, "dislike")
    ).toEqual({ viewerReaction: "dislike", likesCount: 9 })
    expect(
      applyReactionDelta({ viewerReaction: "dislike", likesCount: 10 }, null)
    ).toEqual({ viewerReaction: null, likesCount: 10 })
  })
})

describe("useReaction", () => {
  it("switches from dislike to like optimistically, before the API answers", async () => {
    server.use(
      http.put(ENDPOINT, async () => {
        await delay(50)
        return HttpResponse.json({ viewerReaction: "like", likesCount: 11 })
      })
    )
    const { result } = renderHook(() =>
      useReaction({
        initial: { viewerReaction: "dislike", likesCount: 10 },
        endpoint: ENDPOINT,
        isAuthenticated: true,
      })
    )

    act(() => result.current.toggleLike())

    expect(result.current.state).toEqual({ viewerReaction: "like", likesCount: 11 })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.state).toEqual({ viewerReaction: "like", likesCount: 11 })
  })

  it("keeps the API value when it differs from the optimistic one", async () => {
    server.use(
      http.put(ENDPOINT, () =>
        HttpResponse.json({ viewerReaction: "like", likesCount: 42 })
      )
    )
    const { result } = renderHook(() =>
      useReaction({
        initial: { viewerReaction: null, likesCount: 10 },
        endpoint: ENDPOINT,
        isAuthenticated: true,
      })
    )

    act(() => result.current.toggleLike())

    await waitFor(() => expect(result.current.state.likesCount).toBe(42))
  })

  it("removes the reaction with DELETE when clicking the active one", async () => {
    const methods: string[] = []
    server.use(
      http.delete(ENDPOINT, ({ request }) => {
        methods.push(request.method)
        return HttpResponse.json({ viewerReaction: null, likesCount: 9 })
      })
    )
    const { result } = renderHook(() =>
      useReaction({
        initial: { viewerReaction: "like", likesCount: 10 },
        endpoint: ENDPOINT,
        isAuthenticated: true,
      })
    )

    act(() => result.current.toggleLike())

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(methods).toEqual(["DELETE"])
    expect(result.current.state).toEqual({ viewerReaction: null, likesCount: 9 })
  })

  it("rolls back and exposes the error code when the mutation fails", async () => {
    server.use(
      http.put(ENDPOINT, () =>
        HttpResponse.json(
          { statusCode: 429, error: "RATE_LIMIT_EXCEEDED", message: "x", code: null },
          { status: 429 }
        )
      )
    )
    const { result } = renderHook(() =>
      useReaction({
        initial: { viewerReaction: null, likesCount: 10 },
        endpoint: ENDPOINT,
        isAuthenticated: true,
      })
    )

    act(() => result.current.toggleLike())

    await waitFor(() => expect(result.current.errorCode).toBe("RATE_LIMIT_EXCEEDED"))
    expect(result.current.state).toEqual({ viewerReaction: null, likesCount: 10 })
  })

  it("sends the anonymous visitor to the login without calling the API", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const { result } = renderHook(() =>
      useReaction({
        initial: { viewerReaction: null, likesCount: 10 },
        endpoint: ENDPOINT,
        isAuthenticated: false,
      })
    )

    act(() => result.current.toggleLike())

    expect(pushMock).toHaveBeenCalledWith("/login?returnTo=%2Fvideos%2Fabc123")
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it("sends the visitor to the login when the session expired (401)", async () => {
    server.use(
      http.put(ENDPOINT, () =>
        HttpResponse.json(
          { statusCode: 401, error: "UNAUTHORIZED", message: "x", code: null },
          { status: 401 }
        )
      )
    )
    const { result } = renderHook(() =>
      useReaction({
        initial: { viewerReaction: null, likesCount: 10 },
        endpoint: ENDPOINT,
        isAuthenticated: true,
      })
    )

    act(() => result.current.toggleDislike())

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/login?returnTo=%2Fvideos%2Fabc123")
    )
  })
})
