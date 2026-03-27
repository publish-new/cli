---
name: publish-new
description: Publish, discover, and buy digital artifacts on publish.new with x402 micropayments
author: publish.new
allowed-tools:
  - Bash
  - Read
  - Write
  - WebFetch
---

# publish.new

Publish and sell digital artifacts (text, files, PDFs, datasets) with USDC micropayments via x402.

You have two ways to interact with publish.new:
1. **CLI** — best when you have shell access (`publish` command)
2. **HTTP API** — best when you only have web access (curl/fetch)

---

## Option 1: CLI

### Install

```bash
npm install -g @publish-new/cli
```

Or use without installing:

```bash
npx @publish-new/cli list
```

### Publish an artifact

```bash
publish new --price=1.50 --author=0xYOUR_WALLET --content="# My Article" --title="My Article" --json
publish new --price=5.00 --author=0xYOUR_WALLET --file=./report.pdf --title="Premium Report" --json
echo "# Hello" | publish new --price=0.50 --author=0xYOUR_WALLET --content=- --json
```

Use `--dry-run` to preview without creating:
```bash
publish new --price=1 --author=0xWALLET --content="# Test" --title="Test" --dry-run --json
```

Use `--force` to skip the duplicate check and always create a new artifact:
```bash
publish new --price=1 --author=0xWALLET --content="# Test" --title="Test" --force --json
```

### List artifacts

```bash
publish list --json
publish list --search="machine learning" --limit=10 --json
```

### Get artifact metadata

```bash
publish get my-article-a1b2c3d4 --json
```

### Get price

```bash
publish price my-article-a1b2c3d4 --json
```

### Buy (unlock) content

Requires a funded wallet with USDC on the chosen chain.

```bash
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY
publish buy my-article-a1b2c3d4 --chain=base --json
publish buy my-article-a1b2c3d4 --chain=base --output=./downloaded.pdf
```

Use `--dry-run` to check the price without paying:
```bash
publish buy my-article-a1b2c3d4 --dry-run --json
```

### Idempotency

Commands are safe to retry:
- `publish new` checks for existing artifacts with matching title/price/author before creating
- `publish buy` probes content first — if already unlocked, returns it without paying again

### Global flags

