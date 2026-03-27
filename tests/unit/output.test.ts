import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  printResult,
  printError,
  formatArtifact,
} from "../../src/lib/output.js"

describe("output", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("printResult", () => {
    it("prints JSON to stdout when json mode is on", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {})
      printResult({ foo: "bar" }, { json: true, quiet: false })
      expect(spy).toHaveBeenCalledWith(JSON.stringify({ foo: "bar" }, null, 2))
    })

    it("does not print when json mode is off", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {})
      printResult({ foo: "bar" }, { json: false, quiet: false })
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe("printError", () => {
    it("prints JSON error when json mode is on", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {})
      printError("something broke", { json: true, quiet: false })
      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({ error: "something broke" })
      )
    })

    it("prints to stderr when json mode is off", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {})
      printError("something broke", { json: false, quiet: false })
      expect(spy).toHaveBeenCalled()
    })
  })

  describe("formatArtifact", () => {
    it("formats artifact with title", () => {
      const result = formatArtifact({
        slug: "test-abc123",
        title: "Test Post",
        price: "1.50",
        content_type: "markdown",
        created_at: "2026-01-01T00:00:00.000Z",
      })
      expect(result).toContain("Test Post")
      expect(result).toContain("$1.50 USDC")
    })

    it("falls back to slug when title is null", () => {
      const result = formatArtifact({
        slug: "test-abc123",
        title: null,
        price: "5.00",
        content_type: "markdown",
        created_at: "2026-01-01T00:00:00.000Z",
      })
      expect(result).toContain("test-abc123")
    })
  })
})
