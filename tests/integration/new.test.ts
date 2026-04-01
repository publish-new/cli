import { describe, it, expect, beforeAll } from "vitest"
import { resolve } from "node:path"
import {
  ensureBuilt,
  run,
  runJson,
  API_URL,
  TEST_WALLET,
  WRITE_ENABLED,
} from "./setup.js"

describe("publish new", () => {
  beforeAll(() => ensureBuilt())

  const env = { PUBLISH_NEW_URL: API_URL }

  it("creates a text artifact", () => {
    if (!WRITE_ENABLED) return
    const uniqueTitle = `CLI Test ${Date.now()}`
    const { data, exitCode } = runJson(
      [
        "new",
        "--price=0.01",
        `--author=${TEST_WALLET}`,
        "--content=# Test Content",
        `--title=${uniqueTitle}`,
      ],
      env
    )
    expect(exitCode).toBe(0)
    expect(data.slug).toBeDefined()
    expect(parseFloat(data.price as string)).toBe(0.01)
    expect(data.wallet_address).toBe(TEST_WALLET)
    expect(data.title).toBe(uniqueTitle)
  })

  it("creates a file artifact", () => {
    if (!WRITE_ENABLED) return
    const fixturePath = resolve(
      import.meta.dirname,
      "../fixtures/test-file.txt"
    )
    const uniqueTitle = `CLI File Test ${Date.now()}`
    const { data, exitCode } = runJson(
      [
        "new",
        "--price=0.02",
        `--author=${TEST_WALLET}`,
        `--file=${fixturePath}`,
        `--title=${uniqueTitle}`,
      ],
      env
    )
    expect(exitCode).toBe(0)
    expect(data.slug).toBeDefined()
    expect(data.attachment_id).toBeDefined()
  })

  it("creates an artifact with a preview image", () => {
    if (!WRITE_ENABLED) return
    const fixturePath = resolve(
      import.meta.dirname,
      "../fixtures/test-image.png"
    )
    const uniqueTitle = `CLI Preview Image Test ${Date.now()}`
    const { data, exitCode } = runJson(
      [
        "new",
        "--price=0.01",
        `--author=${TEST_WALLET}`,
        "--content=# Preview Image Test",
        `--title=${uniqueTitle}`,
        `--preview-image=${fixturePath}`,
      ],
      env
    )
    expect(exitCode).toBe(0)
    expect(data.slug).toBeDefined()
    expect(data.preview_image_attachment_id).toBeDefined()
  })

  it("fails without --content or --file", () => {
    const { exitCode } = run(
      ["--json", "new", "--price=1", `--author=${TEST_WALLET}`],
      env
    )
    expect(exitCode).not.toBe(0)
  })
})
