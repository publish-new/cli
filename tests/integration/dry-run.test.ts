import { describe, it, expect, beforeAll } from "vitest"
import {
  ensureBuilt,
  run,
  runJson,
  API_URL,
  TEST_WALLET,
  isApiReachable,
} from "./setup.js"

describe("--dry-run", () => {
  beforeAll(() => ensureBuilt())

  const env = { PUBLISH_NEW_URL: API_URL }

  describe("publish new --dry-run", () => {
    it("returns preview without creating", () => {
      const { data, exitCode } = runJson(
        [
          "new",
          "--price=1.50",
          `--author=${TEST_WALLET}`,
          "--content=# Test",
          "--title=Dry Run",
          "--dry-run",
        ],
        env
      )
      expect(exitCode).toBe(0)
      expect(data.dry_run).toBe(true)
      expect(data.price).toBe("1.50")
      expect(data.title).toBe("Dry Run")
      expect(data.content_type).toBe("markdown")
    })

    it("shows file info for file dry-run", () => {
      const { data, exitCode } = runJson(
        [
          "new",
          "--price=1",
          `--author=${TEST_WALLET}`,
          "--file=tests/fixtures/test-file.txt",
          "--dry-run",
        ],
        env
      )
      expect(exitCode).toBe(0)
      expect(data.dry_run).toBe(true)
      expect(data.content_type).toBe("file")
      expect(data.file_size_bytes).toBeGreaterThan(0)
    })

    it("still validates required flags", () => {
      const { exitCode } = run(
        ["--json", "new", "--price=1", `--author=${TEST_WALLET}`, "--dry-run"],
        env
      )
      expect(exitCode).not.toBe(0)
    })
  })

  describe("publish buy --dry-run", () => {
    let reachable: boolean

    beforeAll(async () => {
      reachable = await isApiReachable()
    })

    it("does not require private key", () => {
      if (!reachable) return
      const { data, exitCode } = runJson(
        ["buy", "new-artifact-d5313b68", "--dry-run"],
        { ...env, PRIVATE_KEY: "" }
      )
      if (exitCode !== 0) return
      expect(data.dry_run).toBe(true)
      expect(data.price).toBeDefined()
      expect(data.chain).toBe("base")
      expect(data.currency).toBe("USDC")
    })
  })
})
