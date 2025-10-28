/**
 * LSMTree.js - Log-Structured Merge Tree Implementation
 * 
 * Architecture:
 * 1. Memtable (Skip List) - In-memory write buffer
 * 2. SSTables (Sorted String Tables) - Immutable disk storage
 * 3. Bloom Filters - Fast negative lookups
 * 4. Compaction - Merge and optimize storage
 * 
 * Write Path: Memtable → Flush → L0 SSTable → Compact → L1 → L2 → ...
 * Read Path: Memtable → Bloom Filters → SSTables (L0 → L1 → L2 → ...)
 * 
 * Time Complexity:
 * - Write: O(log n) - Skip List insert
 * - Read: O(log n) memtable + O(k·log n) SSTables where k = levels
 * - Compaction: O(n log k) - K-way merge
 */

import { SkipList } from './Skiplist.js';
import { SSTableManager } from './SSTable.js';
import { Compaction } from './Compaction.js';

export class LSMTree {
    constructor(memtableThreshold = 10) {
        // In-memory components
        this.memtable = new SkipList(16, 0.5);
        this.memtableThreshold = memtableThreshold; // Max entries before flush
        
        // Disk components
        this.sstableManager = new SSTableManager();
        this.compaction = new Compaction(this.sstableManager);
        
        // Statistics
        this.stats = {
            totalWrites: 0,
            totalReads: 0,
            totalDeletes: 0,
            memtableFlushes: 0,
            totalCompactions: 0,
            bloomFilterHits: 0,
            bloomFilterMisses: 0
        };
        
        // Event callbacks for UI updates
        this.callbacks = {
            onMemtableInsert: null,
            onMemtableFlush: null,
            onCompaction: null,
            onRead: null
        };
    }

    /**
     * Register callback for events
     */
    on(event, callback) {
        this.callbacks[event] = callback;
    }

    /**
     * PUT operation - Insert or update key-value pair
     * Time Complexity: O(log n)
     * 
     * @param {string} key - Key to insert
     * @param {any} value - Value to store
     * @returns {object} - Operation result
     */
    put(key, value) {
        const startTime = performance.now();
        
        // Step 1: Insert into memtable (Skip List)
        const insertResult = this.memtable.insert(key, value);
        this.stats.totalWrites++;
        
        // Trigger callback for UI update
        if (this.callbacks.onMemtableInsert) {
            this.callbacks.onMemtableInsert(insertResult);
        }
        
        // Step 2: Check if memtable needs flushing
        let flushResult = null;
        if (this.memtable.size >= this.memtableThreshold) {
            flushResult = this.flushMemtable();
        }
        
        // Step 3: Auto-compaction if needed
        const compactionResults = this.compaction.runAutoCompaction();
        if (compactionResults.length > 0) {
            this.stats.totalCompactions += compactionResults.length;
            if (this.callbacks.onCompaction) {
                this.callbacks.onCompaction(compactionResults);
            }
        }
        
        const endTime = performance.now();
        
        return {
            success: true,
            operation: 'PUT',
            key,
            memtableResult: insertResult,
            flushed: flushResult !== null,
            flushResult,
            compacted: compactionResults.length > 0,
            compactionResults,
            totalTimeMs: (endTime - startTime).toFixed(3),
            complexity: 'O(log n)'
        };
    }

