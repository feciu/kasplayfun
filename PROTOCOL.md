# KasPlay On-Chain Protocol Specification

This document describes the open protocol used by KasPlay to store game scores on the Kaspa BlockDAG.

---

## Overview

Every game score in KasPlay is stored as a **transaction payload** on the Kaspa network. The payload is encoded as HEX in the transaction's payload field. When decoded to UTF-8, it reveals a structured, human-readable string.

All KasPlay transactions are sent from a single server wallet address, which is publicly displayed on the KasPlay homepage.

---

## Score Payload Format (v1)

### Structure

```
{prefix}:{version}:{game}:{nick}:{score}:{level}:{platform}:{timestamp}:{hash}
```

### Fields

| # | Field | Type | Max Length | Description |
|---|-------|------|-----------|-------------|
| 1 | `prefix` | string | - | Protocol identifier. `kasplay` in production |
| 2 | `version` | string | - | Protocol version. Currently `v1` |
| 3 | `game` | string | 15 chars | Game identifier (e.g. `tetris`, `snake`, `breakout`) |
| 4 | `nick` | string | 20 chars | Player nickname |
| 5 | `score` | integer | - | Final score achieved |
| 6 | `level` | integer | - | Level reached during gameplay |
| 7 | `platform` | char | 1 char | `d` = Desktop, `m` = Mobile |
| 8 | `timestamp` | integer | - | Unix timestamp (seconds since epoch) |
| 9 | `hash` | string | 8 chars | Truncated SHA-256 integrity hash |

### Example

**Decoded payload:**
```
kasplay:v1:tetris:Player1:52400:12:d:1767539069:a1b2c3d4
```

**Meaning:**
- Protocol: kasplay v1
- Game: Tetris
- Player: Player1
- Score: 52,400 points
- Level: 12
- Platform: Desktop
- Time: January 4, 2026 09:24:29 UTC
- Hash: a1b2c3d4

**HEX encoded (as stored on BlockDAG):**
```
6b6173706c61793a76313a7465747269733a506c61796572313a35323430303a31323a643a313736373533393036393a6131623263336434
```

---

## Weekly Snapshot Format (v1)

At the end of each week, KasPlay seals the top 10 scores for each game as a single on-chain transaction.

### Structure

```
{prefix}:{version}:week:{game}:{weekNumber}:{dateRange}:{top10Data}:{timestamp}:{hash}
```

### Fields

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | `prefix` | string | Protocol identifier |
| 2 | `version` | string | Protocol version |
| 3 | `type` | string | Always `week` |
| 4 | `game` | string | Game identifier |
| 5 | `weekNumber` | integer | Season week number |
| 6 | `dateRange` | string | Format: `YYYYMMDD-YYYYMMDD` (start-end) |
| 7 | `top10Data` | string | Compact leaderboard: `nick_score\|nick_score\|...` |
| 8 | `timestamp` | integer | Unix timestamp of snapshot |
| 9 | `hash` | string | Truncated SHA-256 integrity hash |

### Example

```
kasplay:v1:week:tetris:3:20260120-20260127:KaspaKing_52400|BlockMaster_48100|CryptoGamer_41200:1767539069:f8e7d6c5
```

**Meaning:**
- Weekly snapshot for Tetris, Week 3
- Period: January 20-27, 2026
- Top 3 shown: KaspaKing (52,400), BlockMaster (48,100), CryptoGamer (41,200)

---

## Hash Verification

The `hash` field is a truncated SHA-256 used for integrity verification. It ensures that payloads were created by the KasPlay server and not forged.

### Score Hash

```
SHA-256( game + ":" + nick + ":" + score + ":" + level + ":" + platform + ":" + timestamp + ":" + SECRET )
```

The first 8 hex characters of the SHA-256 digest are used.

> **Note:** The `SECRET` is known only to the KasPlay server. This means anyone can *read* scores, but only the server can *create* valid ones.

### Weekly Snapshot Hash

```
SHA-256( game + ":" + weekNumber + ":" + dateRange + ":" + top10String + ":" + timestamp + ":" + SECRET )
```

---

## Transaction Details

### Fee Calculation

KasPlay calculates the minimum transaction fee based on transaction mass:

```
baseMass    = 250
inputMass   = 1200
outputMass  = 50
totalMass   = baseMass + inputMass + outputMass + payloadLength
fee         = ceil(totalMass * 1.25) sompi
```

Typical fee: **~1,900 sompi** (~0.0000194 KAS) per score.

### UTXO Model

KasPlay uses a single-address UTXO wallet:
- Each transaction consumes 1 UTXO and produces 1 change output (back to self)
- This creates a chain of transactions, ensuring sequential ordering
- The wallet address is publicly visible on the KasPlay homepage

---

## How to Verify a Score

1. Find the transaction on [Kaspa Explorer](https://explorer.kaspa.org) or [Kaspa Stream](https://kaspa.stream)
2. Copy the `payload` field (HEX string)
3. Decode HEX to UTF-8 text using any hex converter
4. Parse the colon-separated fields
5. Verify the game, player, score, and timestamp match the leaderboard

### Game Identifiers

| ID | Game |
|----|------|
| `tetris` | Tetris |
| `snake` | Snake |
| `breakout` | Breakout |
| `invaders` | Space Invaders |
| `kaspac` | KasPac |
| `kasbomber` | KasBomber |
| `kasracers` | KasRacers |
| `kasrocket` | Kas Rocket |
| `blockdag` | BlockDAG Runner |
| `kasminer` | KasMiner Pinball |
| `kasrunner` | KasRunner |
| `ghostclimber` | Ghost Climber |
| `crypto-shooter` | Crypto Shooter |
| `trilemma-quest` | Trilemma Quest |
| `snake-multiplayer` | Snake Arena |

---

## Protocol Versioning

The current protocol version is `v1`. The version field allows future upgrades while maintaining backward compatibility. All `v1` payloads follow the format described in this document.

---

*This is an open protocol. Anyone can build tools to read and verify KasPlay scores on the Kaspa BlockDAG.*
