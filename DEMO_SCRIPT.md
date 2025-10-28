# LSM Tree Hybrid Indexing Engine - Complete Demo Script

This demo script walks you through all features of the project, demonstrating:
- Skip List (Memtable) operations
- Memtable flushing to SSTables
- Bloom Filter effectiveness
- Multi-level compaction (L0 → L1 → L2)
- Query tracing and optimization
- Write amplification tracking
- Tombstone handling

---

## 🚀 Demo Script - Copy & Paste Commands

### Phase 1: Basic Operations & Memtable Visualization
**Goal**: See how the Skip List works in-memory

```bash
# View initial state
STATS

# Insert 5 keys - watch skip list build in real-time
PUT user1 alice@example.com
PUT user2 bob@example.com
PUT user3 charlie@example.com
PUT user4 diana@example.com
PUT user5 eve@example.com

# Query to see memtable search
GET user3

# Check stats - memtable should show 5/10 (50% full)
STATS
```

**What to Observe**:
- 🎨 **Memtable Canvas**: Skip list levels L0 and L1 forming
- 📊 **Metrics**: Write count = 5, Read count = 1
- 🔍 **Query Tracer**: Shows "Step 1: Memtable (Skip List)" with O(log n)

---

### Phase 2: Memtable Flush & SSTable Creation
**Goal**: Trigger flush to create L0 SSTable

```bash
# Add 5 more keys to reach 10-key threshold
PUT user6 frank@example.com
PUT user7 grace@example.com
PUT user8 henry@example.com
PUT user9 ivy@example.com
PUT user10 jack@example.com

# This triggers automatic flush to L0!
# Terminal should show: "Memtable flushed to L0 SSTable"

# Verify SSTable created
STATS
```

**What to Observe**:
- 🎯 **Auto-flush message** appears after 10th key
- 💾 **SSTables section**: Shows "L0: 1 tables (0.27 KB)"
- 📈 **Memtable resets**: Now shows 0/10 keys
- 🔢 **SSTable details**: "sstable-0 • 10 keys • Range: 1 → 9"

---

### Phase 3: Bloom Filter in Action
**Goal**: See how Bloom Filter prevents unnecessary disk reads

```bash
# Add new keys to memtable
PUT active1 online
PUT active2 online
PUT active3 online

# Search for key that exists in SSTable (L0)
GET user5

# Search for key that exists in Memtable
GET active2

# Search for non-existent key (Bloom filter saves disk read)
GET nonexistent
```

**What to Observe**:
- 🔍 **Query Tracer** for `GET user5`:
  - Step 1: Memtable ✗ (not found)
  - Step 2: SSTable Level 0 ✓ (found via Bloom filter + binary search)
- 🔍 **Query Tracer** for `GET active2`:
  - Step 1: Memtable ✓ (immediate hit, no disk access)
- 🔍 **Query Tracer** for `GET nonexistent`:
  - Bloom filter says "definitely not present" → no SSTable reads
- 📊 **Bloom Filter Bit Array Canvas**: Shows set bits highlighted

---

### Phase 4: First Compaction (L0 → L1)
**Goal**: Manually compact L0 to L1 to see leveled compaction

```bash
# Trigger compaction from L0 to L1
COMPACT 0

# Check the result
STATS

# Verify data still accessible
GET user7
```

**What to Observe**:
- 🔄 **Compaction Animation**: SSTable moves from L0 to L1 bar
- 📊 **SSTables section**: 
  - L0: 0 tables (empty after compaction)
  - L1: 1 table (10 keys, 0.27 KB)
- 📈 **Write Amplification**: Shows ~3.6x (data written once to L0, once to L1)
- ✅ **Terminal**: "Compaction completed • Levels: L0 → L1 • Duplicates Removed: 0"
- 🔍 **GET user7**: Still works! Now reads from L1 instead of L0

---

### Phase 5: Multi-Level Architecture (L1 → L2)
**Goal**: Demonstrate deeper level compaction

```bash
# Add more keys to create another L0 SSTable
PUT order1 pending
PUT order2 shipped
PUT order3 delivered
PUT order4 cancelled
PUT order5 pending
PUT order6 shipped
PUT order7 delivered
PUT order8 cancelled
PUT order9 pending
PUT order10 shipped

# Now we have: Memtable (0), L0 (1 SSTable), L1 (1 SSTable)
STATS

# Compact L1 to L2
COMPACT 1

# Check multi-level structure
STATS
```

**What to Observe**:
- 🏗️ **Three-tier architecture**:
  - L0: 1 SSTable (recent writes: order1-order10)
  - L1: 0 SSTables (compacted away)
  - L2: 1 SSTable (older data: user1-user10)
