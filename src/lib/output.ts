import pc from "picocolors"

/** Options controlling CLI output format. */
export interface OutputOptions {
  /** When true, output structured JSON to stdout instead of human-readable text. */
  json: boolean
  /** When true, suppress informational messages on stderr. */
  quiet: boolean
}

/**
 * Prints data as pretty-printed JSON to stdout.
 * @param data - Any JSON-serializable value
 */
export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2))
}

/**
 * Prints a human-readable message to stderr.
 * @param message - The message to display
 */
export function printHuman(message: string): void {
  console.error(message)
}

/**
 * Prints a green success message to stderr, unless in JSON or quiet mode.
 * @param message - The success message
 * @param opts - Output options controlling format
 */
export function printSuccess(message: string, opts: OutputOptions): void {
  if (!opts.json && !opts.quiet) {
    console.error(pc.green(message))
  }
}

/**
 * Prints an error message. In JSON mode, outputs `{ "error": message }` to
 * stdout. Otherwise prints a red error to stderr.
 * @param message - The error description
 * @param opts - Output options controlling format
 */
export function printError(message: string, opts: OutputOptions): void {
  if (opts.json) {
    console.log(JSON.stringify({ error: message }))
  } else {
    console.error(pc.red(`Error: ${message}`))
  }
}

/**
 * Prints data as JSON to stdout when in JSON mode. No-op otherwise.
 * @param data - Any JSON-serializable value
 * @param opts - Output options controlling format
 */
export function printResult(data: unknown, opts: OutputOptions): void {
  if (opts.json) {
    printJson(data)
  }
}

/**
 * Formats an artifact for human-readable display with colors.
 * Shows title (or slug fallback), price, content type, and date.
 * @param artifact - The artifact metadata to format
 * @returns A multi-line colored string
 */
export function formatArtifact(artifact: {
  slug: string
  title: string | null
  price: string
  content_type: string
  created_at: string
}): string {
  const title = artifact.title || artifact.slug
  const date = new Date(artifact.created_at).toLocaleDateString()
  return `${pc.bold(title)} ${pc.dim(`(${artifact.slug})`)}
  ${pc.green(`$${artifact.price} USDC`)} · ${artifact.content_type} · ${date}`
}
