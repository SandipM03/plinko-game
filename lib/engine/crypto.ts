import crypto from "crypto";

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateCommitHex(serverSeed: string, nonce: string): string {
  return sha256(`${serverSeed}:${nonce}`);
}

export function generateCombinedSeed(
  serverSeed: string,
  clientSeed: string,
  nonce: string
): string {
  return sha256(`${serverSeed}:${clientSeed}:${nonce}`);
}
