import { Command } from "commander"
import { getArtifact } from "../lib/api.js"
import {
  formatArtifact,
  printError,
  printHuman,
  printResult,
  type OutputOptions,
} from "../lib/output.js"

/**
 * Registers the `publish get` command.
 * Fetches and displays metadata for a single artifact by its URL slug.
 *
 * @param program - The root Commander program to attach the command to
 */
export function registerGetCommand(program: Command): void {
  program
    .command("get <slug>")
    .description("Get artifact metadata")
    .addHelpText(
      "after",
      `
Examples:
  publish get my-article-a1b2c3d4
  publish get my-article-a1b2c3d4 --json`
    )
    .action(async (slug: string) => {
      const globalOpts = program.opts() as OutputOptions

      try {
        const artifact = await getArtifact(slug)

        printResult(artifact, globalOpts)
        if (!globalOpts.json) {
          printHuman(formatArtifact(artifact))
          if (artifact.description) {
            printHuman(`  ${artifact.description}`)
          }
          if (artifact.attachment) {
            printHuman(
              `  File: ${artifact.attachment.originalFilename} (${artifact.attachment.mimeType}, ${Math.round(artifact.attachment.sizeBytes / 1024)}KB)`
            )
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        printError(message, globalOpts)
        process.exit(1)
      }
    })
}
