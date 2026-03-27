import { describe, it, expect, beforeAll } from "vitest"
import {
  ensureBuilt,
  runJson,
  API_URL,
  TEST_WALLET,
  isApiReachable,
  WRITE_ENABLED,
} from "./setup.js"

describe("idempotency", () => {
  let reachable: boolean

  beforeAll(async () => {
    ensureBuilt()
    reachable = await isApiReachable()
  })

  const env = { PUBLISH_NEW_URL: API_URL }

  it("returns existing artifact instead of creating duplicate", () => {
    if (!WRITE_ENABLED || !reachable) return

    const uniqueTitle = `Idempotency Test ${Date.now()}`

    const { data: first, exitCode: e1 } = runJson(
      [
        "new",
        "--price=0.01",
        `--author=${TEST_WALLET}`,
        "--content=# Idem",
        `--title=${uniqueTitle}`,
        "--force",
      ],
      env
    )
    expect(e1).toBe(0)

    const { data: second, exitCode: e2 } = runJson(
      [
        "new",
        "--price=0.01",
        `--author=${TEST_WALLET}`,
        "--content=# Idem",
        `--title=${uniqueTitle}`,
      ],
      env
    )
    expect(e2).toBe(0)
    expect(second.slug).toBe(first.slug)
  })

  it("--force bypasses duplicate check", () => {
    if (!WRITE_ENABLED || !reachable) return

    const uniqueTitle = `Force Test ${Date.now()}`

    const { data: first, exitCode: e1 } = runJson(
      [
        "new",
        "--price=0.01",
        `--author=${TEST_WALLET}`,
        "--content=# Force",
        `--title=${uniqueTitle}`,
        "--force",
      ],
      env
    )
    expect(e1).toBe(0)

    const { data: second, exitCode: e2 } = runJson(
      [
        "new",
        "--price=0.01",
        `--author=${TEST_WALLET}`,
        "--content=# Force",
        `--title=${uniqueTitle}`,
        "--force",
      ],
      env
    )
    expect(e2).toBe(0)
    expect(second.slug).not.toBe(first.slug)
  })
})