    /**
     * GET operation - Retrieve value by key
     * Time Complexity: O(log n) + O(k·log n) where k = SSTable levels
     * 
     * @param {string} key - Key to retrieve
     * @returns {object} - Operation result
     */
    get(key) {
        const startTime = performance.now();
        this.stats.totalReads++;
        const searchPath = [];
        
        // Step 1: Check memtable first (most recent data)
        const memtableStart = performance.now();
        const memtableResult = this.memtable.search(key);
        const memtableTime = performance.now() - memtableStart;
        
        searchPath.push({
            location: 'Memtable (Skip List)',
            found: memtableResult.found,
            timeMs: memtableTime.toFixed(3),
            comparisons: memtableResult.comparisons,
            complexity: 'O(log n)'
        });
        
        if (memtableResult.found) {
            const endTime = performance.now();
            
            if (this.callbacks.onRead) {
                this.callbacks.onRead({ key, found: true, searchPath });
            }
            
            return {
                found: true,
                value: memtableResult.value,
                location: 'Memtable',
                searchPath,
                totalTimeMs: (endTime - startTime).toFixed(3),
                complexity: 'O(log n) - Found in memtable'
            };
        }
        
        // Step 2: Search SSTables (disk)
        const sstableStart = performance.now();
        const sstableResult = this.sstableManager.search(key);
        const sstableTime = performance.now() - sstableStart;
        
        // Track Bloom filter effectiveness
        for (const step of sstableResult.searchPath) {
            if (step.bloomFilterSaved) {
                this.stats.bloomFilterHits++;
            } else if (!step.bloomFilterSaved && !step.found) {
                this.stats.bloomFilterMisses++;
            }
            
            searchPath.push({
                location: `SSTable Level ${step.level} (${step.sstableId})`,
                found: step.found,
                bloomFilterSaved: step.bloomFilterSaved,
                timeMs: step.timeMs,
                comparisons: step.comparisons || 0,
                complexity: step.complexity
            });
        }
        
        const endTime = performance.now();
        
        if (this.callbacks.onRead) {
            this.callbacks.onRead({ 
                key, 
                found: sstableResult.found, 
                searchPath,
                sstablesChecked: sstableResult.sstablesChecked
            });
        }
        
        return {
            found: sstableResult.found,
            value: sstableResult.found ? sstableResult.value : null,
            location: sstableResult.found ? 'SSTable' : 'Not Found',
            searchPath,
            sstablesChecked: sstableResult.sstablesChecked,
            totalTimeMs: (endTime - startTime).toFixed(3),
            complexity: `O(log n + k·log n) - Checked ${sstableResult.sstablesChecked} SSTables`
        };
    }

    /**
     * DELETE operation - Mark key as deleted (tombstone)
     * Time Complexity: O(log n)
     * 
     * @param {string} key - Key to delete
     * @returns {object} - Operation result
     */
    delete(key) {
        const startTime = performance.now();
        
        // Insert tombstone (null value) into memtable
        const insertResult = this.memtable.insert(key, null);
        this.stats.totalDeletes++;
        
        // Trigger callback for UI update
        if (this.callbacks.onMemtableInsert) {
            this.callbacks.onMemtableInsert({ ...insertResult, operation: 'DELETE' });
        }
        
        // Check if memtable needs flushing
        let flushResult = null;
        if (this.memtable.size >= this.memtableThreshold) {
            flushResult = this.flushMemtable();
        }
        
        const endTime = performance.now();
        
        return {
            success: true,
            operation: 'DELETE',
            key,
            memtableResult: insertResult,
            flushed: flushResult !== null,
            flushResult,
            totalTimeMs: (endTime - startTime).toFixed(3),
            complexity: 'O(log n)'
        };
    }

    /**
     * Flush memtable to disk (create L0 SSTable)
     * Time Complexity: O(n) where n = memtable size
     */
    flushMemtable() {
        const startTime = performance.now();
        
        if (this.memtable.isEmpty()) {
            return null;
        }
        
        // Get all entries from memtable (already sorted by Skip List)
        const entries = this.memtable.getAllEntries();
        
        // Create new SSTable at L0
        const sstable = this.sstableManager.createSSTable(0, entries);
        
        // Clear memtable
        const oldSize = this.memtable.size;
        this.memtable.clear();
        
        this.stats.memtableFlushes++;
        
        const endTime = performance.now();
        
        const flushResult = {
            operation: 'FLUSH',
            entriesFlushed: oldSize,
            sstableId: sstable.id,
            level: 0,
            timeMs: (endTime - startTime).toFixed(3),
            complexity: 'O(n)'
        };
        
        // Trigger callback for UI update
        if (this.callbacks.onMemtableFlush) {
            this.callbacks.onMemtableFlush(flushResult);
        }
        
        return flushResult;
    }

