# Hybrid Indexing Engine — Full Project Guide

## Overview
This repository is a browser-based visualization and interactive playground for a Hybrid Indexing Engine built around an LSM (Log-Structured Merge) Tree. It demonstrates and visualizes core components used in high-throughput key-value stores: Memtable (skip list), Bloom filter, SSTables on disk, and compaction.

The app is implemented in vanilla ES6 modules and runs directly in modern browsers. The UI is a single-page interface with a command terminal, live metrics, storage visualizations, and query tracing.

---

## High-level Architecture
- `engine/` — Core data-structure implementations:
  - `LSMTree.js` — Orchestrates memtable, flush, SSTable creation and compaction.
  - `Skiplist.js` — In-memory ordered structure representing the memtable.
  - `Bloomfilter.js` — Probabilistic structure to speed up reads and avoid unnecessary disk lookups.
  - `SSTable.js` — Immutable on-disk table simulation and metadata.
  - `Compaction.js` — Merges SSTables (leveled compaction strategy).

- `ui/` — Visualization and interaction glue for the browser (canvas drawing, animations, dashboards, and terminal UI).

- `utils/` — Helpers (hash functions, logging, complexity analyzer).

- `index.html` — App shell and DOM layout.
- `js/main.js` — App bootstrap (imports modules, wires events, registers callbacks between engine and UI).

---

## Key Features
- Interactive command terminal with simple CLI commands: `PUT`, `GET`, `DELETE`, `COMPACT`, `STATS`, `HELP`.
- Live visualization of the memtable (skip list) and Bloom filter bit array using `<canvas>` elements.
- Dynamic SSTables area showing created levels and files after memtable flushes.
- Metrics dashboard showing write/read counts, write amplification, Bloom filter false-positive rate.
- Query tracer showing step-by-step how a read/write flows across Bloom filter, memtable, and SSTables.
- Demo mode: automated sequence that shows writes, reads, flush, and compaction.
- Clear/reset button to wipe all in-memory structures and UI state.

---

## Real-world Applications
This project demonstrates concepts used in the following systems and domains:
- LSM-based key-value stores (e.g., RocksDB, LevelDB, Cassandra).
- High-throughput write-heavy databases where writes are batched in-memory and flushed to disk.
- Systems using Bloom filters to avoid expensive disk reads (e.g., caches, distributed systems).
- Teaching and research: visualizing algorithmic trade-offs like write amplification, compaction cost, and read amplification.

---

## How the Webpage Works — UI Elements and Behavior
Below is a comprehensive mapping of the visible UI elements (IDs are the same as in `index.html`) and what they do. Use this section as the single source of truth for the interface.

### Header Buttons
- `#clear-btn` (Clear Data)
  - What it does: Resets the entire engine state — clears the memtable (skip list), empties the Bloom filter bit array, removes all SSTables, resets metrics and query tracer, and clears the terminal output.
  - How it works: When clicked, `main.js` calls the LSM engine's reset/clear API (or re-initializes the LSMTree instance) and then instructs UI modules to wipe canvases and counters.
  - When to use: Use this to return to a clean starting point between demos or after experiments.

- `#demo-btn` (Run Demo)
  - What it does: Starts an automated demo script that issues a sequence of commands (PUTs to populate, some GETs to show reads and Bloom filter effects, a flush to create SSTables, and a compaction cycle).
  - How it works: The demo runner is implemented in `main.js` / `ui/animationengine.js` — it issues commands at timed intervals and triggers UI animations for each step.
  - When to use: When you want an unattended walkthrough of the engine behavior.


### Command Terminal (Left Column)
- `#terminal-output`
  - What it shows: App log, command results, informational lines and trace entries. New lines get appended here when operations complete.
  - How it works: UI modules append formatted messages (timestamped) from command results and engine events.

