import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  ApiError,
  setBaseUrl,
  listArtifacts,
  getArtifact,
  getArtifactPrice,
  getContentUrl,
} from "../../src/lib/api.js"

describe("api", () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch)
    setBaseUrl("https://test.publish.new")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("listArtifacts", () => {
    it("calls the correct URL with default params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ artifacts: [], page: 1, limit: 20 }),
      })

      await listArtifacts()
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.publish.new/api/artifact",
        expect.objectContaining({ redirect: "follow" })
      )
    })

    it("includes search params in URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ artifacts: [], page: 2, limit: 5 }),
      })

      await listArtifacts({ page: 2, limit: 5, search: "test" })
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain("page=2")
      expect(url).toContain("limit=5")
      expect(url).toContain("search=test")
    })
  })

  describe("getArtifact", () => {
    it("fetches by slug", async () => {
      const mockArtifact = { id: "1", slug: "test-slug" }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockArtifact),
      })

      const result = await getArtifact("test-slug")
      expect(result).toEqual(mockArtifact)
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.publish.new/api/artifact/test-slug",
        expect.objectContaining({ redirect: "follow" })
      )
    })

    it("throws ApiError on 404", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Not Found"),
      })

      await expect(getArtifact("missing")).rejects.toThrow(ApiError)
    })
  })

  describe("getArtifactPrice", () => {
    it("returns the price", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ price: 2.5 }),
      })

      const result = await getArtifactPrice("test-slug")
      expect(result.price).toBe(2.5)
    })
  })

  describe("getContentUrl", () => {
    it("builds URL with chain parameter", () => {
      const url = getContentUrl("my-slug", "base")
      expect(url).toBe(
        "https://test.publish.new/api/artifact/my-slug/content?chain=base"
      )
    })

    it("includes currency when provided", () => {
      const url = getContentUrl("my-slug", "base", "0xabc")
      expect(url).toContain("chain=base")
      expect(url).toContain("currency=0xabc")
    })
  })

  describe("ApiError", () => {
    it("stores status code", () => {
      const err = new ApiError("bad request", 400)
      expect(err.message).toBe("bad request")
      expect(err.status).toBe(400)
      expect(err.name).toBe("ApiError")
    })
  })
})
