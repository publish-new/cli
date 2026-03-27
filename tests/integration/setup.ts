import { execSync, execFileSync } from "node:child_process"
import { resolve } from "node:path"

const ROOT = resolve(import.meta.dirname, "../..")
const BIN = resolve(ROOT, "dist/bin.js")

let built = false

export function ensureBuilt(): void {
  if (!built) {
    execSync("npm run build", { cwd: ROOT, stdio: "pipe" })
    built = true
  }
}

export function run(
  args: string[],
  env?: Record<string, string>
): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execFileSync("node", [BIN, ...args], {
      cwd: ROOT,
      encoding: "utf-8",
      env: { ...process.env, ...env },
      timeout: 30_000,
    })
    return { stdout, stderr: "", exitCode: 0 }
  } catch (err: unknown) {
    const e = err as {
      stdout?: string
      stderr?: string
      status?: number
    }
    return {
      stdout: e.stdout || "",
      stderr: e.stderr || "",
      exitCode: e.status || 1,
    }
  }
}

export function runJson(
  args: string[],
  env?: Record<string, string>
): { data: Record<string, unknown>; exitCode: number } {
  const result = run(["--json", ...args], env)
  try {
    return { data: JSON.parse(result.stdout), exitCode: result.exitCode }
  } catch {
    return {
      data: { parseError: true, stdout: result.stdout, stderr: result.stderr },
      exitCode: result.exitCode,
    }
  }
}

export const API_URL = process.env.PUBLISH_NEW_URL || "https://www.publish.new"

export const TEST_WALLET =
  process.env.TEST_WALLET || "0x0000000000000000000000000000000000000001"

/** Write tests (create/get/price) only run when explicitly enabled. */
export const WRITE_ENABLED = process.env.RUN_E2E_WRITE === "1"

export async function isApiReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/artifact?limit=1`, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    })
    return res.ok
  } catch {
    return false
  }
}
