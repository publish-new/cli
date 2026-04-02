import { DEFAULT_API_URL } from "./config.js"

/**
 * Represents a published artifact on publish.new.
 * Mirrors the server-side artifact schema.
 */
export interface Artifact {
  id: string
  slug: string
  title: string | null
  description: string | null
  content_type: string
  /** USDC price as a decimal string (e.g. "1.50"). */
  price: string
  /** Ethereum address that receives payments for this artifact. */
  wallet_address: string
  attachment_id: string | null
  preview_image_attachment_id: string | null
  created_at: string
  updated_at: string
  /** File attachment metadata, present for file-based artifacts. */
  attachment?: {
    id: string
    originalFilename: string
    mimeType: string
    sizeBytes: number
  } | null
  /** Preview image metadata, present when fetching a single artifact. */
  preview_image?: {
    id: string
    gcsBucket: string
    gcsPath: string
    mimeType: string
  } | null
}

/** Paginated list of artifacts returned by the list endpoint. */
export interface ListResponse {
  artifacts: Artifact[]
  page: number
  limit: number
}

/**
 * Error thrown when the publish.new API returns a non-OK response.
 * Includes the HTTP status code for programmatic handling.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    /** The HTTP status code from the API response. */
    public status: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function getBaseUrl(): string {
  return process.env.PUBLISH_NEW_URL || DEFAULT_API_URL
}

let baseUrlOverride: string | undefined

/**
 * Overrides the API base URL for all subsequent requests.
 * Used by the `--api-url` CLI flag.
 * @param url - The base URL to use (e.g. "https://publish.new")
 */
export function setBaseUrl(url: string): void {
  baseUrlOverride = url
}

function resolveBaseUrl(): string {
  return baseUrlOverride || getBaseUrl()
}

/**
 * Makes a GET request to the publish.new API and parses the JSON response.
 * Follows redirects automatically.
 * @param path - The API path (e.g. "/api/artifact")
 * @param init - Optional fetch RequestInit overrides
 * @returns The parsed JSON response
 * @throws {ApiError} If the response status is not OK
 */
async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${resolveBaseUrl()}${path}`
  const res = await fetch(url, { ...init, redirect: "follow" })
  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(text || res.statusText, res.status)
  }
  return res.json() as Promise<T>
}

const IMAGE_EXTENSIONS: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".heic": "image/heic",
  ".heif": "image/heif",
}

function inferImageMimeType(filename: string): string {
  const ext = filename.toLowerCase().replace(/^.*(\.[^.]+)$/, "$1")
  return IMAGE_EXTENSIONS[ext] || "application/octet-stream"
}

/**
 * Creates a new gated artifact on publish.new.
 * Submits either text content or a file upload as multipart/form-data.
 * @param opts - Artifact creation options
 * @param opts.title - Optional artifact title (used to generate URL slug)
 * @param opts.description - Optional short description
 * @param opts.content - Markdown text content (mutually exclusive with file)
 * @param opts.file - File to upload with buffer and filename (mutually exclusive with content)
 * @param opts.previewImage - Optional preview image with buffer and filename
 * @param opts.price - USDC price as a decimal string
 * @param opts.walletAddress - Ethereum address to receive payments
 * @returns The created artifact metadata
 * @throws {ApiError} On validation errors (400) or server errors (500)
 */
export async function createArtifact(opts: {
  title?: string
  description?: string
  content?: string
  file?: { buffer: Buffer; filename: string }
  previewImage?: { buffer: Buffer; filename: string }
  price: string
  walletAddress: string
}): Promise<Artifact> {
  const formData = new FormData()
  formData.append("price", opts.price)
  formData.append("walletAddress", opts.walletAddress)
  if (opts.title) formData.append("title", opts.title)
  if (opts.description) formData.append("description", opts.description)

  if (opts.file) {
    const blob = new Blob([opts.file.buffer])
    formData.append("file", blob, opts.file.filename)
  } else if (opts.content) {
    formData.append("content", opts.content)
  }

  if (opts.previewImage) {
    const mimeType = inferImageMimeType(opts.previewImage.filename)
    const previewBlob = new Blob([opts.previewImage.buffer], { type: mimeType })
    formData.append("previewImage", previewBlob, opts.previewImage.filename)
  }

  const url = `${resolveBaseUrl()}/api/artifact/upload`
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    redirect: "follow",
  })
  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(text || res.statusText, res.status)
  }
  return res.json() as Promise<Artifact>
}

/**
 * Lists published artifacts with optional pagination and search.
 * @param params - Optional query parameters
 * @param params.page - Page number (1-based, default 1)
 * @param params.limit - Results per page (1-100, default 20)
 * @param params.search - Case-insensitive search on title and description
 * @returns Paginated list of artifacts
 */
export async function listArtifacts(params?: {
  page?: number
  limit?: number
  search?: string
}): Promise<ListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.search) searchParams.set("search", params.search)
  const qs = searchParams.toString()
  return fetchJson<ListResponse>(`/api/artifact${qs ? `?${qs}` : ""}`)
}

/**
 * Fetches metadata for a single artifact by its URL slug.
 * @param slug - The artifact's unique URL slug (e.g. "my-article-a1b2c3d4")
 * @returns The artifact metadata
 * @throws {ApiError} If the artifact is not found (404)
 */
export async function getArtifact(slug: string): Promise<Artifact> {
  return fetchJson<Artifact>(`/api/artifact/${slug}`)
}

/**
 * Fetches the USDC price for an artifact.
 * @param slug - The artifact's unique URL slug
 * @returns An object containing the numeric price
 * @throws {ApiError} If the artifact is not found (404)
 */
export async function getArtifactPrice(
  slug: string
): Promise<{ price: number }> {
  return fetchJson<{ price: number }>(`/api/artifact/${slug}/price`)
}

/**
 * Builds the full URL for the payment-gated content endpoint.
 * This URL is passed to mppx for x402 payment negotiation.
 * @param slug - The artifact's unique URL slug
 * @param chain - The chain to pay on (tempo, base, or mainnet)
 * @param currency - Optional ERC-20 contract address (defaults to USDC)
 * @returns The fully-qualified content URL with query parameters
 */
export function getContentUrl(
  slug: string,
  chain: string,
  currency?: string
): string {
  const params = new URLSearchParams({ chain })
  if (currency) params.set("currency", currency)
  return `${resolveBaseUrl()}/api/artifact/${slug}/content?${params}`
}