- `#command-input` (input box)
  - How to use: Type one of the supported commands and press Enter.
  - Supported commands (examples):
    - `PUT <key> <value>` — Insert or update the key with a value.
    - `GET <key>` — Retrieve the value for `key` (shows trace and whether Bloom filter prevented disk read).
    - `DELETE <key>` — Mark key as deleted (tombstone) in memtable and propagate via flush.
    - `COMPACT` — Trigger compaction immediately (engine will merge SSTables according to the leveled strategy).
    - `STATS` — Print current metric values in the terminal.
    - `HELP` — Show a short help message listing commands.
  - How it works: On Enter, `main.js` parses the text and calls respective `LSMTree` methods. The engine then emits events to update visuals and metrics.


### Metrics Dashboard (Top center)
These elements display real-time counters/indicators which are updated by engine events.
- `#write-count` — Count of write operations executed.
- `#read-count` — Count of read operations executed.
- `#write-amp` — Observed write amplification (computed as ratio of physical writes to logical writes, approximate in this demo).
- `#bloom-fp` — Bloom filter measured false-positive rate (simulated / estimated) shown as a percentage.
- `#write-trend`, `#read-trend`, `#wa-status`, `#bloom-status` — Small textual indicators about trend or health.

How to interpret them: these metrics help you observe trade-offs — e.g., a large `write-amp` suggests heavy duplication of writes to disk due to compaction/flush patterns.


### Memtable / Skip List (Center storage inspector)
- `#memtable-keys` — Number of keys currently in memtable (skip list).
- `#memtable-size` — Estimated memory size of memtable.
- `#memtable-status` — Shows whether memtable is active/ready or currently flushing.
- `#memtable-canvas` — Visual canvas showing the skip list levels and nodes.

Behavior: new `PUT` operations add nodes to the skip list and update `#memtable-keys`. When memtable reaches its threshold (or demo triggers flush), the engine serializes it to an SSTable and clears memtable.


### SSTables (Disk area)
- `#sstables-container` — Dynamic area where SSTable level boxes are rendered. Each flush creates an SSTable entry with metadata (min/max key, size, level). Compaction shows animated merges here.

How to interpret: SSTables are immutable and are shown grouped by levels, illustrating how compaction moves data into lower-numbered levels.


### Bloom Filter
- `#bloom-bits` — Number of bits allocated to the Bloom filter bit array.
- `#bloom-hashes` — Number of hash functions used.
- `#bloom-fill` — Current fill percentage of the bit array.
- `#bloom-canvas` — Visual representation of bits set (highlighted bits indicate set positions).

Role: Bloom filter answers the question "could this key exist in disk SSTables?" If Bloom returns false, disk lookup is skipped (fast). If it returns true, the engine still needs to check SSTables (possible false positive).


### Query Tracer (Right sidebar)
- `#query-tracer` — Shows step-by-step traces of in-flight queries. For example, a `GET k1` trace may show:
  - Check Bloom filter -> negative -> responded "Not Found"
  - Check memtable -> hit -> returned value
  - Bloom true -> check SSTable Level 0 -> found at SSTable A -> returned value

This area is invaluable for debugging and teaching.

---

## Example Workflows (step-by-step)

### 1) Simple Put + Get
1. In `#command-input`, type: `PUT user1 alice@example.com` and press Enter.
2. Terminal logs the write; `#memtable-keys` increments and `#memtable-canvas` animates insertion.
3. Now type: `GET user1` and press Enter.
4. Query tracer shows memtable lookup (hit) and returns the value immediately. Metrics update: `#write-count` and `#read-count`.

### 2) Demonstrating Bloom Filter Avoiding Disk
1. Fill memtable and flush to SSTable (either by writing many keys or running `Run Demo`).
2. Clear memtable with `#clear-btn` disabled? (Note: `#clear-btn` resets entire state — do not press if you want to keep SSTables.)
3. Now `GET unknownKey`:
   - Bloom filter may say "probably not present" -> engine skips SSTable lookups -> query is fast.
   - If Bloom false positive occurs, the engine will still check SSTables and possibly not find the item.

### 3) Force Compaction
- `COMPACT` (in the terminal) triggers compaction; watch `#sstables-container` get merged and `#memtable-status`/metrics update. Compaction reduces read amplification at the cost of extra writes (write amplification).

