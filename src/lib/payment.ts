import { Credential, Method, z } from "mppx"
import {
  type Address,
  type Chain as ViemChain,
  createWalletClient,
  encodeFunctionData,
  erc20Abi,
  http,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sendTransaction } from "viem/actions"
import { base, mainnet } from "viem/chains"
import { type Chain, CHAIN_IDS } from "./config.js"

/** Custom Tempo chain definition (not included in viem's built-in chains). */
const tempo: ViemChain = {
  id: CHAIN_IDS.tempo,
  name: "Tempo",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.tempo.xyz"] },
  },
}

/** Mapping from publish.new chain names to viem Chain objects. */
const VIEM_CHAINS: Record<Chain, ViemChain> = {
  tempo,
  base,
  mainnet,
}

/**
 * Creates an mppx Method definition for the "charge" intent on a given chain.
 * Defines the credential and request schemas used during x402 payment negotiation.
 * @param name - The method name (derived from chain name, e.g. "base")
 * @returns An mppx Method instance
 */
function createChargeMethod(name: string) {
  return Method.from({
    name,
    intent: "charge" as const,
    schema: {
      credential: {
        payload: z.discriminatedUnion("type", [
          z.object({ hash: z.hash(), type: z.literal("hash") }),
          z.object({
            signature: z.signature(),
            type: z.literal("transaction"),
          }),
        ]),
      },
      request: z.object({
        amount: z.string(),
        chainId: z.optional(z.number()),
        currency: z.string(),
        decimals: z.number(),
        description: z.optional(z.string()),
        externalId: z.optional(z.string()),
        recipient: z.optional(z.string()),
      }),
    },
  })
}

/**
 * Creates an mppx charge client that signs ERC-20 transfer transactions
 * using a local private key. This replaces the browser-based wagmi wallet
 * connector used in the web app.
 *
 * Payment flow:
 * 1. Server responds 402 with a payment challenge
 * 2. This client encodes an ERC-20 `transfer(recipient, amount)` call
 * 3. Sends the transaction via the chain's RPC
 * 4. Returns the tx hash as a credential for the server to verify
 *
 * @param chain - The viem Chain to transact on
 * @param privateKey - Hex-encoded private key for signing
 * @returns An mppx method client that handles payment challenges
 */
function createCharge(chain: ViemChain, privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey)
  const method = createChargeMethod(chain.name.split(" ")[0].toLowerCase())

  return Method.toClient(method, {
    context: z.object({
      account: z.optional(z.custom<Address>()),
      mode: z.optional(z.enum(["push", "pull"])),
    }),

    async createCredential({
      challenge,
    }: {
      challenge: {
        id: string
        realm: string
        method: string
        intent: string
        request: Record<string, unknown>
      }
    }) {
      const client = createWalletClient({
        account,
        chain,
        transport: http(),
      })

      const { request } = challenge
      const amount = request.amount as string
      const currency = request.currency as Address
      const recipient = request.recipient as Address

      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient, BigInt(amount)],
      })

      const hash = await sendTransaction(client, {
        account,
        chain,
        to: currency,
        data,
      })

      return Credential.serialize({
        challenge,
        payload: { hash, type: "hash" },
        source: `did:pkh:eip155:${chain.id}:${account.address}`,
      })
    },
  })
}

/**
 * Fetches payment-gated content by performing the full x402 payment flow.
 * Handles the 402 challenge-response automatically via mppx.
 *
 * @param url - The content endpoint URL (from {@link getContentUrl})
 * @param privateKey - Hex-encoded private key with USDC balance for payment
 * @param chain - The chain to pay on (must match the URL's chain parameter)
 * @returns The unlocked content response (text or binary)
 * @throws If the payment transaction fails or the wallet has insufficient balance
 */
export async function buyContent(
  url: string,
  privateKey: `0x${string}`,
  chain: Chain
): Promise<Response> {
  const { Mppx } = await import("mppx/client")

  const viemChain = VIEM_CHAINS[chain]
  const methods = [createCharge(viemChain, privateKey)]

  const mppx = Mppx.create({ methods })
  return mppx.fetch(url)
}
