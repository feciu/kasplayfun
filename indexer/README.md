# KasPlay On-Chain Score Indexer

Read and verify KasPlay game scores directly from the Kaspa BlockDAG. No server access needed — this tool queries the public Kaspa API and decodes transaction payloads to show human-readable scores.

**Zero dependencies.** Uses only Node.js built-in APIs.

---

## Quick Start

```bash
# Requires Node.js 18+
cd indexer
node index.mjs
```

That's it. No `npm install` needed.

---

## Usage

```
node index.mjs [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Number of entries to show | 50 |
| `--game <name>` | Filter by game (e.g. `tetris`, `snake`) | all games |
| `--weeks-only` | Show only weekly snapshot payloads | off |
| `--json` | Output as JSON instead of table | off |
| `--address <addr>` | Kaspa address to index | KasPlay server wallet |
| `-h, --help` | Show help | |

### Examples

```bash
# Show last 50 scores
node index.mjs

# Show last 10 scores
node index.mjs --limit 10

# Show only Tetris scores
node index.mjs --game tetris

# Show weekly leaderboard snapshots
node index.mjs --weeks-only

# Output as JSON (for piping to other tools)
node index.mjs --json

# Combine filters
node index.mjs --limit 20 --game snake --json

# Index a different address
node index.mjs --address kaspa:qr...
```

---

## Output

### Score Table

```
  #    Game              Nick                    Score  Lvl    Platform  Date (UTC)            TX
  ----------------------------------------------------------------------------------------------------------------
  1    kasrunner         Rene                      587    3    desktop   2025-02-14 15:30:23   e22a3afa94f6...
  2    kasrunner         Rene                    1,033    3    desktop   2025-02-14 15:30:11   40c51fb25bbd...
  3    ghostclimber      PatriaOtaria            6,095    1    mobile    2025-02-14 15:29:20   2a1b81c3f4d2...
```

### Weekly Snapshots

```
  Week 3 | tetris | 20260120-20260127 | TX: a1b2c3d4e5f6... | 2026-01-27 00:30:00
    1 . KaspaKing              52,400
    2 . BlockMaster             48,100
    3 . CryptoGamer             41,200
```

### JSON Output

```json
[
  {
    "type": "score",
    "game": "tetris",
    "nick": "Player1",
    "score": 52400,
    "level": 12,
    "platform": "desktop",
    "timestamp": 1767539069,
    "txId": "c5afa5...",
    "blockTime": 1767539070000,
    "isAccepted": true,
    "rawPayload": "kasplay:v1:tetris:Player1:52400:12:d:1767539069:a1b2c3d4"
  }
]
```

---

## How It Works

1. Queries the public Kaspa REST API for transactions on the KasPlay wallet address
2. Decodes HEX-encoded payloads to UTF-8 text
3. Filters for KasPlay protocol payloads (prefix `kasplay:v1:`)
4. Parses the colon-separated fields into structured data
5. Displays results as a formatted table or JSON

### Payload Format

**Score:**
```
kasplay:v1:{game}:{nick}:{score}:{level}:{platform}:{timestamp}:{hash}
```

**Weekly snapshot:**
```
kasplay:v1:week:{game}:{weekNum}:{dateRange}:{nick_score|nick_score|...}:{timestamp}:{hash}
```

See [PROTOCOL.md](../PROTOCOL.md) for the full specification.

---

## Verification

Every score in the output includes a transaction ID. You can independently verify any score:

1. Copy the TX ID from the output
2. Open `https://explorer.kaspa.org/txs/<TX_ID>`
3. Find the `payload` field (HEX string)
4. Decode HEX to UTF-8 — you'll see the same `kasplay:v1:...` string

The blockchain is the source of truth. This tool simply makes it human-readable.

---

## Requirements

- Node.js 18+ (for built-in `fetch`)
- Internet connection (to reach `api.kaspa.org`)

---

## License

MIT
