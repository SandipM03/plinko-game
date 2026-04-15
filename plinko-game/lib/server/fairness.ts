import crypto from "node:crypto";

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateNonce(): string {
  return crypto.randomUUID();
}

export function computeCommitHex(serverSeed: string, nonce: string): string {
  return sha256Hex(`${serverSeed}:${nonce}`);
}

export function computeCombinedSeed(
  serverSeed: string,
  clientSeed: string,
  nonce: string,
): string {
  return sha256Hex(`${serverSeed}:${clientSeed}:${nonce}`);
}

export function roundTo6(value: number): number {
  return Number(value.toFixed(6));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
