import { Command } from "commander"
import { writeFileSync } from "node:fs"
import { getArtifact, getArtifactPrice, getContentUrl } from "../lib/api.js"
import {
  isValidChain,
  DEFAULT_CURRENCY_ADDRESS,
  type Chain,
} from "../lib/config.js"
import {
  printError,
  printHuman,
  printResult,
  printSuccess,
  type OutputOptions,
} from "../lib/output.js"
import { buyContent } from "../lib/payment.js"

/**
 * Probes the content endpoint to check if it's already unlocked.
 * Returns the response if status is 200, null otherwise.
 */
async function probeContent(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url, { redirect: "follow" })
    if (res.ok) return res
    return null
  } catch {
    return null
  }
}

/**
 * Handles the response body — saves to file or prints to stdout.
 */
async function handleContent(
  response: Response,
  slug: string,
  opts: { output?: string },
  globalOpts: OutputOptions
): Promise<void> {
  const contentType = response.headers.get("content-type") || ""
  const isText =
    contentType.includes("text") ||
    contentType.includes("json") ||
    contentType.includes("markdown")

  if (isText) {
    const text = await response.text()
    if (opts.output) {
      writeFileSync(opts.output, text)
      printSuccess(`Saved to ${opts.output}`, globalOpts)
    } else {
      printResult({ slug, content: text, contentType }, globalOpts)
      if (!globalOpts.json) {
        console.log(text)
      }
    }
  } else {
    const buffer = Buffer.from(await response.arrayBuffer())
    const filename =
      opts.output ||
      response.headers
        .get("content-disposition")
        ?.match(/filename="?(.+?)"?$/)?.[1] ||
      `${slug}.bin`
    writeFileSync(filename, buffer)
    printSuccess(`Downloaded: ${filename}`, globalOpts)
    if (globalOpts.json) {
      printResult(
        { slug, file: filename, contentType, size: buffer.length },
        globalOpts
      )
    }
  }
}

/**
 * Registers the `publish buy` command (alias: `publish unlock`).
 * Pays for and downloads payment-gated content via the x402 protocol.
 *
 * Supports client-side idempotency: probes the content endpoint first,
 * and if it returns 200 (already unlocked), returns the content without
 * paying again.
 *
 * @param program - The root Commander program to attach the command to
 */
export function registerBuyCommand(program: Command): void {
  program
    .command("buy <slug>")
    .alias("unlock")
    .description("Pay to unlock artifact content via x402")
    .option("--chain <chain>", "Chain: tempo, base, or mainnet", "base")
    .option(
      "--currency <address>",
      "ERC-20 contract address (defaults to USDC)"
    )
    .option("--output <path>", "Save content to file")
    .option("--private-key <key>", "Wallet private key")
    .option("--dry-run", "Show what would be paid without executing", false)
    .addHelpText(
      "after",
      `
Examples:
  publish buy my-article-a1b2c3d4 --chain=base
  publish buy my-article-a1b2c3d4 --chain=base --output=./downloaded.pdf
  publish buy my-article-a1b2c3d4 --chain=tempo --json
  publish buy my-article-a1b2c3d4 --dry-run
  PRIVATE_KEY=0x... publish buy my-article-a1b2c3d4 --chain=base`
    )
    .action(async (slug: string, opts) => {
      const globalOpts = program.opts() as OutputOptions
      const chain = opts.chain as string

      if (!isValidChain(chain)) {
        printError(
          `Invalid chain "${chain}". Use: tempo, base, or mainnet`,
          globalOpts
        )
        process.exit(1)
      }

      const currency = opts.currency || DEFAULT_CURRENCY_ADDRESS[chain as Chain]
      const url = getContentUrl(slug, chain, currency)

      if (opts.dryRun) {
        try {
          const [artifact, priceData] = await Promise.all([
            getArtifact(slug),
            getArtifactPrice(slug),
          ])
          const preview = {
            dry_run: true,
            slug,
            title: artifact.title,
            price: priceData.price,
            currency: "USDC",
            chain,
          }
          printResult(preview, globalOpts)
          if (!globalOpts.json) {
            printHuman(`Would pay for: ${artifact.title || slug}`)
            printHuman(`  Price: $${priceData.price} USDC`)
            printHuman(`  Chain: ${chain}`)
            printHuman(`\nNo payment made.`)
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error"
          printError(message, globalOpts)
          process.exit(1)
        }
        return
      }

      const privateKey = opts.privateKey || process.env.PRIVATE_KEY
      if (!privateKey) {
        printError(
          "Provide --private-key or set PRIVATE_KEY env var\n  publish buy <slug> --chain=base --private-key=0x...",
          globalOpts
        )
        process.exit(1)
      }

      const hexKey = privateKey.startsWith("0x")
        ? privateKey
        : `0x${privateKey}`

      try {
        // Idempotency: check if content is already unlocked
        const existing = await probeContent(url)
        if (existing) {
          if (!globalOpts.quiet && !globalOpts.json) {
            printHuman(`Content already unlocked for ${slug}`)
          }
          await handleContent(existing, slug, opts, globalOpts)
          return
        }

        if (!globalOpts.quiet && !globalOpts.json) {
          printHuman(`Paying for ${slug} on ${chain}...`)
        }

        const response = await buyContent(
          url,
          hexKey as `0x${string}`,
          chain as Chain
        )

        await handleContent(response, slug, opts, globalOpts)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        printError(message, globalOpts)
        process.exit(1)
      }
    })
}