- 📊 **Write Amplification**: Increases with each compaction level
- 🔍 **Query path** for old keys now goes: Memtable → L0 → L2

---

### Phase 6: Update & Duplicate Handling
**Goal**: Show how updates and duplicates are handled

```bash
# Update existing key
PUT user5 newemail@example.com

# Check stats - notice memtable has user5 again
STATS

# Query the updated key
GET user5

# Add enough keys to flush memtable
PUT temp1 data
PUT temp2 data
PUT temp3 data
PUT temp4 data
PUT temp5 data
PUT temp6 data
PUT temp7 data
PUT temp8 data
PUT temp9 data

# Flush creates L0 SSTable with updated user5
STATS

# Compact L0 (with updated user5) with L2 (with old user5)
COMPACT 0
COMPACT 1

# Verify only new value exists
GET user5
STATS
```

**What to Observe**:
- 🔄 **Duplicate removal**: Compaction shows "Duplicates Removed: 1"
- ✅ **GET user5** returns **new** value (newemail@example.com)
- 📉 **Space saving**: Old user5 entry removed during compaction

---

### Phase 7: Delete & Tombstone Handling
**Goal**: Understand tombstone markers and deletion propagation

```bash
# Delete some keys
DELETE user2
DELETE user4
DELETE user6

# Check memtable - tombstones are there
STATS

# Query deleted key (should fail)
GET user2

# Add more data and flush
PUT final1 data
PUT final2 data
PUT final3 data
PUT final4 data
PUT final5 data
PUT final6 data
PUT final7 data

# Flush creates L0 with tombstones
STATS

# Compact - tombstones remove actual data
COMPACT 0
COMPACT 1

# Verify deletions
GET user2
GET user4
STATS
```

**What to Observe**:
- ⚰️ **Terminal**: "Tombstone created • Note: Key will be removed during compaction"
- 🗑️ **Query Tracer** for `GET user2`: "Not Found" (tombstone prevents return)
- 📉 **After compaction**: Tombstones + actual data both removed
- 📊 **Stats**: Shows accurate key counts (deleted keys subtracted)

---

### Phase 8: Performance Analysis
**Goal**: Analyze time complexity and performance metrics

```bash
# Clear terminal for clean analysis view
CLC

# Run comprehensive stats
STATS

# Analyze query performance on different levels
GET final1      # Should be in memtable - fastest
GET order3      # Should be in L0/L1 - medium
GET user1       # Should be in L2 - slowest (checked multiple levels)
```

**What to Observe**:
- ⏱️ **Query times**:
  - Memtable: ~0.1ms (O(log n))
  - L0 SSTable: ~0.3ms (O(log n) + Bloom check)
  - L2 SSTable: ~0.5ms (O(k·log n) where k=levels checked)
- 📊 **Write Amplification**: Total physical writes / logical writes
- 🎯 **Bloom Filter Effectiveness**: % of disk reads saved
- 📈 **Complexity display**: Shows actual n and k values

---

### Phase 9: Stress Test & Visualization
**Goal**: Fill all levels and observe system behavior

```bash
# Add 30 keys rapidly (creates 3 SSTables)
PUT batch1 data
PUT batch2 data
PUT batch3 data
PUT batch4 data
PUT batch5 data
PUT batch6 data
PUT batch7 data
PUT batch8 data
PUT batch9 data
PUT batch10 data

PUT batch11 data
PUT batch12 data
PUT batch13 data
PUT batch14 data
PUT batch15 data
PUT batch16 data
PUT batch17 data
PUT batch18 data
PUT batch19 data
PUT batch20 data

PUT batch21 data
PUT batch22 data
PUT batch23 data
PUT batch24 data
PUT batch25 data
PUT batch26 data
PUT batch27 data
PUT batch28 data
PUT batch29 data
PUT batch30 data

# Check all levels
STATS

# Cascade compactions
COMPACT 0
COMPACT 1
COMPACT 2

# Final state
STATS
```

**What to Observe**:
- 🌊 **Cascade effect**: Data flows L0 → L1 → L2 → L3
- 📊 **SSTable bars**: Fill percentages increase per level
- 🎨 **Memtable skip list**: Max height increases with more keys
- 🔢 **Total compactions**: Tracks cumulative compaction count
- 📈 **Write amplification**: Grows with deeper levels

---

## 🎯 Key Metrics to Analyze

### Expected Final State (after all phases):
```
Operations:
• Writes: ~70+
• Reads: ~15+
• Deletes: 3
• Total Compactions: 5-7

Memtable:
• Size: 0-5 / 10
• Levels: 1-2

SSTables:
• L0: 0-1 tables
• L1: 0 tables  
• L2: 1 table
• L3: 0-1 tables
• Total: 1-2 tables, ~0.8-1.2 KB

Performance:
• Write Amplification: 8-12x (typical for multi-level)
• Bloom Filter: 70-90% effectiveness
```

