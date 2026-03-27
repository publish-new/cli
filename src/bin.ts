#!/usr/bin/env node

/**
 * @publish-new/cli entry point.
 *
 * Registers all subcommands and parses CLI arguments via Commander.
 * The binary is invoked as `publish <command> [options]`.
 *
 * @packageDocumentation
 */

import { createRequire } from "node:module"
import { Command } from "commander"
import { setBaseUrl } from "./lib/api.js"
import { registerNewCommand } from "./commands/new.js"
import { registerListCommand } from "./commands/list.js"
import { registerGetCommand } from "./commands/get.js"
import { registerPriceCommand } from "./commands/price.js"
import { registerBuyCommand } from "./commands/buy.js"

const require = createRequire(import.meta.url)
const { version } = require("../package.json") as { version: string }

const program = new Command()

program
  .name("publish")
  .description("Publish, discover, and buy digital artifacts on publish.new")
  .version(version)
  .option("--api-url <url>", "API base URL", "https://www.publish.new")
  .option("--json", "Output machine-readable JSON", false)
  .option("--quiet", "Suppress human-friendly messages", false)
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts()
    if (opts.apiUrl) {
      setBaseUrl(opts.apiUrl)
    }
  })

registerNewCommand(program)
registerListCommand(program)
registerGetCommand(program)
registerPriceCommand(program)
registerBuyCommand(program)

program.parse()