---

## Buttons and Controls — Quick Reference Table
- `#clear-btn` — Clear/reset everything (memtable, Bloom filter, SSTables, metrics, terminal)
- `#demo-btn` — Start automated demo sequence (writes, reads, flushes, compaction)
- `#command-input` — Text input for CLI commands
- Terminal Output `#terminal-output` — Shows logs and results
- Memtable Canvas `#memtable-canvas` — Visualizes skip list nodes and structure
- Bloom Canvas `#bloom-canvas` — Visualizes bit array
- `#sstables-container` — Visual SSTable representation and compaction animations
- `#query-tracer` — Shows per-query execution steps
- Metric elements: `#write-count`, `#read-count`, `#write-amp`, `#bloom-fp`, `#write-trend`, `#read-trend`

---

## Internals: Event Flow (What happens when you `PUT`)
1. Terminal parses `PUT k v` -> calls `lsmTree.put(k, v)`.
2. `LSMTree` inserts into in-memory `Skiplist` (memtable) and updates the `BloomFilter` bit array for `k`.
3. UI callback: memtable insertion event triggers `memtable-canvas` redraw and counters update.
4. If memtable capacity exceeded -> flush to `SSTable`:
   - Engine serializes the skip list to an `SSTable` object and clears the memtable.
   - `SSTable` added to `#sstables-container` UI.
   - Compaction may later merge SSTables.

When you `GET k`:
1. Bloom filter queried first. If it says "definitely not present" -> immediate miss.
2. If Bloom says "maybe present" or Bloom disabled -> check memtable.
3. If not in memtable, scan SSTables (from newest to oldest or by level strategy) until hit or exhausted.
4. UI shows the trace and where the response came from.

---

## Troubleshooting & Tips
- Browser: Use latest Chrome, Edge, or Firefox. ES modules and canvas features require modern browsers.
- Serving files: Because the app uses `type="module"`, opening `index.html` directly usually works, but some browsers block module imports for `file://` origin — run a local HTTP server if you see module import errors.
  - Quick local server using Node (if you have `npm`):

```powershell
npm install --global http-server
http-server -c-1 .
# open http://localhost:8080 in your browser
```

- Common issues:
  - "Module not found" errors: Ensure you open the project folder root and that the path `js/main.js` exists.
  - Blank canvas: resize the browser window to trigger redraws or click a demo action to force UI updates.

- Performance tips: The visualization is intended for demonstrations. For very large simulated SSTables or millions of keys, the UI may slow down — reduce demo volume or increase batch sizes.

---

## Development Notes (how things are wired)
- `js/main.js` bootstraps the app: constructs `LSMTree`, then constructs UI controllers (`Terminal`, `AnimationEngine`, `MetricsDashboard`, `QueryTracer`, `StorageInspector`), and registers event bindings.
- The engine emits events like `onMemtableInsert`, `onMemtableFlush`, `onRead`, `onCompaction` — UI modules listen to these events and update visuals.
- Utility modules (`utils/`) provide `HashFunctions`, `Logger`, and `ComplexityAnalyzer` used by both engine and UI code.

---

## Learning Suggestions
- Step through the demo with the terminal open to watch how Bloom filter decisions affect disk lookups.
- Experiment with deleting keys and running compaction to observe tombstone handling.
- Measure write amplification by comparing `#write-count` to disk write counters (the UI reports an approximation).

---

## Summary
This guide explained the purpose and architecture of the Hybrid Indexing Engine demo, mapped every major UI control and DOM ID to its function, presented example workflows (PUT/GET/COMPACT), and offered troubleshooting tips. Use the `Run Demo` and the interactive terminal to explore how LSM Trees, Bloom filters, and compaction interact in write-heavy systems.

If you'd like, I can:
- Add a printable quick reference cheat-sheet for commands.
- Add unit-test scaffolding for `engine/` classes.
- Add a small video/GIF demo showing the UI flow.

(End of guide)
