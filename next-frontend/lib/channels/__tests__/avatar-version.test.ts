// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  bumpAvatarVersion,
  getAvatarVersion,
  useAvatarVersion,
} from "@/lib/channels/avatar-version"

describe("avatar version store", () => {
  it("starts without a version and increments per change", () => {
    expect(getAvatarVersion("versao_a")).toBeUndefined()

    bumpAvatarVersion("versao_a")
    bumpAvatarVersion("versao_a")

    expect(getAvatarVersion("versao_a")).toBe(2)
  })

  it("re-renders the subscribers of that channel only", () => {
    const changed = renderHook(() => useAvatarVersion("versao_b"))
    const other = renderHook(() => useAvatarVersion("versao_c"))
    expect(changed.result.current).toBeUndefined()

    act(() => bumpAvatarVersion("versao_b"))

    expect(changed.result.current).toBe(1)
    expect(other.result.current).toBeUndefined()
  })
})
