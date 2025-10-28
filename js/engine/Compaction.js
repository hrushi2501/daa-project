/**
 * Compaction.js - K-way Merge Sort for SSTable Compaction
 * 
 * Time Complexity:
 * - K-way merge: O(n log k) where n = total elements, k = number of SSTables
 * - Using min-heap for efficient merging
 * 
 * Space Complexity: O(n) for output + O(k) for heap
 * 
 * Compaction Strategies:
 * - Leveled: Each level has max size, compact to next level
 * - Tiered: Merge SSTables of similar size
 * 
 * This implementation uses Leveled compaction (like RocksDB/Cassandra)
 */

/**
 * MinHeap for efficient K-way merge
 * Used to always pick the smallest key from K sorted arrays
 */
class MinHeap {
    constructor() {
        this.heap = [];
        this.comparisons = 0;
    }

    /**
     * Insert element into heap
     * Time: O(log k)
     */
    insert(element) {
        this.heap.push(element);
        this.bubbleUp(this.heap.length - 1);
    }

    /**
     * Extract minimum element
     * Time: O(log k)
     */
    extractMin() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown(0);
        return min;
    }

    /**
     * Bubble up to maintain heap property
     */
    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            this.comparisons++;
            
            if (this.heap[index].key >= this.heap[parentIndex].key) break;
            
            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            index = parentIndex;
        }
    }

    /**
     * Bubble down to maintain heap property
     */
    bubbleDown(index) {
        while (true) {
            let smallest = index;
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;

            if (leftChild < this.heap.length) {
                this.comparisons++;
                if (this.heap[leftChild].key < this.heap[smallest].key) {
                    smallest = leftChild;
                }
            }

            if (rightChild < this.heap.length) {
                this.comparisons++;
                if (this.heap[rightChild].key < this.heap[smallest].key) {
                    smallest = rightChild;
                }
            }

            if (smallest === index) break;

            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            index = smallest;
        }
    }

    size() {
        return this.heap.length;
    }
}

/**
 * Compaction Engine
 */
export class Compaction {
    constructor(sstableManager) {
        this.sstableManager = sstableManager;
        this.compactionHistory = [];
        this.totalCompactions = 0;
        this.totalBytesCompacted = 0;
    }

    /**
     * K-way merge of multiple sorted arrays (SSTables)
     * Time Complexity: O(n log k)
     * 
     * @param {Array<SSTable>} sstables - SSTables to merge
     * @returns {Array} - Merged and deduplicated entries
     */
    kWayMerge(sstables) {
        const startTime = performance.now();
        const heap = new MinHeap();
        const iterators = [];
        const mergedEntries = [];
        const steps = [];

        // Initialize iterators for each SSTable
        for (let i = 0; i < sstables.length; i++) {
            const entries = sstables[i].getAllEntries();
            if (entries.length > 0) {
                iterators.push({
                    sstableId: sstables[i].id,
                    entries,
                    currentIndex: 0
                });
                
                // Insert first element from each SSTable into heap
                heap.insert({
                    key: entries[0].key,
                    value: entries[0].value,
                    timestamp: entries[0].timestamp,
                    iteratorIndex: i
                });
            }
        }

        let lastKey = null;
        let duplicatesRemoved = 0;

        // Extract minimum and add next element from same SSTable
        while (heap.size() > 0) {
            const min = heap.extractMin();
            
            // Deduplication: keep only latest version (highest timestamp)
            if (min.key !== lastKey) {
                // Check for tombstone (deletion marker)
                if (min.value !== null) {
                    mergedEntries.push({
                        key: min.key,
                        value: min.value,
                        timestamp: min.timestamp
                    });
                }
                lastKey = min.key;
            } else {
                duplicatesRemoved++;
            }

            // Get next element from the same iterator
            const iterator = iterators[min.iteratorIndex];
            iterator.currentIndex++;
            
            if (iterator.currentIndex < iterator.entries.length) {
                const nextEntry = iterator.entries[iterator.currentIndex];
                heap.insert({
                    key: nextEntry.key,
                    value: nextEntry.value,
                    timestamp: nextEntry.timestamp,
                    iteratorIndex: min.iteratorIndex
                });
            }

            // Record merge step every 10 entries for visualization
            if (mergedEntries.length % 10 === 0) {
                steps.push({
                    entriesMerged: mergedEntries.length,
                    heapSize: heap.size(),
                    currentKey: min.key
                });
            }
        }

        const endTime = performance.now();

        return {
            entries: mergedEntries,
            stats: {
                inputSSTables: sstables.length,
                inputEntries: sstables.reduce((sum, s) => sum + s.entries.length, 0),
                outputEntries: mergedEntries.length,
                duplicatesRemoved,
                heapComparisons: heap.comparisons,
                timeMs: (endTime - startTime).toFixed(3),
                complexity: `O(n log k) where n=${sstables.reduce((sum, s) => sum + s.entries.length, 0)}, k=${sstables.length}`,
                steps
            }
        };
    }

