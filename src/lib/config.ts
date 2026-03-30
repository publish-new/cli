/** Represents an ERC-20 currency supported for x402 payments. */
export type X402Currency = {
  symbol: string
  address: string
  decimals: number
}

/** Supported ERC-20 currencies on the Tempo testnet. */
export const TEMPO_CURRENCIES = [
  {
    symbol: "USDC",
    address: "0x20c000000000000000000000b9537d11c60e8b50",
    decimals: 6,
  },
] as const

/** Supported ERC-20 currencies on Base. */
export const BASE_CURRENCIES = [
  {
    symbol: "USDC",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  },
  {
    symbol: "DAI",
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    decimals: 18,
  },
] as const

/** Supported ERC-20 currencies on Ethereum mainnet. */
export const ETHEREUM_CURRENCIES = [
  {
    symbol: "USDC",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
  },
  {
    symbol: "DAI",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
  },
  {
    symbol: "USDT",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
  },
] as const

/** Mapping of chain names to their supported currencies. */
export const X402_CURRENCIES = {
  tempo: TEMPO_CURRENCIES,
  base: BASE_CURRENCIES,
  mainnet: ETHEREUM_CURRENCIES,
} as const

/** All chain names supported for x402 payments. */
export const SUPPORTED_CHAINS = ["tempo", "base", "mainnet"] as const

/** A supported chain name (tempo, base, or mainnet). */
export type Chain = (typeof SUPPORTED_CHAINS)[number]

/** EVM chain IDs for each supported chain. */
export const CHAIN_IDS: Record<Chain, number> = {
  tempo: 4217,
  base: 8453,
  mainnet: 1,
}

/** Default USDC contract address for each chain. */
export const DEFAULT_CURRENCY_ADDRESS: Record<Chain, string> = {
  tempo: TEMPO_CURRENCIES[0].address,
  base: BASE_CURRENCIES[0].address,
  mainnet: ETHEREUM_CURRENCIES[0].address,
}

/**
 * Type guard that checks whether a string is a valid chain name.
 * @param value - The string to validate
 * @returns True if the value is "tempo", "base", or "mainnet"
 */
export function isValidChain(value: string): value is Chain {
  return SUPPORTED_CHAINS.includes(value.toLowerCase() as Chain)
}

/**
 * Looks up an ERC-20 currency by its contract address on a given chain.
 * Performs case-insensitive matching on the address.
 * @param chain - The chain to search
 * @param address - The ERC-20 contract address
 * @returns The matching currency, or undefined if not found
 */
export function getCurrencyByAddress(
  chain: Chain,
  address: string
): X402Currency | undefined {
  return X402_CURRENCIES[chain].find(
    (c) => c.address.toLowerCase() === address.toLowerCase()
  )
}

/** Default publish.new API base URL. */
export const DEFAULT_API_URL = "https://publish.new"
