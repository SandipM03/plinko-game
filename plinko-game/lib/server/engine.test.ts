import { describe, expect, it } from "vitest";
import { computeCombinedSeed, computeCommitHex, sha256Hex } from "./fairness";
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

  it("hashes are deterministic and reproducible", () => {
    const input = "test-value-123";
    const hash1 = sha256Hex(input);
    const hash2 = sha256Hex(input);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("combined seed incorporates all three inputs", () => {
    const base = computeCombinedSeed("server", "client", "nonce");
    const changed_server = computeCombinedSeed("server-different", "client", "nonce");
    const changed_client = computeCombinedSeed("server", "client-different", "nonce");
    const changed_nonce = computeCombinedSeed("server", "client", "nonce-different");

    expect(base).not.toBe(changed_server);
    expect(base).not.toBe(changed_client);
    expect(base).not.toBe(changed_nonce);
    expect(changed_server).not.toBe(changed_client);
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
    expect(a.combinedSeed).toBe(b.combinedSeed);
  });

  it("produces consistent results across multiple replays", () => {
    const results = Array.from({ length: 5 }, () => simulateRound(input));
    const first = results[0];

    for (const result of results.slice(1)) {
      expect(result.binIndex).toBe(first.binIndex);
      expect(result.pegMapHash).toBe(first.pegMapHash);
      expect(result.path).toEqual(first.path);
    }
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

  it("peg map hash is consistent with JSON serialization", () => {
    const result = simulateRound(input);
    const recalculated = sha256Hex(JSON.stringify(result.pegMap));
    expect(result.pegMapHash).toBe(recalculated);
  });

  it("path has exactly 12 steps (one per row)", () => {
    const result = simulateRound(input);
    expect(result.path).toHaveLength(12);
  });

  it("path steps contain valid values", () => {
    const result = simulateRound(input);
    let currentPos = 0;

    result.path.forEach((step, index) => {
      expect(step.row).toBe(index);
      expect(step.pegIndex).toBeGreaterThanOrEqual(0);
      expect(step.pegIndex).toBeLessThanOrEqual(index);
      expect(step.leftBias).toBeGreaterThanOrEqual(0.4);
      expect(step.leftBias).toBeLessThanOrEqual(0.6);
      expect(step.adjustedBias).toBeGreaterThanOrEqual(0);
      expect(step.adjustedBias).toBeLessThanOrEqual(1);
      expect(step.rnd).toBeGreaterThanOrEqual(0);
      expect(step.rnd).toBeLessThanOrEqual(1);
      expect(step.direction).toMatch(/^[LR]$/);
      expect(step.posBefore).toBe(currentPos);
      expect(typeof step.posAfter).toBe("number");
      expect(step.posAfter).toBeGreaterThanOrEqual(0);
      expect(step.posAfter).toBeLessThanOrEqual(12);

      if (step.direction === "R") {
        currentPos += 1;
      }
    });

    expect(currentPos).toBe(result.binIndex);
  });

  it("bin index is always within range [0, 12]", () => {
    const columns = [0, 3, 6, 9, 12];

    for (const col of columns) {
      const result = simulateRound({ ...input, dropColumn: col });
      expect(result.binIndex).toBeGreaterThanOrEqual(0);
      expect(result.binIndex).toBeLessThanOrEqual(12);
    }
  });

  it("changes behavior when drop column changes", () => {
    const low = simulateRound({ ...input, dropColumn: 0 });
    const high = simulateRound({ ...input, dropColumn: 12 });

    expect(low.adjustment).toBe(-0.06);
    expect(high.adjustment).toBe(0.06);
    expect(low.path).not.toEqual(high.path);
  });

  it("center column (6) has zero adjustment", () => {
    const center = simulateRound({ ...input, dropColumn: 6 });
    expect(center.adjustment).toBe(0);
  });

  it("drop column adjustment is applied correctly", () => {
    
    const test_cases = [
      { col: 0, expected_adj: -0.06 },
      { col: 3, expected_adj: -0.03 },
      { col: 6, expected_adj: 0 },
      { col: 9, expected_adj: 0.03 },
      { col: 12, expected_adj: 0.06 },
    ];

    for (const { col, expected_adj } of test_cases) {
      const result = simulateRound({ ...input, dropColumn: col });
      expect(result.adjustment).toBe(expected_adj);
    }
  });

  it("peg map is deterministic given a seed", () => {
    const result1 = simulateRound(input);
    const result2 = simulateRound(input);


    expect(JSON.stringify(result1.pegMap)).toBe(JSON.stringify(result2.pegMap));

    
    const differentSeed = simulateRound({
      ...input,
      serverSeed: "different-server-seed",
    });
    expect(JSON.stringify(result1.pegMap)).not.toBe(JSON.stringify(differentSeed.pegMap));
  });

  it("rows sum to correct final bin index", () => {
    const result = simulateRound(input);
    let position = 0;

    for (const step of result.path) {
      if (step.direction === "R") {
        position += 1;
      }
     
    }

    expect(position).toBe(result.binIndex);
  });

  it("combined seed is correct format (hex string, 64 chars)", () => {
    const result = simulateRound(input);
    expect(result.combinedSeed).toMatch(/^[a-f0-9]{64}$/);
  });

  it("handles boundary drop columns (0 and 12)", () => {
    const atZero = simulateRound({ ...input, dropColumn: 0 });
    const atTwelve = simulateRound({ ...input, dropColumn: 12 });

    expect(atZero.binIndex).toBeGreaterThanOrEqual(0);
    expect(atZero.binIndex).toBeLessThanOrEqual(12);
    expect(atTwelve.binIndex).toBeGreaterThanOrEqual(0);
    expect(atTwelve.binIndex).toBeLessThanOrEqual(12);
  });
});

describe("test vectors (reference compliance)", () => {
  // Official test vectors for cross-system verification
  const testVectorInputs = {
    serverSeed: "b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc",
    nonce: "42",
    clientSeed: "candidate-hello",
    dropColumn: 6, // center
  };

  const testVectorExpected = {
    commitHex: "bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34",
    combinedSeed: "e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0",
    binIndex: 6,
    prngValues: [0.1106166649, 0.7625129214, 0.0439292176, 0.4578678815, 0.3438999297],
    pegMapRow0: [0.422123],
    pegMapRow1: [0.552503, 0.408786],
    pegMapRow2: [0.491574, 0.468780, 0.436540],
  };

  it("matches reference commitHex", () => {
    const commitHex = computeCommitHex(
      testVectorInputs.serverSeed,
      testVectorInputs.nonce,
    );
    expect(commitHex).toBe(testVectorExpected.commitHex);
  });

  it("matches reference combinedSeed", () => {
    const combinedSeed = computeCombinedSeed(
      testVectorInputs.serverSeed,
      testVectorInputs.clientSeed,
      testVectorInputs.nonce,
    );
    expect(combinedSeed).toBe(testVectorExpected.combinedSeed);
  });

  it("produces correct PRNG sequence from test vector seed", () => {
    // Manually test the PRNG with first 4 bytes of combinedSeed
    const seedHex = testVectorExpected.combinedSeed;
    const uint32seed = Number.parseInt(seedHex.slice(0, 8), 16) >>> 0;

    // Create PRNG (copy of createXorShift32 from engine.ts)
    let state = uint32seed;
    if (state === 0) {
      state = 0x9e3779b9;
    }

    const rand = () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      const normalized = (state >>> 0) / 0x100000000;
      return normalized;
    };

    // Test first 5 values with tolerance for rounding
    const values = Array.from({ length: 5 }, () => rand());
    for (let i = 0; i < 5; i += 1) {
      // Round to 10 decimals for comparison (test vectors have 10dp)
      const computed = Number(values[i].toFixed(10));
      const expected = testVectorExpected.prngValues[i];
      expect(computed).toBeCloseTo(expected, 9);
    }
  });

  it("matches reference peg map values for first few rows", () => {
    const result = simulateRound(testVectorInputs);

    // Row 0
    expect(result.pegMap[0]).toHaveLength(1);
    expect(result.pegMap[0][0]).toBeCloseTo(testVectorExpected.pegMapRow0[0], 5);

    // Row 1
    expect(result.pegMap[1]).toHaveLength(2);
    expect(result.pegMap[1][0]).toBeCloseTo(testVectorExpected.pegMapRow1[0], 5);
    expect(result.pegMap[1][1]).toBeCloseTo(testVectorExpected.pegMapRow1[1], 5);

    // Row 2
    expect(result.pegMap[2]).toHaveLength(3);
    expect(result.pegMap[2][0]).toBeCloseTo(testVectorExpected.pegMapRow2[0], 5);
    expect(result.pegMap[2][1]).toBeCloseTo(testVectorExpected.pegMapRow2[1], 5);
    expect(result.pegMap[2][2]).toBeCloseTo(testVectorExpected.pegMapRow2[2], 5);
  });

  it("produces correct bin index for center column (test vector)", () => {
    const result = simulateRound(testVectorInputs);
    expect(result.binIndex).toBe(testVectorExpected.binIndex);
    expect(result.combinedSeed).toBe(testVectorExpected.combinedSeed);
  });

  it("produces full round output consistent with test vector", () => {
    const result = simulateRound(testVectorInputs);

    expect(result.combinedSeed).toBe(testVectorExpected.combinedSeed);
    expect(result.binIndex).toBe(testVectorExpected.binIndex);
    expect(result.pegMap).toHaveLength(12);
    expect(result.path).toHaveLength(12);

    // Verify path matches the determined bin index
    let pos = 0;
    for (const step of result.path) {
      if (step.direction === "R") {
        pos += 1;
      }
    }
    expect(pos).toBe(result.binIndex);
  });
});