---

## 📊 What Each Visualization Shows

### 1. **Memtable (Skip List) Canvas**
- **Levels**: Horizontal layers (L0, L1, L2, L3)
- **Nodes**: Rectangles with keys
- **Arrows**: Pointers between nodes
- **Color**: Blue = highlighted during operation
- **Interpretation**: More levels = better skip list structure for search

### 2. **SSTables (Disk Storage) Bars**
- **Level bars**: L0 (blue), L1 (green), L2 (purple), L3 (orange)
- **Fill percentage**: Shows how full each level is
- **Number of SSTables**: Count per level
- **Total keys & size**: Displayed per level
- **Interpretation**: Lower levels fill first, compaction moves data down

### 3. **Bloom Filter Bit Array**
- **Bits**: Each square represents a bit (0=empty, 1=set)
- **Highlighted bits**: Show where keys hash to
- **Fill percentage**: More filled = higher false positive rate
- **Interpretation**: ~1% fill is optimal for 1% false positive rate

### 4. **Query Tracer Panel**
- **Execution path**: Shows each step (Memtable → L0 → L1 → L2)
- **Time**: Per-step timing
- **Complexity**: Big-O notation for each step
- **Result**: Found/Not Found with location
- **Interpretation**: Fewer steps = faster query

### 5. **Metrics Dashboard**
- **Write Ops**: Total PUT operations
- **Read Ops**: Total GET operations
- **Write Amplification**: Physical writes / logical writes (lower = better)
- **Bloom FP Rate**: False positive percentage (target <1%)

---

## 🧪 Advanced Experiments

### Experiment 1: Bloom Filter False Positives
```bash
CLC
PUT test1 value
# ... add 10 keys to flush
GET nonexistent1
GET nonexistent2
# Watch Bloom FP% increase slightly
```

### Experiment 2: Write Amplification Growth
```bash
CLC
# Add 10 keys (WA = 1x)
# Compact L0→L1 (WA = ~4x)
# Compact L1→L2 (WA = ~8x)
# Compact L2→L3 (WA = ~12x)
STATS  # Compare WA at each level
```

### Experiment 3: Skip List Height Analysis
```bash
CLC
# Add 1 key - watch skip list
# Add 10 keys - watch levels grow
# Add 50 keys - see max height reached
```

---

## 🎓 Learning Outcomes

After completing this demo, you'll understand:

1. ✅ **LSM Tree Architecture**: Write-optimized structure with levels
2. ✅ **Skip List**: Probabilistic data structure for O(log n) operations
3. ✅ **Bloom Filters**: Space-efficient probabilistic membership testing
4. ✅ **Compaction**: Trade-off between write amp and read amp
5. ✅ **Tombstones**: Lazy deletion in immutable structures
6. ✅ **Time Complexity**: Why LSM trees excel at writes
7. ✅ **Space Amplification**: Cost of maintaining multiple levels

---

## 🚀 Quick Demo Mode

If you want a fast automated demo, click the **"Run Demo"** button in the header!

It will automatically:
1. Insert 15 keys
2. Trigger flush to L0
3. Perform reads to demonstrate Bloom filter
4. Run compaction L0→L1
5. Show query tracing across levels
6. Display final statistics

---

## 💡 Tips for Best Visualization

1. **Watch the animations**: Don't click too fast - give visualizations time to render
2. **Use CLC frequently**: Clear terminal to see fresh output without scrolling
3. **Check Query Tracer**: Right panel shows detailed execution path
4. **Monitor metrics**: Top metrics update in real-time
5. **Horizontal scroll**: Memtable canvas scrolls horizontally when many keys added

---

## 🐛 Troubleshooting

**Issue**: Canvas shows "Empty Memtable"
- **Solution**: Add keys with PUT commands

**Issue**: Compaction fails with "No SSTables at level X"
- **Solution**: That level is empty - add data and flush first

**Issue**: Terminal not scrolling
- **Solution**: Refresh page - scrollbar should always be visible

**Issue**: Stats show incorrect counts
- **Solution**: Refresh page to reset state

---

## 📚 Further Reading

- **RocksDB**: Real-world LSM tree implementation
- **LevelDB**: Google's LSM tree library
- **Cassandra**: Distributed database using LSM trees
- **Skip Lists**: Original paper by William Pugh (1990)
- **Bloom Filters**: Original paper by Burton Bloom (1970)

---

Enjoy exploring the LSM Tree architecture! 🎉
