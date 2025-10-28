Phase 1:
```bash
$ PUT user1 alice@example.com
✓ Inserted successfully
• Key: user1
• Location: Memtable
• Time: 0.100ms
• Complexity: O(log n)
$ PUT user2 bob@example.com
✓ Inserted successfully
• Key: user2
• Location: Memtable
• Time: 0.100ms
• Complexity: O(log n)
$ PUT user3 charlie@example.com
✓ Inserted successfully
• Key: user3
• Location: Memtable
• Time: 0.000ms
• Complexity: O(log n)
$ PUT user4 diana@example.com
✓ Inserted successfully
• Key: user4
• Location: Memtable
• Time: 0.000ms
• Complexity: O(log n)
$ PUT user5 eve@example.com
✓ Inserted successfully
• Key: user5
• Location: Memtable
• Time: 0.100ms
• Complexity: O(log n)
$ GET user3
✓ Found
• Key: user3
• Location: Memtable
• Time: 0.100ms
• SSTables Checked: 0
• Complexity: O(log n) - Found in memtable
Value:
charlie@example.com
Search Path:
1. Memtable (Skip List) ✓
$ STATS
System Statistics
Operations:
• Writes: 5
• Reads: 1
• Deletes: 0
• Total: 6
Memtable (Skip List):
• Size: 5 / 10
• Level: 2 (max: 16)
• Memory: 0.38 KB
• Threshold: 50.0%
SSTables (Disk):
• Total: 0
• Size: 0.00 KB
Performance Metrics:
• Write Amplification: 1x
• Bloom Filter Effectiveness: 0%
• Disk Reads Saved: 0
• Total Compactions: 0
Complexity Analysis:
• Write: O(log n)
• Read: O(log n + k·log n)
• Compaction: O(n log k)
```
Phase 2:
```bash
$ PUT user6 frank@example.com
✓ Inserted successfully
• Key: user6
• Location: Memtable
• Time: 0.000ms
• Complexity: O(log n)
$ PUT user7 grace@example.com
✓ Inserted successfully
• Key: user7
• Location: Memtable
• Time: 0.000ms
• Complexity: O(log n)
$ PUT user8 henry@example.com
✓ Inserted successfully
• Key: user8
• Location: Memtable
• Time: 0.100ms
• Complexity: O(log n)
$ PUT user9 ivy@example.com
✓ Inserted successfully
• Key: user9
• Location: Memtable
• Time: 0.100ms
• Complexity: O(log n)
$ PUT user10 jack@example.com
✓ Inserted successfully
• Key: user10
• Location: Memtable
• Time: 2.600ms
• Complexity: O(log n)
• Memtable flushed to L0 SSTable
$ STATS
System Statistics
Operations:
• Writes: 10
• Reads: 1
• Deletes: 0
• Total: 11
Memtable (Skip List):
• Size: 0 / 10
• Level: 0 (max: 16)
• Memory: 0.00 KB
• Threshold: 0.0%
SSTables (Disk):
• Total: 1
• Size: 0.65 KB
• L0: 1 tables (0.65 KB)
Performance Metrics:
• Write Amplification: 1x
• Bloom Filter Effectiveness: 0%
• Disk Reads Saved: 0
• Total Compactions: 0
Complexity Analysis:
• Write: O(log n)
• Read: O(log n + k·log n)
• Compaction: O(n log k)
```
Phase 5:
```bash
$ PUT active1 online
✓ Inserted successfully
• Key: active1
• Location: Memtable
• Time: 0.000ms
• Complexity: O(log n)
$ PUT active2 online
✓ Inserted successfully
• Key: active2
• Location: Memtable
• Time: 0.100ms
• Complexity: O(log n)
$ PUT active3 online
✓ Inserted successfully
• Key: active3
• Location: Memtable
• Time: 0.000ms
• Complexity: O(log n)
$ GET user5
✓ Found
• Key: user5
• Location: SSTable
• Time: 0.700ms
• SSTables Checked: 1
• Complexity: O(log n + k·log n) - Checked 1 SSTables
Value:
eve@example.com
Search Path:
1. Memtable (Skip List) ✗
2. SSTable Level 0 (sstable-1) ✓
$ GET active2
✓ Found
• Key: active2
• Location: Memtable
• Time: 0.100ms
• SSTables Checked: 0
• Complexity: O(log n) - Found in memtable
Value:
online
Search Path:
1. Memtable (Skip List) ✓
$ GET nonexistent
⚠ Key not found
• Key: nonexistent
• SSTables Checked: 1
• Time: 0.200ms
Search Path:
1. Memtable (Skip List) ✗
2. SSTable Level 0 (sstable-1) ✗ (Bloom saved)
```
Phase 4:
```bash
$ COMPACT 0
✓ Compaction completed
• Levels: L0 → L1
• Input SSTables: 1
• Output SSTables: 1
• Duplicates Removed: 0
• Write Amplification: 1.50x
• Time: 0.900ms
• Complexity: O(n log k) where n=10, k=1
$ STATS
System Statistics
Operations:
• Writes: 13
• Reads: 4
• Deletes: 0
• Total: 17
Memtable (Skip List):
• Size: 3 / 10
• Level: 4 (max: 16)
• Memory: 0.21 KB
• Threshold: 30.0%
SSTables (Disk):
• Total: 1
• Size: 0.65 KB
• L0: 0 tables (0.00 KB)
• L1: 1 tables (0.65 KB)
Performance Metrics:
• Write Amplification: 1.5x
• Bloom Filter Effectiveness: 100.00%
• Disk Reads Saved: 1
• Total Compactions: 1
Complexity Analysis:
• Write: O(log n)
• Read: O(log n + k·log n)
• Compaction: O(n log k)
$ GET user7
✓ Found
• Key: user7
• Location: SSTable
• Time: 1.200ms
• SSTables Checked: 1
• Complexity: O(log n + k·log n) - Checked 1 SSTables
Value:
grace@example.com
Search Path:
1. Memtable (Skip List) ✗
2. SSTable Level 1 (sstable-2) ✓
```
Phase 5:
```bash
$ PUT order1 pending PUT order2 shipped
✓ Inserted successfully
• Key: order1
• Location: Memtable
• Time: 0.100ms
• Complexity: O(log n)
$ get order1
✓ Found
• Key: order1
• Location: Memtable
• Time: 0.000ms
• SSTables Checked: 0
• Complexity: O(log n) - Found in memtable
Value:
pending PUT order2 shipped
Search Path:
1. Memtable (Skip List) ✓
$ PUT order2 shipped
✓ Inserted successfully
• Key: order2
• Location: Memtable
• Time: 0.000ms
• Complexity: O(log n)
$ PUT order3 delivered
✓ Inserted successfully
• Key: order3
• Location: Memtable
• Time: 0.000ms
• Complexity: O(log n)
$ PUT order4 cancelled
✓ Inserted successfully
• Key: order4
• Location: Memtable
• Time: 0.100ms
• Complexity: O(log n)
$ PUT order5 pending
✓ Inserted successfully
• Key: order5
• Location: Memtable
• Time: 0.000ms
• Complexity: O(log n)
$ PUT order6 shipped
✓ Inserted successfully
• Key: order6
• Location: Memtable
• Time: 0.100ms
• Complexity: O(log n)
$ PUT order7 delivered
✓ Inserted successfully
• Key: order7
• Location: Memtable
• Time: 1.900ms
• Complexity: O(log n)
• Memtable flushed to L0 SSTable
$ PUT order8 cancelled
✓ Inserted successfully
• Key: order8
• Location: Memtable
• Time: 0.100ms
• Complexity: O(log n)
$ PUT order9 pending
✓ Inserted successfully
• Key: order9
• Location: Memtable
• Time: 0.100ms
• Complexity: O(log n)
$ PUT order10 shipped
✓ Inserted successfully
• Key: order10
• Location: Memtable
• Time: 0.100ms
• Complexity: O(log n)
$ STATS
System Statistics
Operations:
• Writes: 23
• Reads: 6
• Deletes: 0
• Total: 29
Memtable (Skip List):
• Size: 3 / 10
• Level: 2 (max: 16)
• Memory: 0.19 KB
• Threshold: 30.0%
SSTables (Disk):
• Total: 2
• Size: 1.19 KB
• L0: 1 tables (0.53 KB)
• L1: 1 tables (0.65 KB)
Performance Metrics:
• Write Amplification: 1.5x
• Bloom Filter Effectiveness: 100.00%
• Disk Reads Saved: 1
• Total Compactions: 1
Complexity Analysis:
• Write: O(log n)
• Read: O(log n + k·log n)
• Compaction: O(n log k)
$ COMPACT 1
✓ Compaction completed
• Levels: L1 → L2
• Input SSTables: 1
• Output SSTables: 1
• Duplicates Removed: 0
• Write Amplification: 1.50x
• Time: 0.600ms
• Complexity: O(n log k) where n=10, k=1
$ STATS
System Statistics
Operations:
• Writes: 23
• Reads: 6
• Deletes: 0
• Total: 29
Memtable (Skip List):
• Size: 3 / 10
• Level: 2 (max: 16)
• Memory: 0.19 KB
• Threshold: 30.0%
SSTables (Disk):
• Total: 2
• Size: 1.19 KB
• L0: 1 tables (0.53 KB)
• L1: 0 tables (0.00 KB)
• L2: 1 tables (0.65 KB)
Performance Metrics:
• Write Amplification: 1.5x
• Bloom Filter Effectiveness: 100.00%
• Disk Reads Saved: 1
• Total Compactions: 2
Complexity Analysis:
• Write: O(log n)
• Read: O(log n + k·log n)
• Compaction: O(n log k)
```
