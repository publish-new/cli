import { Command } from "commander"
import { listArtifacts } from "../lib/api.js"
import {
  formatArtifact,
  printError,
  printHuman,
  printResult,
  type OutputOptions,
} from "../lib/output.js"

/**
 * Registers the `publish list` command (alias: `publish ls`).
 * Lists published artifacts with optional search and pagination.
 *
 * @param program - The root Commander program to attach the command to
 */
export function registerListCommand(program: Command): void {
  program
    .command("list")
    .alias("ls")
    .description("List published artifacts")
    .option("--page <n>", "Page number", "1")
    .option("--limit <n>", "Results per page", "20")
    .option("--search <query>", "Search title and description")
    .addHelpText(
      "after",
      `
Examples:
  publish list
  publish list --json
  publish list --search="machine learning" --limit=10
  publish list --page=2 --limit=5 --json`
    )
    .action(async (opts) => {
      const globalOpts = program.opts() as OutputOptions

      try {
        const result = await listArtifacts({
          page: parseInt(opts.page, 10),
          limit: parseInt(opts.limit, 10),
          search: opts.search,
        })

        printResult(result, globalOpts)
        if (!globalOpts.json) {
          if (result.artifacts.length === 0) {
            printHuman("No artifacts found.")
          } else {
            for (const artifact of result.artifacts) {
              printHuman(formatArtifact(artifact))
              printHuman("")
            }
            printHuman(
              `Page ${result.page} · ${result.artifacts.length} results`
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
