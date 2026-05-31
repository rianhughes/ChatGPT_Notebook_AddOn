import { describe, expect, it } from "vitest";

import {
  base64ToBytes,
  bytesToBase64,
  createDataKeyBytes,
  createMasterKeyBytes,
  decryptTextWithDataKey,
  deriveAesKwKeyFromSecret,
  encryptTextWithDataKey,
  randomBytes,
  unwrapRawKeyBytes,
  wrapRawKeyBytes,
} from "../src/core/cryptoCloud";
import { generateRecoveryPhrase, isValidRecoveryPhrase, normalizeRecoveryPhrase } from "../src/core/recoveryPhrase";

const hasSubtleCrypto = Boolean(globalThis.crypto?.subtle);

describe.runIf(hasSubtleCrypto)("cloud crypto primitives", () => {
  it("wraps and unwraps a 256-bit key", async () => {
    const wrappingKey = await deriveAesKwKeyFromSecret({
      secret: "correct horse battery staple",
      salt: randomBytes(16),
      iterations: 50_000,
    });
    const keyBytes = createMasterKeyBytes();
    const wrapped = await wrapRawKeyBytes(wrappingKey, keyBytes);
    const unwrapped = await unwrapRawKeyBytes(wrappingKey, wrapped);

    expect([...unwrapped]).toEqual([...keyBytes]);
  });

  it("encrypts and decrypts text with AAD", async () => {
    const dek = createDataKeyBytes();
    const aad = "cgpt-notebook|enc-v1|user-1|snapshots/latest.enc|42";
    const encrypted = await encryptTextWithDataKey({
      plaintext: "hello encrypted cloud",
      dataKey: dek,
      aad,
    });
    const decrypted = await decryptTextWithDataKey({
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      dataKey: dek,
      aad,
    });

    expect(decrypted).toBe("hello encrypted cloud");
  });

  it("fails decryption when AAD changes", async () => {
    const dek = createDataKeyBytes();
    const encrypted = await encryptTextWithDataKey({
      plaintext: "tamper test",
      dataKey: dek,
      aad: "aad-1",
    });

    await expect(
      decryptTextWithDataKey({
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        dataKey: dek,
        aad: "aad-2",
      }),
    ).rejects.toThrow();
  });

  it("roundtrips base64 encoding for raw bytes", () => {
    const value = createMasterKeyBytes();
    const encoded = bytesToBase64(value);
    const decoded = base64ToBytes(encoded);

    expect([...decoded]).toEqual([...value]);
  });
});

describe("recovery phrase", () => {
  it("generates a valid 24-word phrase", () => {
    const phrase = generateRecoveryPhrase();

    expect(phrase.split(" ")).toHaveLength(24);
    expect(isValidRecoveryPhrase(phrase)).toBe(true);
  });

  it("normalizes whitespace and casing", () => {
    const normalized = normalizeRecoveryPhrase("  Abandon   ABILITY   able  ");

    expect(normalized).toBe("abandon ability able");
  });
});
