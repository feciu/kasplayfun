# KasPlay - Arcade Games on Kaspa BlockDAG

**The first arcade gaming platform with immutable on-chain leaderboards on Kaspa.**

> IMPOSSIBLE ON ANY OTHER CHAIN.
> Instant speed. Thousands of transactions. Near-zero cost.

**Live:** [kasplay.fun](https://kasplay.fun)

---

## What is KasPlay?

KasPlay is an arcade gaming platform where every game score is permanently recorded on the Kaspa blockchain as a transaction. Players compete in classic arcade games, and their scores become immutable, verifiable records on the world's fastest proof-of-work BlockDAG.

No tokens. No NFTs. No DeFi gimmicks. Just pure gaming with blockchain-grade integrity.

### The Problem

Traditional gaming leaderboards are centralized, opaque, and easily manipulated. Scores can be altered, deleted, or faked by server admins. Players have no way to independently verify that leaderboards are fair.

### The Solution

KasPlay stores every score directly on the Kaspa BlockDAG. Once submitted, a score is:
- **Immutable** - cannot be changed or deleted by anyone
- **Verifiable** - anyone can decode the transaction payload and confirm the score
- **Transparent** - all game data is publicly auditable on Kaspa Explorer
- **Permanent** - scores exist as long as the Kaspa network exists

### Why Kaspa?

This is only possible on Kaspa. Here's what it would cost to store **18,592 scores** on other chains:

| Chain | Cost per TX | Total for 18,592 scores |
|-------|-----------|------------------------|
| **Ethereum** | $0.12 | **$2,231** |
| **Solana** | $0.0004 | **$7.44** |
| **Kaspa** | $0.0000006 | **$0.011** |

Kaspa's near-zero fees and instant confirmations make it the only chain where storing every single game score on-chain is economically viable.

---

## Games

KasPlay features **15+ arcade games** across multiple categories:

### Arcade
| Game | Description |
|------|-------------|
| Tetris | Classic block-stacking puzzle |
| Snake | Navigate and grow |
| Breakout | Smash the bricks |
| Invaders | Defend Kaspa from alien waves |
| KasPac | Pac-Man meets crypto |
| KasBomber | Strategic bomb placement |
| KasRacers | High-speed racing |
| Kas Rocket | Fly to the moon |
| BlockDAG | Run through the DAG |
| KasMiner | GPU Mining Pinball |
| KasRunner | Jump over legacy systems |
| Ghost Climber | Climb the tower |
| Crypto Shooter | Pop crypto bubbles |

### Educational
| Game | Description |
|------|-------------|
| Trilemma Quest | Learn blockchain through 5 chapters and 13 levels |

### Multiplayer
| Game | Description |
|------|-------------|
| Snake Arena | Real-time PvP snake battles via WebSocket |

---

## Key Features

### On-Chain Score Storage
Every score is written to the Kaspa BlockDAG as a transaction with a structured payload. The payload format is an open protocol - see [PROTOCOL.md](PROTOCOL.md) for full specification.

Example on-chain payload:
```
kasplay:v1:tetris:Player1:52400:12:d:1767539069:a1b2c3d4
```

Verify any score on [Kaspa Explorer](https://explorer.kaspa.org).

### Weekly Seasons & Tournaments
- Weekly leaderboard resets with top 10 scores sealed on-chain as a weekly snapshot
- **DAG Challenges** - tournaments with KAS prize pools
- Challenge system - share a link, challenge anyone to beat your score

### Anti-Cheat Protection
- Server-side gameplay validation
- Proof-of-Work challenge required before each score submission (SHA-256 via WebCrypto)
- Dynamic PoW difficulty scaling based on request frequency
- Event collection and active play time verification
- Rate limiting per IP

### Cross-Platform
- Desktop web browser
- Mobile web (responsive, touch controls)
- **Installable PWA** - install on phone or desktop for native app experience
- **Telegram Mini App** - play directly inside Telegram
- Offline-capable via Service Worker

### Real-Time Stats
The homepage shows live statistics:
- Total scores stored on Kaspa
- Server wallet balance
- Total storage cost in KAS
- Real-time fee comparison vs ETH and SOL

---

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for system design overview.

**Tech stack:**
- Frontend: HTML5 Canvas, vanilla JavaScript, PWA
- Backend: PHP + Node.js microservice
- Blockchain: Kaspa WASM SDK, RPC client
- Real-time: WebSocket (multiplayer)
- Database: MySQL (index/cache, blockchain is source of truth)

---

## On-Chain Protocol

KasPlay uses an open, documented protocol for storing scores on-chain. Anyone can read and verify transaction payloads.

See [PROTOCOL.md](PROTOCOL.md) for the full specification including:
- Score payload format
- Weekly snapshot format
- Hash verification
- Example transactions

---

## Cost Analysis

KasPlay demonstrates Kaspa's viability for high-throughput micro-transactions:

- **Average cost per score:** ~0.0000194 KAS (~$0.0000006 USD)
- **~50,000 scores per 1 KAS**
- **Daily cost for 10,000 games:** ~0.2 KAS (~$0.006 USD)

This makes KasPlay one of the most cost-efficient blockchain applications in existence.

---

## Links

- **Live App:** [kasplay.fun](https://kasplay.fun)
- **Kaspa:** [kaspa.org](https://kaspa.org)
- **Kaspa Explorer:** [explorer.kaspa.org](https://explorer.kaspa.org)
- **Telegram Bot:** Search for KasPlay in Telegram

---

## License

KasPlay is a proprietary project. This repository contains documentation and protocol specification only.

---

*Made with love for the Kaspa community.*
