import { describe, it, expect, beforeAll } from "vitest"
import { ensureBuilt, run, runJson, API_URL, isApiReachable } from "./setup.js"

/**
 * Integration tests for `publish buy`.
 * Requires a funded wallet — skipped unless RUN_PAYMENT_TESTS=1 is set.
 */
describe("publish buy", () => {
  let reachable: boolean
  const paymentEnabled = process.env.RUN_PAYMENT_TESTS === "1"
  const privateKey = process.env.PRIVATE_KEY

  beforeAll(async () => {
    ensureBuilt()
    reachable = await isApiReachable()
  })

  const env = { PUBLISH_NEW_URL: API_URL }

  it("requires --private-key or PRIVATE_KEY env", () => {
    const { exitCode, data } = runJson(["buy", "some-slug", "--chain=base"], {
      ...env,
      PRIVATE_KEY: "",
    })
    expect(exitCode).not.toBe(0)
    expect(JSON.stringify(data)).toContain("private-key")
  })

  it("rejects invalid chain", () => {
    const { exitCode } = run(
      ["--json", "buy", "some-slug", "--chain=polygon", "--private-key=0x1234"],
      env
    )
    expect(exitCode).not.toBe(0)
  })

  it("performs x402 payment and downloads content", () => {
    if (!paymentEnabled || !privateKey || !reachable) return

    const { exitCode, data } = runJson(
      [
        "buy",
        process.env.TEST_ARTIFACT_SLUG || "test-artifact",
        "--chain=base",
        `--private-key=${privateKey}`,
      ],
      env
    )
    expect(exitCode).toBe(0)
    expect(data.content || data.file).toBeDefined()
  })
})
