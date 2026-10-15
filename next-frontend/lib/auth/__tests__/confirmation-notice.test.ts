import { describe, expect, it } from "vitest"

import {
  outcomeFromStatus,
  parseConfirmationOutcome,
} from "@/lib/auth/confirmation-notice"

describe("parseConfirmationOutcome", () => {
  it.each(["confirmed", "invalid", "error"] as const)("accepts %s", (value) => {
    expect(parseConfirmationOutcome(value)).toBe(value)
  })

  it("takes the first value of a repeated param", () => {
    expect(parseConfirmationOutcome(["invalid", "confirmed"])).toBe("invalid")
  })

  it.each([undefined, "", "CONFIRMED", "<script>"])(
    "ignores %p",
    (value) => {
      expect(parseConfirmationOutcome(value)).toBeNull()
    }
  )
})

describe("outcomeFromStatus", () => {
  it.each([
    [204, "confirmed"],
    [200, "confirmed"],
    [401, "invalid"],
    [429, "error"],
    [400, "error"],
    [500, "error"],
  ] as const)("maps %i to %s", (status, outcome) => {
    expect(outcomeFromStatus(status)).toBe(outcome)
  })
})
