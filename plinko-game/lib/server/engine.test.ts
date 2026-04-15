import { describe, expect, it } from "vitest";
import { computeCombinedSeed, computeCommitHex } from "./fairness";
import { simulateRound } from "./engine";

describe("fairness primitives", () => {
  it("computes commit hash deterministically", () => {
    const serverSeed = "abc123";
    const nonce = "nonce-1";

    expect(computeCommitHex(serverSeed, nonce)).toBe(
      "e2a20cd21f81e3de6ed10bb09fe862276f07bf6ae96b82b1abb9e268b74f7081",
    );
  });

  it("computes combined seed deterministically", () => {
    const value = computeCombinedSeed("server", "client", "n");
    expect(value).toBe("9761f3de1a448d35ef0d5c768d517697ef13f9995e96b5c1b44db8e4a7e33839");
  });
});

describe("deterministic engine", () => {
  const input = {
    serverSeed: "server-seed-001",
    clientSeed: "client-seed-001",
    nonce: "nonce-001",
    dropColumn: 8,
  };

  it("replays exactly the same output for the same inputs", () => {
    const a = simulateRound(input);
    const b = simulateRound(input);

    expect(a.binIndex).toBe(b.binIndex);
    expect(a.pegMapHash).toBe(b.pegMapHash);
    expect(a.path).toEqual(b.path);
  });

  it("creates the required peg map shape", () => {
    const result = simulateRound(input);

    expect(result.pegMap).toHaveLength(12);
    result.pegMap.forEach((row, index) => {
      expect(row).toHaveLength(index + 1);
      row.forEach((bias) => {
        expect(bias).toBeGreaterThanOrEqual(0.4);
        expect(bias).toBeLessThanOrEqual(0.6);
      });
    });
  });

  it("changes behavior when drop column changes", () => {
    const low = simulateRound({ ...input, dropColumn: 0 });
    const high = simulateRound({ ...input, dropColumn: 12 });

    expect(low.adjustment).toBe(-0.06);
    expect(high.adjustment).toBe(0.06);
    expect(low.path).not.toEqual(high.path);
  });
});
