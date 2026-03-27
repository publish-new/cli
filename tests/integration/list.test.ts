import { describe, it, expect, beforeAll } from "vitest"
import { ensureBuilt, runJson, API_URL, isApiReachable } from "./setup.js"

describe("publish list", () => {
  let reachable: boolean

  beforeAll(async () => {
    ensureBuilt()
    reachable = await isApiReachable()
  })

  const env = { PUBLISH_NEW_URL: API_URL }

  it("lists artifacts", () => {
    if (!reachable) return
    const { data, exitCode } = runJson(["list", "--limit=5"], env)
    expect(exitCode).toBe(0)
    expect(data.artifacts).toBeDefined()
    expect(Array.isArray(data.artifacts)).toBe(true)
    expect(data.page).toBe(1)
  })

  it("supports search", () => {
    if (!reachable) return
    const { data, exitCode } = runJson(
      ["list", "--search=test", "--limit=5"],
      env
    )
    expect(exitCode).toBe(0)
    expect(data.artifacts).toBeDefined()
  })

  it("supports pagination", () => {
    if (!reachable) return
    const { data, exitCode } = runJson(["list", "--page=1", "--limit=2"], env)
    expect(exitCode).toBe(0)
    expect(data.page).toBe(1)
  })
})
