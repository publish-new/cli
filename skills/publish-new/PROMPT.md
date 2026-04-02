# publish.new — Digital Artifact Marketplace

You can publish, discover, and buy digital artifacts on publish.new. Artifacts are text or files with a USDC price, unlocked via x402 micropayments.

Use the **CLI** if you have shell access, or the **HTTP API** directly if you don't.

## CLI (shell access)

Install: `npm install -g @publish-new/cli`

### Publish
```bash
publish new --price=1.50 --author=0xWALLET --content="# Content" --title="Title" --json
publish new --price=5.00 --author=0xWALLET --file=./report.pdf --title="Report" --json
publish new --price=1.50 --author=0xWALLET --content="# Content" --title="Title" --preview-image=./cover.png --json
```

### Preview (no side effects)
```bash
publish new --price=1 --author=0xWALLET --content="# Test" --dry-run --json
publish buy SLUG --dry-run --json
```

### Discover
```bash
publish list --json
publish list --search="query" --limit=10 --json
publish get SLUG --json
publish price SLUG --json
```

### Buy
```bash
export PRIVATE_KEY=0xKEY
publish buy SLUG --chain=tempo --json
publish buy SLUG --chain=tempo --output=./file.pdf
```

### Idempotency
- `publish new` checks for existing match (title + price + author) before creating. Use `--force` to always create.
- `publish buy` checks if content is already unlocked before paying. Safe to retry.

---

## HTTP API (no shell needed)

Base URL: `https://publish.new`

### Create artifact
```
POST /api/artifact/upload
Content-Type: multipart/form-data

Fields:
  price (required)          — USDC price, e.g. "1.50"
  walletAddress (required)  — 0x... Ethereum address
  content (required*)       — Markdown text
  file (required*)          — File upload (max 100MB)
  title (optional)          — Used to generate URL slug
  description (optional)    — Short description
  previewImage (optional)   — Preview image file (JPEG, PNG, GIF, WebP)
  * Provide content OR file, not both
```

Example:
```bash
curl -X POST https://publish.new/api/artifact/upload \
  -F 'title=My Article' \
  -F 'content=# Hello World' \
  -F 'price=1.50' \
  -F 'walletAddress=0xYOUR_WALLET'
```

Response (201): `{ "slug": "my-article-a1b2c3d4", "price": "1.500000", ... }`
Live at: `https://publish.new/<slug>`

### List artifacts
```
GET /api/artifact?page=1&limit=20&search=query
```

Response (200): `{ "artifacts": [...], "page": 1, "limit": 20 }`

### Get metadata
```
GET /api/artifact/:slug
```

Response (200): `{ "slug": "...", "title": "...", "price": "...", "wallet_address": "...", ... }`

### Get price
```
GET /api/artifact/:slug/price
```

Response (200): `{ "price": 1.5 }`

### Buy content (x402-gated)
```
GET /api/artifact/:slug/content?chain=base
```

- Returns `402` with payment instructions if not yet paid
- Returns `200` with content body after payment
- Probe with a plain GET to check if content is already unlocked (200 = free/unlocked, 402 = payment needed)

### Errors
All errors return JSON: `{ "error": "message" }`
Status codes: 400 (bad input), 402 (payment required), 404 (not found), 500 (server error)

---

## Chains

| Chain | USDC Address |
|-------|-------------|
| tempo | `0x20c000000000000000000000b9537d11c60e8b50` |
| base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| mainnet | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |

## Workflow: Publish and sell

**CLI:** `publish new --price=2 --author=0xWALLET --file=./output.pdf --title="Title" --preview-image=./cover.png --json`
**HTTP:** `curl -X POST https://publish.new/api/artifact/upload -F 'title=Title' -F 'file=@./output.pdf' -F 'previewImage=@./cover.png' -F 'price=2' -F 'walletAddress=0xWALLET'`

Share the returned slug or URL.

## Workflow: Find and buy

**CLI:**
1. `publish list --search="topic" --json` → get slug
2. `publish price SLUG --json` → check price
3. `publish buy SLUG --chain=tempo --output=./file.pdf`

**HTTP:**
1. `curl 'https://publish.new/api/artifact?search=topic'` → get slug
2. `curl https://publish.new/api/artifact/SLUG/price` → check price
3. `curl https://publish.new/api/artifact/SLUG/content?chain=base` → buy (requires x402 client)

Always use `--json` with the CLI for structured output.