    /**
     * Compact a level (Leveled Compaction Strategy)
     * Merge all SSTables in source level into target level
     * 
     * @param {number} sourceLevel - Level to compact from
     * @param {number} targetLevel - Level to compact to
     */
    compactLevel(sourceLevel, targetLevel) {
        const startTime = performance.now();
        
        const sourceSSTables = this.sstableManager.getLevel(sourceLevel);
        
        if (sourceSSTables.length === 0) {
            return {
                success: false,
                message: `No SSTables at level ${sourceLevel}`
            };
        }

        // Get target level SSTables that overlap with source range
        const targetSSTables = this.sstableManager.getLevel(targetLevel);
        const overlappingSSTables = this.findOverlappingSSTables(
            sourceSSTables,
            targetSSTables
        );

        // Merge source + overlapping target SSTables
        const sstablesToMerge = [...sourceSSTables, ...overlappingSSTables];
        const mergeResult = this.kWayMerge(sstablesToMerge);

        // Calculate write amplification
        const inputBytes = sstablesToMerge.reduce((sum, s) => sum + s.size, 0);
        const outputBytes = mergeResult.entries.length * 100; // rough estimate

        // Remove old SSTables from source level FIRST
        this.sstableManager.clearLevel(sourceLevel);
        
        // Remove overlapping SSTables from target level
        const remainingTarget = targetSSTables.filter(
            s => !overlappingSSTables.includes(s)
        );
        this.sstableManager.clearLevel(targetLevel);
        
        // Re-add non-overlapping target SSTables
        for (const sstable of remainingTarget) {
            this.sstableManager.addSSTable(targetLevel, sstable);
        }
        
        // Create new SSTable at target level (AFTER clearing overlapping ones)
        const newSSTable = this.sstableManager.createSSTable(
            targetLevel,
            mergeResult.entries
        );

        const endTime = performance.now();

        // Record compaction
        const compactionRecord = {
            id: this.totalCompactions++,
            timestamp: Date.now(),
            sourceLevel,
            targetLevel,
            inputSSTables: sstablesToMerge.length,
            outputSSTables: 1,
            inputBytes,
            outputBytes,
            writeAmplification: (outputBytes / inputBytes).toFixed(2),
            duplicatesRemoved: mergeResult.stats.duplicatesRemoved,
            timeMs: (endTime - startTime).toFixed(3),
            mergeStats: mergeResult.stats
        };

        this.compactionHistory.push(compactionRecord);
        this.totalBytesCompacted += inputBytes;

        return {
            success: true,
            ...compactionRecord
        };
    }

    /**
     * Find overlapping SSTables between source and target
     * Used to determine which target SSTables need to be merged
     */
    findOverlappingSSTables(sourceSSTables, targetSSTables) {
        const overlapping = [];
        
        for (const target of targetSSTables) {
            for (const source of sourceSSTables) {
                // Check if key ranges overlap
                if (this.rangesOverlap(source.keyRange, target.keyRange)) {
                    overlapping.push(target);
                    break;
                }
            }
        }
        
        return overlapping;
    }

    /**
     * Check if two key ranges overlap
     */
    rangesOverlap(range1, range2) {
        if (!range1.min || !range1.max || !range2.min || !range2.max) {
            return false;
        }
        
        return !(range1.max < range2.min || range2.max < range1.min);
    }

    /**
     * Auto-compaction trigger
     * Compact when level exceeds threshold
     * 
     * L0: 4 SSTables trigger compaction to L1
     * L1: 10 SSTables trigger compaction to L2
     * L2: 100 SSTables trigger compaction to L3
     */
    shouldCompact(level) {
        const thresholds = {
            0: 4,
            1: 10,
            2: 100
        };
        
        const sstables = this.sstableManager.getLevel(level);
        const threshold = thresholds[level] || 1000;
        
        return sstables.length >= threshold;
    }

    /**
     * Run auto-compaction if needed
     */
    runAutoCompaction() {
        const results = [];
        
        // Check each level
        for (let level = 0; level < 3; level++) {
            if (this.shouldCompact(level)) {
                const result = this.compactLevel(level, level + 1);
                if (result.success) {
                    results.push(result);
                }
            }
        }
        
        return results;
    }

    /**
     * Calculate total write amplification
     * WA = Total bytes written to disk / User data written
     */
    getWriteAmplification() {
        if (this.totalBytesCompacted === 0) return 1.0;
        
        const totalBytesWritten = this.compactionHistory.reduce(
            (sum, c) => sum + c.outputBytes,
            0
        );
        
        return (totalBytesWritten / this.totalBytesCompacted).toFixed(2);
    }

    /**
     * Get compaction statistics
     */
    getStats() {
        return {
            totalCompactions: this.totalCompactions,
            totalBytesCompacted: this.totalBytesCompacted,
            totalBytesCompactedMB: (this.totalBytesCompacted / (1024 * 1024)).toFixed(2),
            writeAmplification: this.getWriteAmplification(),
            recentCompactions: this.compactionHistory.slice(-5),
            avgCompactionTimeMs: this.compactionHistory.length > 0
                ? (this.compactionHistory.reduce((sum, c) => sum + parseFloat(c.timeMs), 0) / this.compactionHistory.length).toFixed(2)
                : 0
        };
    }

    /**
     * Get compaction history for visualization
     */
    getHistory() {
        return this.compactionHistory;
    }

    /**
     * Clear compaction history
     */
    clearHistory() {
        this.compactionHistory = [];
        this.totalCompactions = 0;
        this.totalBytesCompacted = 0;
    }
}