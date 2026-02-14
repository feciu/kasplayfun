#!/usr/bin/env node

// KasPlay On-Chain Score Indexer
// Reads and verifies game scores directly from the Kaspa BlockDAG.
// Zero dependencies - uses only Node.js built-in APIs.

const DEFAULT_ADDRESS = 'kaspa:qq8903f00vwqtaujqkfdpph36q0vpdq7qpa4ga2yhfv0e8exu59fk7s7a7g4q';
const API_BASE = 'https://api.kaspa.org';
const PAGE_SIZE = 50; // API max per request
const EXPLORER_URL = 'https://explorer.kaspa.org/txs/';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    address: DEFAULT_ADDRESS,
    limit: 50,
    game: null,
    json: false,
    weeksOnly: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--weeks-only') {
      args.weeksOnly = true;
    } else if (arg === '--address' && argv[i + 1]) {
      args.address = argv[++i];
    } else if (arg === '--limit' && argv[i + 1]) {
      args.limit = parseInt(argv[++i], 10);
      if (isNaN(args.limit) || args.limit < 1) {
        console.error('Error: --limit must be a positive integer');
        process.exit(1);
      }
    } else if (arg === '--game' && argv[i + 1]) {
      args.game = argv[++i].toLowerCase();
    } else {
      console.error(`Unknown argument: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }

  return args;
}

function printUsage() {
  console.log(`
KasPlay On-Chain Score Indexer
Read game scores directly from the Kaspa BlockDAG.

Usage:
  node index.mjs [options]

Options:
  --address <addr>   Kaspa address to index (default: KasPlay server wallet)
  --limit <n>        Maximum number of decoded entries to show (default: 50)
  --game <name>      Filter by game (e.g. tetris, snake, breakout)
  --weeks-only       Show only weekly snapshot payloads
  --json             Output as JSON instead of table
  -h, --help         Show this help message

Examples:
  node index.mjs                           Show last 50 scores
  node index.mjs --limit 10               Show last 10 scores
  node index.mjs --game tetris            Show only Tetris scores
  node index.mjs --weeks-only             Show weekly snapshots
  node index.mjs --json                   Output as JSON
  node index.mjs --limit 100 --game snake Filter 100 snake scores
`);
}

// ---------------------------------------------------------------------------
// Kaspa API
// ---------------------------------------------------------------------------

async function fetchTransactions(address, offset, limit) {
  const url = `${API_BASE}/addresses/${address}/full-transactions?limit=${limit}&offset=${offset}&resolve_previous_outpoints=no`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText} (offset=${offset})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Payload decoding
// ---------------------------------------------------------------------------

function hexToUtf8(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

function parseScorePayload(text) {
  // kasplay:v1:game:nick:score:level:platform:timestamp:hash
  const parts = text.split(':');
  if (parts.length < 9) return null;
  if (parts[0] !== 'kasplay' && parts[0] !== 'kp' && parts[0] !== 'tx') return null;
  if (parts[1] !== 'v1') return null;
  if (parts[2] === 'week') return null; // weekly snapshot, not a score

  return {
    type: 'score',
    prefix: parts[0],
    version: parts[1],
    game: parts[2],
    nick: parts[3],
    score: parseInt(parts[4], 10),
    level: parseInt(parts[5], 10),
    platform: parts[6] === 'd' ? 'desktop' : parts[6] === 'm' ? 'mobile' : parts[6],
    timestamp: parseInt(parts[7], 10),
    hash: parts[8],
  };
}

function parseWeeklyPayload(text) {
  // kasplay:v1:week:game:weekNumber:dateRange:top10Data:timestamp:hash
  const parts = text.split(':');
  if (parts.length < 9) return null;
  if (parts[0] !== 'kasplay' && parts[0] !== 'kp' && parts[0] !== 'tx') return null;
  if (parts[1] !== 'v1') return null;
  if (parts[2] !== 'week') return null;

  const top10Raw = parts[6];
  const top10 = top10Raw.split('|').map(entry => {
    const lastUnderscore = entry.lastIndexOf('_');
    if (lastUnderscore === -1) return { nick: entry, score: 0 };
    return {
      nick: entry.substring(0, lastUnderscore),
      score: parseInt(entry.substring(lastUnderscore + 1), 10),
    };
  });

  return {
    type: 'weekly',
    prefix: parts[0],
    version: parts[1],
    game: parts[3],
    weekNumber: parseInt(parts[4], 10),
    dateRange: parts[5],
    top10,
    timestamp: parseInt(parts[7], 10),
    hash: parts[8],
  };
}

function decodePayload(hex) {
  if (!hex || hex === '') return null;
  try {
    const text = hexToUtf8(hex);
    if (!text.startsWith('kasplay:') && !text.startsWith('kp:') && !text.startsWith('tx:')) {
      return null;
    }
    return text;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

function truncate(str, len) {
  if (str.length <= len) return str;
  return str.substring(0, len - 3) + '...';
}

function pad(str, len, alignRight = false) {
  const s = String(str);
  if (s.length >= len) return s;
  const padding = ' '.repeat(len - s.length);
  return alignRight ? padding + s : s + padding;
}

function formatDate(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

function formatBlockTime(ms) {
  const d = new Date(ms);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

function formatNumber(n) {
  return n.toLocaleString('en-US');
}

function printScoresTable(entries) {
  const header = `  ${pad('#', 5)}${pad('Game', 18)}${pad('Nick', 22)}${pad('Score', 12, true)}  ${pad('Lvl', 5, true)}  ${pad('Platform', 10)}${pad('Date (UTC)', 22)}${pad('TX', 14)}`;
  console.log();
  console.log(header);
  console.log('  ' + '-'.repeat(header.length - 2));

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const row = `  ${pad(i + 1, 5)}${pad(truncate(e.game, 16), 18)}${pad(truncate(e.nick, 20), 22)}${pad(formatNumber(e.score), 12, true)}  ${pad(e.level, 5, true)}  ${pad(e.platform, 10)}${pad(formatBlockTime(e.blockTime), 22)}${e.txId.substring(0, 12)}...`;
    console.log(row);
  }
  console.log();
}

function printWeeklyTable(entries) {
  console.log();
  for (const e of entries) {
    console.log(`  Week ${e.weekNumber} | ${e.game} | ${e.dateRange} | TX: ${e.txId.substring(0, 12)}... | ${formatBlockTime(e.blockTime)}`);
    for (let i = 0; i < e.top10.length; i++) {
      const p = e.top10[i];
      console.log(`    ${pad(i + 1, 3)}. ${pad(truncate(p.nick, 20), 22)} ${pad(formatNumber(p.score), 10, true)}`);
    }
    console.log();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  console.log(`KasPlay On-Chain Score Indexer`);
  console.log(`Address: ${args.address}`);
  console.log(`Fetching transactions from Kaspa BlockDAG...`);

  const scores = [];
  const weeklies = [];
  let offset = 0;
  let totalFetched = 0;
  let emptyPage = false;
  const targetCount = args.limit;

  while (!emptyPage) {
    const needed = targetCount - (args.weeksOnly ? weeklies.length : scores.length);
    if (needed <= 0) break;

    // Fetch a page - we may need more than targetCount raw TXs because not all have KasPlay payloads
    const pageSize = Math.min(PAGE_SIZE, Math.max(needed * 2, PAGE_SIZE));
    let txs;
    try {
      txs = await fetchTransactions(args.address, offset, pageSize);
    } catch (err) {
      console.error(`\nError fetching transactions: ${err.message}`);
      process.exit(1);
    }

    if (!Array.isArray(txs) || txs.length === 0) {
      emptyPage = true;
      break;
    }

    totalFetched += txs.length;

    for (const tx of txs) {
      const text = decodePayload(tx.payload);
      if (!text) continue;

      const isWeekly = text.split(':')[2] === 'week';

      if (isWeekly) {
        const parsed = parseWeeklyPayload(text);
        if (!parsed) continue;
        if (args.game && parsed.game.toLowerCase() !== args.game) continue;

        weeklies.push({
          ...parsed,
          txId: tx.transaction_id,
          blockTime: tx.block_time,
          isAccepted: tx.is_accepted,
          rawPayload: text,
        });
      } else {
        const parsed = parseScorePayload(text);
        if (!parsed) continue;
        if (args.game && parsed.game.toLowerCase() !== args.game) continue;

        scores.push({
          ...parsed,
          txId: tx.transaction_id,
          blockTime: tx.block_time,
          isAccepted: tx.is_accepted,
          rawPayload: text,
        });
      }

      // Check if we have enough
      if (args.weeksOnly && weeklies.length >= targetCount) break;
      if (!args.weeksOnly && scores.length >= targetCount) break;
    }

    offset += txs.length;

    // Safety: stop if we've fetched a lot without finding enough results
    if (totalFetched > targetCount * 20 && totalFetched > 1000) {
      break;
    }

    if (txs.length < pageSize) {
      emptyPage = true;
    }
  }

  // Trim to requested limit
  const scoreResults = scores.slice(0, targetCount);
  const weeklyResults = weeklies.slice(0, targetCount);

  // Output
  if (args.json) {
    const output = args.weeksOnly ? weeklyResults : scoreResults;
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  if (args.weeksOnly) {
    if (weeklyResults.length === 0) {
      console.log('\nNo weekly snapshots found.');
    } else {
      console.log(`\nFound ${weeklyResults.length} weekly snapshot(s):`);
      printWeeklyTable(weeklyResults);
    }
  } else {
    if (scoreResults.length === 0) {
      console.log('\nNo scores found.');
    } else {
      console.log(`\nFound ${scoreResults.length} score(s) (scanned ${totalFetched} transactions):\n`);
      printScoresTable(scoreResults);
    }

    // Also show weekly count if any were found
    if (weeklies.length > 0 && !args.game) {
      console.log(`  Also found ${weeklies.length} weekly snapshot(s). Use --weeks-only to view them.`);
      console.log();
    }
  }

  console.log(`  Verify any TX: ${EXPLORER_URL}<transaction_id>`);
  console.log();
}

main();
