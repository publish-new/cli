import { describe, it, expect } from "vitest"
import {
  isValidChain,
  getCurrencyByAddress,
  DEFAULT_CURRENCY_ADDRESS,
  SUPPORTED_CHAINS,
} from "../../src/lib/config.js"

describe("config", () => {
  describe("isValidChain", () => {
    it("accepts valid chains", () => {
      expect(isValidChain("tempo")).toBe(true)
      expect(isValidChain("base")).toBe(true)
      expect(isValidChain("mainnet")).toBe(true)
    })

    it("rejects invalid chains", () => {
      expect(isValidChain("polygon")).toBe(false)
      expect(isValidChain("")).toBe(false)
    })
  })

  describe("getCurrencyByAddress", () => {
    it("finds USDC on base", () => {
      const currency = getCurrencyByAddress(
        "base",
        "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
      )
      expect(currency).toBeDefined()
      expect(currency!.symbol).toBe("USDC")
    })

    it("is case-insensitive", () => {
      const currency = getCurrencyByAddress(
        "base",
        "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
      )
      expect(currency).toBeDefined()
    })

    it("returns undefined for unknown address", () => {
      expect(getCurrencyByAddress("base", "0xdeadbeef")).toBeUndefined()
    })
  })

  describe("constants", () => {
    it("has all supported chains", () => {
      expect(SUPPORTED_CHAINS).toEqual(["tempo", "base", "mainnet"])
    })

    it("has default currency for each chain", () => {
      for (const chain of SUPPORTED_CHAINS) {
        expect(DEFAULT_CURRENCY_ADDRESS[chain]).toBeDefined()
      }
    })
  })
})