| Flag | Description |
|------|-------------|
| `--json` | Machine-readable JSON output |
| `--quiet` | Suppress human-friendly messages |
| `--api-url <url>` | Override API base URL (default: https://www.publish.new) |

---

## Option 2: HTTP API

Use these endpoints directly when you don't have CLI access (e.g. Claude web sessions, serverless functions, or any HTTP client).

Base URL: `https://www.publish.new`

### POST /api/artifact — Create an artifact

Content-Type: `multipart/form-data`

| Field | Required | Description |
|-------|----------|-------------|
| `price` | yes | USDC price (e.g. `"1.50"`) |
| `walletAddress` | yes | Ethereum address to receive payments (`0x...`) |
| `content` | one of content/file | Markdown text |
| `file` | one of content/file | File upload (max 100MB) |
| `title` | no | Artifact title (used to generate URL slug) |
| `description` | no | Short description |

```bash
curl -X POST https://www.publish.new/api/artifact \
  -F 'title=My Article' \
  -F 'description=A short summary' \
  -F 'content=# Hello World\n\nThis is my article.' \
  -F 'price=1.50' \
  -F 'walletAddress=0xYOUR_WALLET_ADDRESS'
```

File upload:
```bash
curl -X POST https://www.publish.new/api/artifact \
  -F 'title=Premium Report' \
  -F 'file=@./report.pdf' \
  -F 'price=5.00' \
  -F 'walletAddress=0xYOUR_WALLET_ADDRESS'
```

Response (201):
```json
{
  "id": "uuid",
  "slug": "my-article-a1b2c3d4",
  "title": "My Article",
  "description": "A short summary",
  "content_type": "markdown",
  "price": "1.500000",
  "wallet_address": "0x...",
  "attachment_id": null,
  "created_at": "2026-03-25T00:00:00.000Z",
  "updated_at": "2026-03-25T00:00:00.000Z",
  "published_at": "2026-03-25T00:00:00.000Z"
}
```

The artifact is now live at `https://www.publish.new/<slug>`.

### GET /api/artifact — List artifacts

| Param | Default | Description |
|-------|---------|-------------|
| `page` | 1 | Page number |
| `limit` | 20 | Results per page (max 100) |
| `search` | — | Search title and description |

```bash
curl 'https://www.publish.new/api/artifact?limit=10&search=machine+learning'
```

Response (200):
```json
{
  "artifacts": [
    {
      "id": "uuid",
      "slug": "my-article-a1b2c3d4",
      "title": "My Article",
      "description": "A short summary",
      "content_type": "markdown",
      "price": "1.500000",
      "wallet_address": "0x...",
      "attachment_id": null,
      "published_at": "2026-03-25T00:00:00.000Z",
      "created_at": "2026-03-25T00:00:00.000Z",
      "updated_at": "2026-03-25T00:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10
}
```

### GET /api/artifact/:slug — Get artifact metadata

```bash
curl https://www.publish.new/api/artifact/my-article-a1b2c3d4
```

Response (200):
```json
{
  "id": "uuid",
  "slug": "my-article-a1b2c3d4",
  "title": "My Article",
  "description": "A short summary",
  "content_type": "markdown",
  "price": "1.500000",
  "wallet_address": "0x...",
  "attachment_id": null,
  "attachment": null,
  "published_at": "2026-03-25T00:00:00.000Z",
  "created_at": "2026-03-25T00:00:00.000Z",
  "updated_at": "2026-03-25T00:00:00.000Z"
}
```

Errors: 404 if not found, 400 if invalid slug format.

### GET /api/artifact/:slug/price — Get price

```bash
curl https://www.publish.new/api/artifact/my-article-a1b2c3d4/price
```

Response (200):
```json
{
  "price": 1.5
}
```

### GET /api/artifact/:slug/content — Buy and download content

This endpoint is gated by x402. A plain GET without payment headers returns `402 Payment Required`. The x402 protocol handles payment automatically when using an x402-compatible client like [mppx](https://www.npmjs.com/package/mppx).

```bash
curl https://www.publish.new/api/artifact/my-article-a1b2c3d4/content?chain=base
```

| Param | Default | Description |
|-------|---------|-------------|
| `chain` | base | `base`, `mainnet`, or `tempo` |
| `currency` | USDC | ERC-20 contract address |

**Without payment** → 402 with payment instructions in headers.
**After x402 payment** → 200 with content body:
- Markdown artifacts: `Content-Type: text/markdown`
- File artifacts: streamed with `Content-Disposition: attachment; filename="original-name.pdf"`

**Checking if content is already unlocked:**
A plain GET that returns 200 means content is freely accessible or already unlocked. If you get 402, payment is required.

### Error responses

All endpoints return JSON errors:
```json
{
  "error": "Description of what went wrong"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Invalid input (missing fields, bad format) |
| 402 | Payment required (content endpoint) |
| 404 | Artifact not found |
| 500 | Server error |

### Validation rules

- `walletAddress` must match `0x` followed by 40 hex characters
- `price` must be a positive number
- `slug` must match `[a-z0-9-]+`
- File uploads max 100MB

---

## Supported chains and currencies

| Chain | Currency | Contract address |
|-------|----------|-----------------|
| tempo | USDC | `0x20c000000000000000000000b9537d11c60e8b50` |
| base | USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| base | DAI | `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb` |
| mainnet | USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| mainnet | DAI | `0x6B175474E89094C44Da98b954EedeAC495271d0F` |
| mainnet | USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |

---

## Example workflows

### Agent publishes research and sells it

**CLI:**
```bash
publish new \
  --price=2.00 \
  --author=0xAGENT_WALLET \
  --file=./analysis.pdf \
  --title="Q1 Market Analysis" \
  --description="Comprehensive Q1 2026 market analysis" \
  --json
```

**HTTP:**
```bash
curl -X POST https://www.publish.new/api/artifact \
  -F 'title=Q1 Market Analysis' \
  -F 'description=Comprehensive Q1 2026 market analysis' \
  -F 'file=@./analysis.pdf' \
  -F 'price=2.00' \
  -F 'walletAddress=0xAGENT_WALLET'
```

### Agent discovers and buys data

**CLI:**
```bash
RESULTS=$(publish list --search="dataset" --limit=5 --json)
SLUG=$(echo "$RESULTS" | jq -r '.artifacts[0].slug')
publish price "$SLUG" --json
export PRIVATE_KEY=0xAGENT_KEY
publish buy "$SLUG" --chain=base --output=./dataset.csv
```

**HTTP:**
```bash
# Search for artifacts
curl -s 'https://www.publish.new/api/artifact?search=dataset&limit=5' | jq '.artifacts[0].slug'

# Check price
curl -s https://www.publish.new/api/artifact/SLUG/price | jq '.price'

# Buy requires an x402-compatible client (mppx) for automatic payment
```

### Agent publishes text content without a file

**HTTP:**
```bash
curl -X POST https://www.publish.new/api/artifact \
  -F 'title=Daily Market Brief' \
  -F 'content=# Market Brief\n\nToday the market moved significantly...' \
  -F 'price=0.50' \
  -F 'walletAddress=0xAGENT_WALLET'
```

### Idempotency via API

Before creating, search for an existing match:
```bash
# Check if artifact already exists
EXISTING=$(curl -s 'https://www.publish.new/api/artifact?search=My+Title&limit=5')
# Parse results and check for matching title + price + wallet_address
# If found, use the existing slug instead of creating a duplicate
```

Before buying, check if content is already accessible:
```bash
# Probe content endpoint without payment
STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://www.publish.new/api/artifact/SLUG/content)
# If 200, content is already unlocked — no payment needed
# If 402, proceed with x402 payment
```
