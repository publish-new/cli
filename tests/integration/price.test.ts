import { describe, it, expect, beforeAll } from "vitest"
import {
  ensureBuilt,
  runJson,
  API_URL,
  TEST_WALLET,
  isApiReachable,
  WRITE_ENABLED,
} from "./setup.js"

describe("publish price", () => {
  let reachable: boolean
  let testSlug: string

  beforeAll(async () => {
    ensureBuilt()
    reachable = await isApiReachable()
    if (WRITE_ENABLED && reachable) {
      const { data } = runJson(
        [
          "new",
          "--price=2.50",
          `--author=${TEST_WALLET}`,
          "--content=# Price Test",
          `--title=Price Test ${Date.now()}`,
        ],
        { PUBLISH_NEW_URL: API_URL }
      )
      testSlug = data.slug as string
    }
  })

  const env = { PUBLISH_NEW_URL: API_URL }

  it("returns the price", () => {
    if (!WRITE_ENABLED || !reachable) return
    const { data, exitCode } = runJson(["price", testSlug], env)
    expect(exitCode).toBe(0)
    expect(data.price).toBe(2.5)
  })

  it("returns error for nonexistent slug", () => {
    if (!reachable) return
    const { exitCode } = runJson(["price", "nonexistent-slug-xyz-999"], env)
    expect(exitCode).not.toBe(0)
  })
})
