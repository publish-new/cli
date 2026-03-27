import { Command } from "commander"
import { getArtifactPrice } from "../lib/api.js"
import {
  printError,
  printHuman,
  printResult,
  type OutputOptions,
} from "../lib/output.js"

/**
 * Registers the `publish price` command.
 * Fetches and displays the USDC price for a single artifact.
 *
 * @param program - The root Commander program to attach the command to
 */
export function registerPriceCommand(program: Command): void {
  program
    .command("price <slug>")
    .description("Get artifact price in USDC")
    .addHelpText(
      "after",
      `
Examples:
  publish price my-article-a1b2c3d4
  publish price my-article-a1b2c3d4 --json`
    )
    .action(async (slug: string) => {
      const globalOpts = program.opts() as OutputOptions

      try {
        const result = await getArtifactPrice(slug)

        printResult({ price: result.price, currency: "USDC" }, globalOpts)
        if (!globalOpts.json) {
          printHuman(`$${result.price} USDC`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        printError(message, globalOpts)
        process.exit(1)
      }
    })
}