    /**
     * Manual compaction trigger
     */
    compact(sourceLevel, targetLevel) {
        const result = this.compaction.compactLevel(sourceLevel, targetLevel);
        
        if (result.success) {
            this.stats.totalCompactions++;
            
            if (this.callbacks.onCompaction) {
                this.callbacks.onCompaction([result]);
            }
        }
        
        return result;
    }

    /**
     * Get write amplification factor
     * WA = Total bytes written / User data written
     */
    getWriteAmplification() {
        const compactionStats = this.compaction.getStats();
        return parseFloat(compactionStats.writeAmplification);
    }

    /**
     * Get Bloom filter effectiveness
     */
    getBloomFilterEffectiveness() {
        const total = this.stats.bloomFilterHits + this.stats.bloomFilterMisses;
        if (total === 0) return 0;
        
        return ((this.stats.bloomFilterHits / total) * 100).toFixed(2);
    }

    /**
     * Get comprehensive statistics
     */
    getStats() {
        const memtableStats = this.memtable.getStats();
        const sstableStats = this.sstableManager.getStats();
        const compactionStats = this.compaction.getStats();
        
        return {
            operations: {
                totalWrites: this.stats.totalWrites,
                totalReads: this.stats.totalReads,
                totalDeletes: this.stats.totalDeletes,
                total: this.stats.totalWrites + this.stats.totalReads + this.stats.totalDeletes
            },
            memtable: {
                ...memtableStats,
                thresholdReached: (memtableStats.size / this.memtableThreshold * 100).toFixed(1) + '%'
            },
            sstables: sstableStats,
            compaction: compactionStats,
            writeAmplification: this.getWriteAmplification(),
            bloomFilter: {
                hits: this.stats.bloomFilterHits,
                misses: this.stats.bloomFilterMisses,
                effectiveness: this.getBloomFilterEffectiveness() + '%',
                savedDiskReads: this.stats.bloomFilterHits
            },
            memoryUsage: {
                memtableKB: memtableStats.memorySizeKB,
                sstablesKB: sstableStats.totalSizeKB,
                totalKB: (parseFloat(memtableStats.memorySizeKB) + parseFloat(sstableStats.totalSizeKB)).toFixed(2)
            }
        };
    }

    /**
     * Get current state for visualization
     */
    getState() {
        return {
            memtable: {
                size: this.memtable.size,
                maxSize: this.memtableThreshold,
                structure: this.memtable.getStructure(),
                entries: this.memtable.getAllEntries()
            },
            sstables: {
                levels: Array.from(this.sstableManager.levels.entries()).map(([level, sstables]) => ({
                    level,
                    sstables: sstables.map(s => ({
                        id: s.id,
                        keyCount: s.entries.length,
                        sizeKB: (s.size / 1024).toFixed(2),
                        keyRange: s.keyRange
                    }))
                }))
            },
            stats: this.getStats()
        };
    }

    /**
     * Clear all data
     */
    clear() {
        this.memtable.clear();
        this.sstableManager.clear();
        this.compaction.clearHistory();
        
        this.stats = {
            totalWrites: 0,
            totalReads: 0,
            totalDeletes: 0,
            memtableFlushes: 0,
            totalCompactions: 0,
            bloomFilterHits: 0,
            bloomFilterMisses: 0
        };
    }

    /**
     * Run demo operations
     */
    async runDemo() {
        const demoData = [
            { key: 'user:001', value: { name: 'Alice', age: 25 } },
            { key: 'user:002', value: { name: 'Bob', age: 30 } },
            { key: 'user:003', value: { name: 'Charlie', age: 35 } },
            { key: 'user:004', value: { name: 'Diana', age: 28 } },
            { key: 'user:005', value: { name: 'Eve', age: 32 } },
            { key: 'product:001', value: { name: 'Laptop', price: 999 } },
            { key: 'product:002', value: { name: 'Mouse', price: 29 } },
            { key: 'product:003', value: { name: 'Keyboard', price: 79 } },
        ];

        const results = [];
        
        for (const item of demoData) {
            results.push(this.put(item.key, item.value));
            await new Promise(resolve => setTimeout(resolve, 100)); // Delay for animation
        }
        
        return results;
    }
}