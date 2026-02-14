# KasPlay Architecture

High-level system design of the KasPlay platform.

---

## System Overview

```
                              KASPLAY ARCHITECTURE

  +-----------------------------------------------------------------+
  |                          CLIENTS                                 |
  |                                                                  |
  |  Browser (Desktop/Mobile)   Telegram Mini App   PWA (Installed)  |
  |        |                         |                    |          |
  +--------+-------------------------+--------------------+----------+
           |                         |                    |
           +-------------------------+--------------------+
                                     |
                                     v
  +-----------------------------------------------------------------+
  |                    WEB SERVER (Apache/Nginx)                      |
  |                                                                  |
  |  Static Files          API Router           Game Pages           |
  |  (HTML/CSS/JS)        (PHP REST API)       (HTML5 Canvas)        |
  |                            |                                     |
  +----------------------------+-------------------------------------+
                               |
                   +-----------+-----------+
                   v                       v
  +---------------------+   +-----------------------------+
  |      MySQL DB       |   |   Node.js Microservice      |
  |                     |   |   (Express, port 3000)      |
  |  - scores           |   |                             |
  |  - game_tokens      |   |  - TX queue & processing    |
  |  - stats            |   |  - Kaspa WASM SDK           |
  |  - dag_challenges   |   |  - WebSocket (multiplayer)  |
  |  - weekly_snapshots |   |  - Balance cache            |
  |                     |   |                             |
  +---------------------+   +-------------+---------------+
                                          |
                                          v
                            +---------------------------+
                            |    KASPA BLOCKDAG          |
                            |    (Mainnet RPC)           |
                            |                           |
                            |  - Score transactions     |
                            |  - Weekly snapshots       |
                            |  - UTXO management        |
                            |  - Public verification    |
                            +---------------------------+
```

---

## Component Breakdown

### 1. Frontend Layer

**Game Engine:**
- Pure HTML5 Canvas rendering (no game frameworks)
- Vanilla JavaScript - zero external dependencies
- Each game is a self-contained HTML file
- Touch + keyboard controls with responsive layout

**Score Integration:**
- Manages game session lifecycle (start -> play -> submit)
- Collects gameplay events for server-side validation
- Solves Proof-of-Work challenges via WebCrypto API
- Handles token-based session management

**Telegram Integration:**
- Telegram Web App SDK wrapper
- Auto-detects Telegram environment
- Uses Telegram identity for player nickname
- Deep link support for challenges

**PWA:**
- Service Worker with cache-first strategy
- Offline gameplay capability
- Install prompt for mobile/desktop
- Web App Manifest with full icon set

### 2. API Layer (PHP)

**REST API endpoints:**
- `POST /api/start` - Start game session, receive token
- `POST /api/submit` - Submit score with PoW proof
- `GET /api/top/{game}` - Top 10 leaderboard
- `GET /api/scores/{game}` - Paginated scores
- `GET /api/stats` - Server statistics
- `POST /api/challenge/create` - Create player challenge
- `GET /api/challenge/{id}` - Challenge details
- `GET /api/dag-challenge/active` - Active tournament

**Security:**
- PoW challenge-response (difficulty 3-6, dynamic scaling)
- Rate limiting per IP (file-based, no DB dependency)
- Game token validation (prevents replay attacks)
- Gameplay event analysis
- Active play time verification

### 3. Blockchain Microservice (Node.js)

**Transaction Processing:**
- Receives score data from PHP API
- Builds structured payload string
- Creates and signs Kaspa transactions using WASM SDK
- Submits via Kaspa RPC (gRPC protocol)
- Returns transaction ID for explorer linking

**Technical Details:**
- BIP44 key derivation from 24-word mnemonic
- UTXO selection and change calculation
- Transaction mass/fee optimization
- Balance caching (30-second TTL)
- Fallback to PHP CLI execution if microservice down

**Multiplayer (WebSocket):**
- Snake Arena real-time PvP
- Room management and matchmaking
- 2-minute round timer
- Server-authoritative game state

### 4. Database (MySQL)

The database serves as an **index/cache layer**. The Kaspa blockchain is the ultimate source of truth for all scores.

**Tables:**
- `scores` - Game results with tx_id reference to blockchain
- `game_tokens` - Session tokens (anti-replay)
- `stats` - Aggregated statistics
- `dag_challenges` - Tournament definitions
- `weekly_snapshots` - Archived weekly top 10s

### 5. Cron Jobs

- **Weekly Snapshot Seal** - Top 10 per game written to blockchain as weekly summary
- **TX Status Monitor** - Updates pending transaction statuses
- **Blockchain Scanner** - Monitors incoming transactions

---

## Score Submission Flow

```
Player finishes game
        |
        v
[1] Client requests PoW challenge
        |
        v
[2] Server returns SHA-256 challenge (difficulty 3-6)
        |
        v
[3] Client solves PoW via WebCrypto (browser-side mining)
        |
        v
[4] Client submits: score + token + PoW solution + gameplay events
        |
        v
[5] Server validates:
    +-- PoW solution correct?
    +-- Game token valid & unused?
    +-- Rate limit not exceeded?
    +-- Gameplay events plausible?
    +-- Active play time reasonable?
        |
        v
[6] Score saved to MySQL (tx_status: pending)
        |
        v
[7] Microservice builds Kaspa TX:
    +-- Build payload string
    +-- Encode to HEX
    +-- Select UTXO, calculate fee
    +-- Sign with wallet private key
    +-- Submit to Kaspa RPC
        |
        v
[8] TX confirmed on BlockDAG (~1 second)
        |
        v
[9] tx_id saved to database, score appears on leaderboard
    Player can verify on Kaspa Explorer
```

---

## Cost Model

| Metric | Value |
|--------|-------|
| Average fee per score | ~1,900 sompi (~0.0000194 KAS) |
| Scores per 1 KAS | ~50,000 |
| Daily cost (10k games) | ~0.2 KAS |
| USD cost per score | ~$0.0000006 |
| Monthly cost (300k games) | ~6 KAS (~$0.19) |

---

## Platform Support

| Platform | Method |
|----------|--------|
| Desktop Browser | Direct web access |
| Mobile Browser | Responsive web, touch controls |
| PWA (Mobile) | Install from browser, native-like experience |
| PWA (Desktop) | Install from browser, standalone window |
| Telegram | Mini App integration via Web App SDK |

---

*For the on-chain data protocol specification, see [PROTOCOL.md](PROTOCOL.md).*
