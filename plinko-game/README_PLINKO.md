# Provably Fair Plinko Game

An interactive Plinko game demonstrating a **commit-reveal RNG protocol** with a deterministic, seed-replayable outcome engine. Built to showcase fairness verification, backend security, and frontend polish.

**Status:** Engineering exercise (no real money involved).

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Fairness & Cryptography](#fairness--cryptography)
4. [API Reference](#api-reference)
5. [How to Verify a Round](#how-to-verify-a-round)
6. [AI Usage & Development Process](#ai-usage--development-process)
7. [Time Log & Future Work](#time-log--future-work)
8. [Testing](#testing)

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **Docker & Docker Compose** (for PostgreSQL)
- **npm** (comes with Node)

### Local Setup

#### 1. Clone and install dependencies

```bash
cd plinko-game
npm install
```

#### 2. Set up environment variables

Create a `.env.local` file in the project root:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/plinko"

# Optional: override port (default 3000)
PORT=3000
```

A sample `.env.example` is provided.

#### 3. Start PostgreSQL with Docker Compose

```bash
docker-compose up -d
```

This starts a Postgres container on `localhost:5432`.

#### 4. Set up the database

```bash
npm run prisma:push
```

This runs Prisma migrations to create the `Round` table.

#### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Available Scripts

```bash
npm run dev              # Start dev server (Next.js)
npm run build            # Build for production
npm run start            # Start production server
npm run test             # Run tests once (vitest)
npm run test:watch       # Run tests in watch mode
npm run lint             # Run ESLint
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:push      # Sync schema to database
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/Next.js)                  │
├─────────────────────────────────────────────────────────────────┤
│  PlinkoGameClient.tsx          VerifyClient.tsx                  │
│  ├─ Canvas rendering           ├─ Form inputs                    │
│  ├─ Ball animation              │  (serverSeed, clientSeed, etc) │
│  ├─ Confetti FX                 ├─ API calls                     │
│  ├─ Keyboard controls           ├─ Result display                │
│  └─ Sound (Web Audio API)       └─ Path replay (text)            │
└─────────────────────────────────────────────────────────────────┘
           ↓ (REST API) ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Node.js / Next.js)                  │
├─────────────────────────────────────────────────────────────────┤
│  API Routes                     Core Logic                       │
│  ├─ POST /api/rounds/commit     ├─ engine.ts (deterministic)     │
│  ├─ POST /api/rounds/:id/start  ├─ fairness.ts (hashing/PRNG)    │
│  ├─ POST /api/rounds/:id/reveal ├─ paytable.ts (multipliers)     │
│  ├─ GET /api/rounds/:id         ├─ validation.ts (schemas)       │
│  └─ GET /api/verify             └─ constants.ts (config)         │
│                                                                   │
│                        Prisma ORM ↓                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
           ↓ (SQL) ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                            │
├─────────────────────────────────────────────────────────────────┤
│  Round                                                            │
│  ├─ id, createdAt, status                                        │
│  ├─ nonce, commitHex, serverSeed (revealed)                      │
│  ├─ clientSeed, combinedSeed                                     │
│  ├─ pegMapHash, dropColumn, binIndex                             │
│  ├─ betCents, payoutMultiplier                                   │
│  ├─ pathJson (path steps for replay)                             │
│  └─ revealedAt (timestamp)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow (Typical Round)

```
1. Client clicks "Drop"
   ↓
2. Frontend: POST /api/rounds/commit
   Backend: Generate serverSeed, nonce → SHA256(serverSeed:nonce) → commitHex
   Store: (CREATED, commitHex, nonce, serverSeed)
   ↓
3. Frontend: POST /api/rounds/:id/start
   Body: { clientSeed, betCents, dropColumn }
   Backend: Simulate round → compute combinedSeed, peg map, path, binIndex
   Store: (STARTED, clientSeed, combinedSeed, pegMapHash, path, etc.)
   Return: { pegMapHash, binIndex, payoutMultiplier, path, ... }
   ↓
4. Frontend: Animate ball along path
   ↓
5. Frontend: POST /api/rounds/:id/reveal
   Backend: Move to REVEALED, store serverSeed reveal timestamp
   Return: { serverSeed }
   ↓
6. User can now verify: GET /api/verify?serverSeed=...&clientSeed=...&nonce=...&dropColumn=...
   Backend: Recompute everything, compare with stored values
   Return: { allMatch, checks, computed, stored }
```

---

## Fairness & Cryptography

### Commit-Reveal Protocol

**Goal:** Prove that outcomes are fair—neither player nor server can influence the result after the other has committed their seed.

#### Step 1: Server Commits

Before the round, the **server**:
1. Generates a random `serverSeed` (32 random bytes, as hex)
2. Generates a random `nonce` (UUID v4)
3. Computes `commitHex = SHA256(serverSeed + ":" + nonce)`
4. Stores `(commitHex, nonce, serverSeed)` in the database with status `CREATED`
5. **Publishes commitHex to the client** (does NOT reveal serverSeed or nonce yet)

#### Step 2: Player Provides Client Seed

When starting the round, the **player**:
1. Provides a free-form `clientSeed` (any string ≥1 char, ≤120 chars)
2. Chooses a `dropColumn` (0–12)
3. Sets `betCents`

#### Step 3: Deterministic Round Execution

The server computes:

```
combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
```

This seed drives **all randomness** in the round (see Deterministic Engine section below).

The outcome is **fully determined** once all three inputs are known. The player and server cannot change it.

#### Step 4: Server Reveals

After the round, the server reveals `serverSeed`. The player can now:

1. Verify `SHA256(serverSeed + ":" + nonce) == commitHex` ✓
2. Recompute `combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)` ✓
3. Re-simulate the entire round and confirm the outcome ✓

### Deterministic Engine

#### PRNG: xorshift32

All randomness in a round comes from a **seeded xorshift32 PRNG**:

```typescript
function createXorShift32(seed: number): () => number {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9; // Prevent zero state

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const normalized = (state >>> 0) / 0x100000000; // [0, 1)
    return normalized;
  };
}
```

**Why xorshift32?**
- Fast and deterministic
- Standard in fairness gaming (well-audited)
- Lightweight for browser/server
- Full 32-bit state space

**Seeding:** The first 8 hex chars of `combinedSeed` are parsed as a 32-bit uint:

```typescript
const uint32seed = Number.parseInt(combinedSeed.slice(0, 8), 16) >>> 0;
const rand = createXorShift32(uint32seed);
```

#### Peg Map Generation

For each of the **12 rows**:
- Row 0 has 1 peg, row 1 has 2 pegs, ..., row 11 has 12 pegs
- Each peg has a **left bias** (probability of ball going left):

```typescript
leftBias = 0.5 + (rand() - 0.5) * 0.2

// This ensures: leftBias ∈ [0.4, 0.6]
// Then round to 6 decimals: leftBias = roundTo6(clamp(leftBias, 0.4, 0.6))
```

All peg biases are consumed **first** in the PRNG stream, before any decisions are made. This ensures:
- **Reproducibility:** Same seed → same peg map every time
- **Fairness:** Peg map is pseudo-random but deterministic

#### Drop Column Influence

The player's choice of `dropColumn` (0–12) influences the outcome via a **bias adjustment**:

```typescript
adjustment = (dropColumn - 6) * 0.01

// For each row decision:
adjustedBias = clamp(leftBias + adjustment, 0, 1)
```

This means:
- Column 0 (far left): adjustment = -0.06 → biases all decisions right
- Column 6 (center): adjustment = 0.00 → no adjustment
- Column 12 (far right): adjustment = +0.06 → biases all decisions left

The adjustment is **clamped** to [0, 1] to ensure valid probabilities.

#### Row Decisions

For each of the 12 rows:
1. Get the current peg under the ball's path: `pegIndex = min(pos, row)`
2. Read the left bias: `leftBias = pegMap[row][pegIndex]`
3. Apply drop column adjustment: `adjustedBias = clamp(leftBias + adjustment, 0, 1)`
4. Draw a random number: `rnd = rand()` (rounded to 6 decimals)
5. **Decision:**
   - If `rnd < adjustedBias` → go LEFT
   - Else → go RIGHT (increment `pos += 1`)

After 12 rows, `pos ∈ [0, 12]` is the **final bin index**.

#### Stable Hashing

The peg map is serialized and hashed for verification:

```typescript
pegMapHash = SHA256(JSON.stringify(pegMap))
```

This allows verifiers to confirm that the same peg map was used without needing the full `combinedSeed`.

### Number Formatting

All probabilities and rnd values are **rounded to 6 decimals** for stability:

```typescript
function roundTo6(value: number): number {
  return Number(value.toFixed(6));
}
```

This ensures:
- Browser and server agree on values (no floating-point drift)
- Stable hashing (same JSON output)
- Readability in logs/debugging

### Hash Algorithm: SHA-256

We use Node's native `crypto.createHash('sha256')`:

```typescript
function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
```

**Why SHA-256?**
- Industry standard (NIST, TLS, Bitcoin)
- Collision-resistant (2^128 complexity)
- Fast
- Available in all modern environments (Node, browsers via SubtleCrypto)
- Well-audited

---

## API Reference

### POST /api/rounds/commit

**Description:** Create a new round and return the commitment.

**Response:**
```json
{
  "roundId": "clui1q2j80001abo0z1z1z1z1",
  "commitHex": "e2a20cd21f81e3de6ed10bb09fe862276f07bf6ae96b82b1abb9e268b74f7081",
  "nonce": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

### POST /api/rounds/:id/start

**Description:** Start a round with player inputs and execute deterministic simulation.

**Request:**
```json
{
  "clientSeed": "seed-1234567-abcdef",
  "betCents": 500,
  "dropColumn": 6
}
```

**Response:**
```json
{
  "roundId": "clui1q2j80001abo0z1z1z1z1",
  "rows": 12,
  "pegMapHash": "abc123...",
  "binIndex": 7,
  "payoutMultiplier": 1.5,
  "commitHex": "e2a20c...",
  "nonce": "123e4567...",
  "path": [
    { "row": 0, "pegIndex": 0, "leftBias": 0.523, "adjustedBias": 0.523, "rnd": 0.812, "direction": "R", "posBefore": 0, "posAfter": 1 },
    ...
  ]
}
```

---

### POST /api/rounds/:id/reveal

**Description:** Reveal the server seed (move round to REVEALED status).

**Response:**
```json
{
  "serverSeed": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

---

### GET /api/rounds/:id

**Description:** Fetch full round details.

**Response:**
```json
{
  "id": "clui1q2j80001abo0z1z1z1z1",
  "createdAt": "2026-04-15T12:00:00Z",
  "status": "REVEALED",
  "nonce": "123e4567...",
  "commitHex": "e2a20c...",
  "serverSeed": "a1b2c3d4...",
  "clientSeed": "seed-1234...",
  "combinedSeed": "9761f3de...",
  "pegMapHash": "abc123...",
  "dropColumn": 6,
  "binIndex": 7,
  "payoutMultiplier": 1.5,
  "betCents": 500,
  "pathJson": [...],
  "revealedAt": "2026-04-15T12:00:05Z"
}
```

---

### GET /api/verify

**Description:** Verify a round by recomputing all hashes/outputs.

**Query Parameters:**
- `serverSeed` (required): The revealed server seed
- `clientSeed` (required): The player's seed
- `nonce` (required): The nonce from commitment
- `dropColumn` (required): The chosen column
- `roundId` (optional): If provided, compare against stored values

**Response (without roundId):**
```json
{
  "commitHex": "e2a20c...",
  "combinedSeed": "9761f3de...",
  "pegMapHash": "abc123...",
  "binIndex": 7,
  "path": [...]
}
```

**Response (with roundId):**
```json
{
  "roundId": "clui1q2j80001abo0z1z1z1z1",
  "allMatch": true,
  "checks": {
    "commitHex": true,
    "combinedSeed": true,
    "pegMapHash": true,
    "binIndex": true,
    "dropColumn": true
  },
  "computed": { ... },
  "stored": { ... }
}
```

---

## How to Verify a Round

### Via the Web UI

1. Play a round at [http://localhost:3000](http://localhost:3000)
2. Copy the **Round ID** from the "Last round" panel
3. Click **"Open Verifier"** (or go to [http://localhost:3000/verify](http://localhost:3000/verify))
4. Paste the Round ID and click **"Load round by ID"**
5. All fields auto-fill; click **"Verify"**
6. See the result: ✓ PASS or ✗ FAIL

### Via the API

```bash
ROUND_ID="clui1q2j80001abo0z1z1z1z1"

# Fetch the round to get all values
curl "http://localhost:3000/api/rounds/$ROUND_ID" > round.json

# Extract and verify
curl "http://localhost:3000/api/verify?$(jq -r '@uri "serverSeed=\(.serverSeed)&clientSeed=\(.clientSeed)&nonce=\(.nonce)&dropColumn=\(.dropColumn)&roundId=$ROUND_ID"' round.json)"
```

### Manual Verification (Offline)

Using `simulateRound` from the codebase:

```typescript
import { simulateRound } from "@/lib/server/engine";
import { computeCommitHex } from "@/lib/server/fairness";

const result = simulateRound({
  serverSeed: "...",
  clientSeed: "...",
  nonce: "...",
  dropColumn: 6,
});

console.log("Commitment valid?", 
  computeCommitHex(serverSeed, nonce) === storedCommitHex
);
console.log("Outcome matches?", result.binIndex === storedBinIndex);
```

---

## AI Usage & Development Process

### What Was AI-Assisted

I used Claude to help with:

1. **Frontend animation logic** — smoothing curves, confetti physics
2. **Tailwind styling** — responsive grid layouts, accessible form components
3. **TypeScript type safety** — ensuring Prisma → API → Frontend types aligned
4. **Testing structure** — vitest patterns and test organization

### What I Implemented Myself

1. **Fairness protocol design** — commit-reveal spec, combined seed derivation
2. **Deterministic engine** — peg map generation, xorshift32 integration, row decisions, bias adjustments
3. **API endpoints** — all route handlers and validations
4. **Database schema** — Prisma modeling
5. **Testing strategy** — which tests matter (reproducibility, bias ranges, column influence)

### Key Prompts & Refinements

**Prompt 1: "Help structure the fairness protocol"**
- AI suggested: Commit-reveal with hash commitment ✓ (Kept — this is standard)
- AI suggested: Use bcrypt for hashing ✗ (Changed — SHA256 is faster, standardized)

**Prompt 2: "Create smooth ball animation"**
- AI suggested: Use cubic-bezier easing ✓ (Kept — works well)
- AI suggested: Physics engine (Matter.js) ✗ (Changed — overkill, deterministic path is authoritative anyway)

**Prompt 3: "Write frontend controls"**
- AI suggested: Mouse click regions ✗ (Changed — keyboard + selector is more accessible)
- AI suggested: Keyboard controls ✓ (Kept — Arrow keys + Space)

**Prompt 4: "Type Prisma JSON responses"**
- AI suggested: `JSON.parse(pathJson)` ✗ (Changed — cast to Prisma.InputJsonValue, avoids runtime overhead)
- AI suggested: Return `as PathStep[]` from API ✓ (Kept — simple and effective)

### What Worked Well

✓ Tailwind for rapid UI iteration  
✓ TypeScript enforcing type safety across API boundaries  
✓ Prisma for schema flexibility (JSON fields for path replay)  
✓ Vitest for fast unit tests  

### What I'd Revisit

- **Frontend animation:** Could use `framer-motion` for complex sequences, but vanilla `requestAnimationFrame` is fine here
- **Testing:** More comprehensive integration tests (see Time Log)
- **Logging:** No request logging; would add Winston or Pino for production

---

## Time Log & Future Work

### Estimated Time Breakdown

| Phase | Hours | Notes |
|-------|-------|-------|
| **Design & Planning** | 0.5 | Commit-reveal spec, API shape, data model |
| **Backend Engine** | 2 | Fairness logic, PRNG, peg map, simulation |
| **API Endpoints** | 1.5 | 5 routes, validation, error handling |
| **Database & Prisma** | 0.5 | Schema, migrations |
| **Frontend Game** | 3 | Canvas, animation, confetti, keyboard |
| **Verifier Page** | 1 | Form, API integration, result display |
| **Unit Tests** | 1 | Fairness, engine reproducibility |
| **Documentation** | 0.5 | README, inline comments |
| **Polish & Debugging** | 1.5 | Audio, accessibility, responsive fixes |
| **TOTAL** | **11.5 hours** | |

### What I'd Do Next (With More Time)

**Immediate (1–2 hrs):**
- [ ] Add integration tests (full round lifecycle)
- [ ] Add API endpoint unit tests (error cases, invalid inputs)
- [ ] Add request logging (Winston/Pino)
- [ ] Deploy to Vercel + Supabase (PostgreSQL)

**Short-term (2–4 hrs):**
- [ ] CSV export of round history
- [ ] Canvas replay animation on verifier page
- [ ] Dark mode / theme system
- [ ] Rate limiting (Redis)
- [ ] Session state (redis) for multi-player scenarios

**Medium-term (4–8 hrs):**
- [ ] Leaderboard (weekly high rollers)
- [ ] WebSocket for live session feed
- [ ] Admin panel (see all rounds, audit trail)
- [ ] Deposit/withdrawal simulation (fake wallet)
- [ ] Browser extension for verification

**Long-term (8+ hrs):**
- [ ] True fixed-timestep physics (Matter.js or Rapier) with discrete decision overlay
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Real fairness audit (publish commit-reveal proofs)
- [ ] Blockchain integration (on-chain verification)

---

## Testing

### Running Tests

```bash
npm run test              # Run once
npm run test:watch       # Watch mode
```

### Test Coverage

**Fairness primitives:**
- ✓ Commit hash determinism
- ✓ Combined seed determinism

**Deterministic Engine:**
- ✓ Replay reproducibility (same inputs → same output)
- ✓ Peg map shape validation
- ✓ Bias range validation [0.4, 0.6]
- ✓ Drop column influence (different columns → different paths)

**See `lib/server/engine.test.ts` for implementation.**

### Example Test Vectors

```typescript
// Input
{
  serverSeed: "server-seed-001",
  clientSeed: "client-seed-001",
  nonce: "nonce-001",
  dropColumn: 8
}

// Deterministic Output
{
  combinedSeed: "a7c6...", // Always the same
  pegMapHash: "f3d2...",   // Always the same
  binIndex: 7,              // Always the same
  path: [...],              // Always the same
  adjustment: 0.02
}
```

Running `simulateRound()` twice with the same inputs produces **byte-for-byte identical output**.

---

## Links

- **Game:** [http://localhost:3000](http://localhost:3000)
- **Verifier:** [http://localhost:3000/verify](http://localhost:3000/verify)
- **API Docs:** See [API Reference](#api-reference) above
- **Source Code:** `lib/server/engine.ts` (deterministic logic)

---

## Deployment

### Environment Variables (Production)

Ensure these are set in your hosting platform:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/plinko
NODE_ENV=production
```

### Docker Build

```bash
docker build -t plinko-game .
docker run -p 3000:3000 -e DATABASE_URL="..." plinko-game
```

### Vercel (Recommended)

1. Push repo to GitHub
2. Import into Vercel
3. Set `DATABASE_URL` env var (use Supabase or Neon for PostgreSQL)
4. Deploy

---

## License & Attribution

This project is an engineering exercise with no real money involved. Codebase is available for educational and interview purposes.

**Libraries used:**
- [Next.js](https://nextjs.org) — React framework
- [Prisma](https://www.prisma.io) — ORM
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [Zod](https://zod.dev) — Validation
- [Vitest](https://vitest.dev) — Testing

---

## Questions?

For clarifications on fairness, PRNG, or implementation details, refer to [Fairness & Cryptography](#fairness--cryptography) or the inline comments in `lib/server/engine.ts` and `lib/server/fairness.ts`.
