import { describe, it, expect, beforeAll } from "vitest"
import {
  ensureBuilt,
  runJson,
  API_URL,
  TEST_WALLET,
  isApiReachable,
  WRITE_ENABLED,
} from "./setup.js"

describe("publish get", () => {
  let reachable: boolean
  let testSlug: string

  beforeAll(async () => {
    ensureBuilt()
    reachable = await isApiReachable()
    if (WRITE_ENABLED && reachable) {
      const { data } = runJson(
        [
          "new",
          "--price=0.01",
          `--author=${TEST_WALLET}`,
          "--content=# Get Test",
          `--title=Get Test ${Date.now()}`,
        ],
        { PUBLISH_NEW_URL: API_URL }
      )
      testSlug = data.slug as string
    }
  })

  const env = { PUBLISH_NEW_URL: API_URL }

  it("fetches artifact metadata", () => {
    if (!WRITE_ENABLED || !reachable) return
    const { data, exitCode } = runJson(["get", testSlug], env)
    expect(exitCode).toBe(0)
    expect(data.slug).toBe(testSlug)
    expect(parseFloat(data.price as string)).toBe(0.01)
  })

  it("returns error for nonexistent slug", () => {
    if (!reachable) return
    const { exitCode } = runJson(["get", "nonexistent-slug-xyz-999"], env)
    expect(exitCode).not.toBe(0)
  })
})
