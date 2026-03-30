import { Command } from "commander"
import { readFileSync } from "node:fs"
import { basename } from "node:path"
import { createArtifact, listArtifacts } from "../lib/api.js"
import {
  formatArtifact,
  printError,
  printHuman,
  printResult,
  printSuccess,
  type OutputOptions,
} from "../lib/output.js"

/**
 * Reads all data from stdin and returns it as a UTF-8 string.
 * Used when `--content=-` is passed to pipe content in.
 * @returns The full stdin contents
 */
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString("utf-8")
}

/**
 * Checks if an artifact with matching title, price, and wallet already exists.
 * Used for client-side idempotency to prevent duplicate creates on retry.
 * @returns The existing artifact if found, undefined otherwise
 */
async function findExistingArtifact(
  title: string,
  price: string,
  walletAddress: string
) {
  try {
    const result = await listArtifacts({ search: title, limit: 100 })
    return result.artifacts.find(
      (a) =>
        a.title === title &&
        parseFloat(a.price) === parseFloat(price) &&
        a.wallet_address.toLowerCase() === walletAddress.toLowerCase()
    )
  } catch {
    return undefined
  }
}

/**
 * Registers the `publish new` command.
 * Creates a new gated artifact from text content or a file upload.
 *
 * Supports client-side idempotency: if an artifact with matching title,
 * price, and author already exists, returns it instead of creating a
 * duplicate. Use `--force` to bypass this check.
 *
 * @param program - The root Commander program to attach the command to
 */
export function registerNewCommand(program: Command): void {
  program
    .command("new")
    .description("Publish a new artifact")
    .requiredOption("--price <amount>", "USDC price")
    .requiredOption(
      "--author <address>",
      "Ethereum address to receive payments"
    )
    .option("--file <path>", "File to upload")
    .option("--content <text>", 'Markdown content (use "-" for stdin)')
    .option("--title <title>", "Artifact title")
    .option("--description <desc>", "Short description")
    .option(
      "--dry-run",
      "Validate inputs and show what would be created",
      false
    )
    .option("--force", "Skip duplicate check and always create", false)
    .addHelpText(
      "after",
      `
Examples:
  publish new --price=1.50 --author=0xdead --content="# Hello" --title="My Post"
  publish new --price=5.00 --author=0xdead --file=./report.pdf --title="Report"
  echo "# Piped" | publish new --price=0.50 --author=0xdead --content=-
  publish new --price=1 --author=0xdead --content="# Test" --dry-run
  publish new --price=1 --author=0xdead --content="# Test" --force`
    )
    .action(async (opts) => {
      const globalOpts = program.opts() as OutputOptions

      if (!opts.file && !opts.content) {
        printError(
          'Provide either --file or --content\n  publish new --price=1 --author=0xABC --content="# Hello"',
          globalOpts
        )
        process.exit(1)
      }
      if (opts.file && opts.content) {
        printError("--file and --content are mutually exclusive", globalOpts)
        process.exit(1)
      }

      try {
        let content: string | undefined
        let file: { buffer: Buffer; filename: string } | undefined
        let contentType = "markdown"
        let fileSize: number | undefined

        if (opts.content === "-") {
          content = await readStdin()
        } else if (opts.content) {
          content = opts.content
        } else if (opts.file) {
          const buffer = readFileSync(opts.file)
          file = { buffer, filename: basename(opts.file) }
          contentType = "file"
          fileSize = buffer.length
        }

        if (opts.dryRun) {
          const preview = {
            dry_run: true,
            title: opts.title || null,
            description: opts.description || null,
            price: opts.price,
            author: opts.author,
            content_type: contentType,
            ...(fileSize !== undefined && {
              file: opts.file,
              file_size_bytes: fileSize,
            }),
          }
          printResult(preview, globalOpts)
          if (!globalOpts.json) {
            printHuman(`Would create artifact:`)
            printHuman(`  Title: ${opts.title || "(untitled)"}`)
            printHuman(`  Price: $${opts.price} USDC`)
            printHuman(`  Author: ${opts.author}`)
            printHuman(`  Type: ${contentType}`)
            if (fileSize !== undefined) {
              printHuman(
                `  File: ${opts.file} (${Math.round(fileSize / 1024)}KB)`
              )
            }
            printHuman(`\nNo changes made.`)
          }
          return
        }

        if (opts.title && !opts.force) {
          const existing = await findExistingArtifact(
            opts.title,
            opts.price,
            opts.author
          )
          if (existing) {
            printResult(existing, globalOpts)
            if (!globalOpts.json) {
              printSuccess(
                `Already exists: ${formatArtifact(existing)}`,
                globalOpts
              )
            }
            return
          }
        }

        const artifact = await createArtifact({
          title: opts.title,
          description: opts.description,
          content,
          file,
          price: opts.price,
          walletAddress: opts.author,
        })

        printResult(artifact, globalOpts)
        if (!globalOpts.json) {
          printSuccess(`Published: ${formatArtifact(artifact)}`, globalOpts)
          const apiUrl =
            program.opts().apiUrl ||
            process.env.PUBLISH_NEW_URL ||
            "https://publish.new"
          printSuccess(`URL: ${apiUrl}/${artifact.slug}`, globalOpts)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        printError(message, globalOpts)
        process.exit(1)
      }
    })
}
