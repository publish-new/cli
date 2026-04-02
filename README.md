# @publish-new/cli

CLI and agent toolkit for [publish.new](https://publish.new) — publish, discover, and buy digital artifacts with USDC micropayments.

## Install

```bash
npm install -g @publish-new/cli
```

Or run without installing:

```bash
npx @publish-new/cli --help
```

## Quick start

```bash
# Publish a text artifact
publish new --price=1.50 --author=0xYOUR_WALLET --content="# My Article" --title="My Article"

# Publish a file
publish new --price=5.00 --author=0xYOUR_WALLET --file=./report.pdf --title="Premium Report"

# List artifacts
publish list

# Buy content
export PRIVATE_KEY=0xYOUR_KEY
publish buy my-article-a1b2c3d4 --chain=tempo
```

## Commands

### `publish new`

Publish a new artifact with a USDC price.

```bash
publish new --price=1.50 --author=0xWALLET --content="# Hello" --title="My Post"
publish new --price=5.00 --author=0xWALLET --file=./report.pdf
echo "# Piped content" | publish new --price=0.50 --author=0xWALLET --content=-
```

| Flag | Required | Description |
|------|----------|-------------|
| `--price <amount>` | yes | USDC price |
| `--author <address>` | yes | Ethereum address to receive payments |
| `--content <text>` | one of content/file | Markdown text (use `-` for stdin) |
| `--file <path>` | one of content/file | File to upload (any type, max 100MB) |
| `--title <title>` | no | Artifact title (used to generate URL slug) |
| `--description <desc>` | no | Short description |
| `--dry-run` | no | Validate inputs without creating |
| `--force` | no | Skip duplicate check, always create |

**Idempotency:** If `--title` is provided, the CLI checks for an existing artifact with matching title, price, and author before creating. If found, it returns the existing artifact. Use `--force` to bypass this check.

### `publish list`

List and search published artifacts.

```bash
publish list
publish list --search="machine learning" --limit=10
```

| Flag | Default | Description |
|------|---------|-------------|
| `--search <query>` | — | Search title and description |
| `--page <n>` | 1 | Page number |
| `--limit <n>` | 20 | Results per page (max 100) |

### `publish get <slug>`

Get artifact metadata.

```bash
publish get my-article-a1b2c3d4
```

### `publish price <slug>`

Get the USDC price.

```bash
publish price my-article-a1b2c3d4
```

### `publish buy <slug>`

Pay to unlock artifact content via x402.

```bash
publish buy my-article-a1b2c3d4 --chain=tempo
publish buy my-article-a1b2c3d4 --chain=tempo --output=./downloaded.pdf
publish buy my-article-a1b2c3d4 --dry-run
```

| Flag | Default | Description |
|------|---------|-------------|
| `--chain <chain>` | tempo | `tempo`, `base`, or `mainnet` |
| `--currency <address>` | USDC | ERC-20 contract address |
| `--output <path>` | stdout | Save to file |
| `--private-key <key>` | `PRIVATE_KEY` env | Wallet private key |
| `--dry-run` | false | Show price and chain without paying |

**Idempotency:** Before paying, the CLI probes the content endpoint. If the content is already unlocked, it returns it without paying again. Safe to retry.

## Global flags

| Flag | Description |
|------|-------------|
| `--json` | Machine-readable JSON output on stdout |
| `--quiet` | Suppress human-friendly messages on stderr |
| `--api-url <url>` | Override API base URL (default: `https://publish.new`) |

## Agent usage

This CLI is designed to be called by AI agents and automated workflows.

### Use `--json` for structured output

All commands support `--json` for machine-readable output:

```bash
publish list --search="dataset" --json | jq '.artifacts[0].slug'
```

### Preview before acting

Use `--dry-run` to validate without side effects:

```bash
publish new --price=1 --author=0xABC --content="# Test" --dry-run --json
publish buy my-slug --dry-run --json
```

### Safe retries

Both `publish new` and `publish buy` are safe to retry:
- `new` checks for existing artifacts with matching title/price/author
- `buy` checks if content is already unlocked before paying

### Agent skill

Install the [publish-new skill](https://github.com/publish-new/cli/blob/main/skills/publish-new/SKILL.md) from skills.sh, or copy the [standalone prompt](https://github.com/publish-new/cli/blob/main/skills/publish-new/PROMPT.md) into your agent.

### Example: agent-driven publish and sell

```bash
publish new \
  --price=2.00 \
  --author=0xAGENT_WALLET \
  --file=./analysis.pdf \
  --title="Q1 Market Analysis" \
  --json
```

### Example: agent-driven discovery and purchase

```bash
SLUG=$(publish list --search="dataset" --json | jq -r '.artifacts[0].slug')
publish price "$SLUG" --json
export PRIVATE_KEY=0xAGENT_KEY
publish buy "$SLUG" --chain=tempo --output=./dataset.csv
```

## Supported chains and currencies

| Chain | Currency | Address |
|-------|----------|---------|
| `tempo` | USDC | `0x20c000000000000000000000b9537d11c60e8b50` |
| `base` | USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| `base` | DAI | `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb` |
| `mainnet` | USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| `mainnet` | DAI | `0x6B175474E89094C44Da98b954EedeAC495271d0F` |
| `mainnet` | USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |

## Development

```bash
git clone https://github.com/publish-new/cli.git
cd publish-cli
npm install
npm run build
node dist/bin.js --help
```

### Testing

```bash
npm test                              # unit + read-only integration tests
RUN_E2E_WRITE=1 npm test             # also runs tests that create artifacts
RUN_PAYMENT_TESTS=1 PRIVATE_KEY=0x... npm test  # also runs payment tests
```

## Contributing

Pull requests welcome. Please run `npm test` before submitting.

## License

MIT
