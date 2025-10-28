/**
 * SSTable.js - Sorted String Table (Immutable Disk Storage)
 * 
 * Time Complexity:
 * - Binary Search: O(log n)
 * - Range Scan: O(log n + k) where k = results
 * - Creation: O(n log n) if unsorted, O(n) if pre-sorted
 * 
 * Space Complexity: O(n)
 * 
 * Properties:
 * - Immutable once created
 * - Sorted by key
 * - Bloom filter for fast negative lookups
 * - Sparse index for faster seeks
 */

import { BloomFilter } from './Bloomfilter.js';

export class SSTable {
    constructor(id, level, entries, bloomFilter = null) {
        this.id = id;
        this.level = level;
        this.createdAt = Date.now();
        
        // Sort entries by key if not already sorted
        this.entries = entries.sort((a, b) => {
            if (a.key < b.key) return -1;
            if (a.key > b.key) return 1;
            return 0;
        });
        
        // Build Bloom filter if not provided
        this.bloomFilter = bloomFilter || this.buildBloomFilter();
        
        // Build sparse index for faster seeks (every 10th key)
        this.sparseIndex = this.buildSparseIndex(10);
        
        // Calculate size
        this.size = this.calculateSize();
        this.keyRange = this.getKeyRange();
    }

    /**
     * Build Bloom filter for this SSTable
     * Reduces unnecessary disk reads by ~99%
     */
    buildBloomFilter() {
        const bf = new BloomFilter(this.entries.length, 0.01);
        
        for (const entry of this.entries) {
            bf.add(entry.key);
        }
        
        return bf;
    }

    /**
     * Build sparse index for faster binary search
     * Stores every Nth key with its position
     * 
     * @param {number} step - Index every Nth key
     */
    buildSparseIndex(step) {
        const index = [];
        
        for (let i = 0; i < this.entries.length; i += step) {
            index.push({
                key: this.entries[i].key,
                position: i
            });
        }
        
        // Always include last key
        if (this.entries.length % step !== 0) {
            const lastIdx = this.entries.length - 1;
            index.push({
                key: this.entries[lastIdx].key,
                position: lastIdx
            });
        }
        
        return index;
    }

    /**
     * Binary search in the entries array
     * Time Complexity: O(log n)
     * 
     * @param {string} key - Key to search
     * @returns {object} - Search result with details
     */
    binarySearch(key, start = 0, end = this.entries.length - 1) {
        let left = start;
        let right = end;
        let comparisons = 0;
        const steps = [];

        while (left <= right) {
            comparisons++;
            const mid = Math.floor((left + right) / 2);
            const midKey = this.entries[mid].key;
            
            steps.push({
                step: comparisons,
                left,
                right,
                mid,
                midKey,
                comparison: key === midKey ? 'equal' : (key < midKey ? 'less' : 'greater')
            });

            if (midKey === key) {
                return {
                    found: true,
                    value: this.entries[mid].value,
                    position: mid,
                    comparisons,
                    steps
                };
            }

            if (key < midKey) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        return {
            found: false,
            comparisons,
            steps
        };
    }

    /**
     * Search for a key using Bloom filter + Binary search
     * Time Complexity: O(k) for Bloom + O(log n) for search
     * 
     * @param {string} key - Key to search
     * @returns {object} - Search result
     */
    get(key) {
        const startTime = performance.now();
        
        // Step 1: Check Bloom filter (fast negative lookup)
        const bloomCheck = this.bloomFilter.contains(key);
        
        if (!bloomCheck.mightExist) {
            // Definitely not in this SSTable
            const endTime = performance.now();
            return {
                found: false,
                bloomFilterSaved: true,
                timeMs: (endTime - startTime).toFixed(3),
                complexity: 'O(k) - Bloom filter only'
            };
        }

        // Step 2: Use sparse index to narrow search range
        let searchStart = 0;
        let searchEnd = this.entries.length - 1;
        
        for (let i = 0; i < this.sparseIndex.length - 1; i++) {
            if (key >= this.sparseIndex[i].key && key < this.sparseIndex[i + 1].key) {
                searchStart = this.sparseIndex[i].position;
                searchEnd = this.sparseIndex[i + 1].position;
                break;
            }
        }

        // Step 3: Binary search in narrowed range
        const searchResult = this.binarySearch(key, searchStart, searchEnd);
        const endTime = performance.now();

        return {
            ...searchResult,
            bloomFilterSaved: false,
            sparseIndexUsed: searchStart !== 0 || searchEnd !== this.entries.length - 1,
            searchRange: { start: searchStart, end: searchEnd },
            timeMs: (endTime - startTime).toFixed(3),
            complexity: 'O(k + log n) - Bloom + Binary search'
        };
    }

    /**
     * Get range of keys (for compaction decisions)
     */
    getKeyRange() {
        if (this.entries.length === 0) {
            return { min: null, max: null };
        }
        return {
            min: this.entries[0].key,
            max: this.entries[this.entries.length - 1].key
        };
    }

    /**
     * Scan a range of keys
     * Time Complexity: O(log n + k) where k = result count
     * 
     * @param {string} startKey - Start of range (inclusive)
     * @param {string} endKey - End of range (inclusive)
     */
    scan(startKey, endKey) {
        const startTime = performance.now();
        const results = [];
        
        // Binary search for start position
        let startPos = 0;
        for (let i = 0; i < this.entries.length; i++) {
            if (this.entries[i].key >= startKey) {
                startPos = i;
                break;
            }
        }

        // Scan until endKey
        for (let i = startPos; i < this.entries.length; i++) {
            if (this.entries[i].key > endKey) break;
            results.push(this.entries[i]);
        }

        const endTime = performance.now();

        return {
            results,
            count: results.length,
            timeMs: (endTime - startTime).toFixed(3)
        };
    }

    /**
     * Calculate size in bytes (simulation)
     */
    calculateSize() {
        let totalBytes = 0;
        
        for (const entry of this.entries) {
            const keySize = entry.key.length * 2; // UTF-16
            const valueSize = JSON.stringify(entry.value).length * 2;
            const metadataSize = 16; // timestamp, etc.
            totalBytes += keySize + valueSize + metadataSize;
        }
        
        // Add Bloom filter size
        totalBytes += this.bloomFilter.getMemorySize();
        
        // Add sparse index size
        totalBytes += this.sparseIndex.length * 24; // approximate
        
        return totalBytes;
    }

    /**
     * Get all entries (for compaction)
     */
    getAllEntries() {
        return [...this.entries];
    }

    /**
     * Check if key exists in range
     */
    containsKeyInRange(key) {
        if (this.entries.length === 0) return false;
        return key >= this.keyRange.min && key <= this.keyRange.max;
    }

    /**
     * Get statistics for visualization
     */
    getStats() {
        return {
            id: this.id,
            level: this.level,
            keyCount: this.entries.length,
            sizeBytes: this.size,
            sizeKB: (this.size / 1024).toFixed(2),
            sizeMB: (this.size / (1024 * 1024)).toFixed(2),
            keyRange: this.keyRange,
            createdAt: this.createdAt,
            age: Date.now() - this.createdAt,
            bloomFilterStats: this.bloomFilter.getStats(),
            sparseIndexSize: this.sparseIndex.length,
            avgKeySize: this.entries.length > 0 
                ? (this.entries.reduce((sum, e) => sum + e.key.length, 0) / this.entries.length).toFixed(1)
                : 0,
            searchComplexity: 'O(log n)',
            worstCaseComparisons: Math.ceil(Math.log2(this.entries.length))
        };
    }

    /**
     * Export for serialization (simulated disk write)
     */
    export() {
        return {
            id: this.id,
            level: this.level,
            entries: this.entries,
            bloomFilter: this.bloomFilter.export(),
            createdAt: this.createdAt,
            keyRange: this.keyRange
        };
    }

    /**
     * Import from serialized data (simulated disk read)
     */
    static import(data) {
        const bloomFilter = BloomFilter.import(data.bloomFilter);
        return new SSTable(data.id, data.level, data.entries, bloomFilter);
    }
}

/**
 * SSTableManager - Manages multiple SSTables per level
 */
export class SSTableManager {
    constructor() {
        this.levels = new Map(); // level -> SSTable[]
        this.nextId = 1;
    }

    /**
     * Add SSTable to a level
     */
    addSSTable(level, sstable) {
        if (!this.levels.has(level)) {
            this.levels.set(level, []);
        }
        this.levels.get(level).push(sstable);
    }

    /**
     * Create new SSTable from entries
     */
    createSSTable(level, entries) {
        const id = `sstable-${this.nextId++}`;
        const sstable = new SSTable(id, level, entries);
        this.addSSTable(level, sstable);
        return sstable;
    }

    /**
     * Get all SSTables at a level
     */
    getLevel(level) {
        return this.levels.get(level) || [];
    }

    /**
     * Search across all SSTables (newest first)
     */
    search(key) {
        const searchPath = [];
        
        // Search from L0 to Ln (newest to oldest)
        const sortedLevels = Array.from(this.levels.keys()).sort((a, b) => a - b);
        
        for (const level of sortedLevels) {
            const sstables = this.getLevel(level);
            
            // In L0, search all SSTables (may overlap)
            // In L1+, use key range to skip SSTables
            for (const sstable of sstables) {
                if (level > 0 && !sstable.containsKeyInRange(key)) {
                    continue; // Skip SSTables that don't contain key range
                }
                
                const result = sstable.get(key);
                searchPath.push({
                    level,
                    sstableId: sstable.id,
                    ...result
                });
                
                if (result.found) {
                    return {
                        found: true,
                        value: result.value,
                        searchPath,
                        sstablesChecked: searchPath.length
                    };
                }
            }
        }
        
        return {
            found: false,
            searchPath,
            sstablesChecked: searchPath.length
        };
    }

    /**
     * Get total number of SSTables
     */
    getTotalSSTables() {
        let total = 0;
        for (const sstables of this.levels.values()) {
            total += sstables.length;
        }
        return total;
    }

    /**
     * Get total size across all levels
     */
    getTotalSize() {
        let total = 0;
        for (const sstables of this.levels.values()) {
            for (const sstable of sstables) {
                total += sstable.size;
            }
        }
        return total;
    }

    /**
     * Clear level
     */
    clearLevel(level) {
        this.levels.set(level, []);
    }

    /**
     * Get all statistics
     */
    getStats() {
        const stats = {
            totalSSTables: this.getTotalSSTables(),
            totalSizeBytes: this.getTotalSize(),
            totalSizeKB: (this.getTotalSize() / 1024).toFixed(2),
            totalSizeMB: (this.getTotalSize() / (1024 * 1024)).toFixed(2),
            levels: {}
        };

        for (const [level, sstables] of this.levels.entries()) {
            stats.levels[level] = {
                count: sstables.length,
                size: sstables.reduce((sum, s) => sum + s.size, 0),
                keyCount: sstables.reduce((sum, s) => sum + s.entries.length, 0)
            };
        }

        return stats;
    }

    /**
     * Clear all SSTables
     */
    clear() {
        this.levels.clear();
        this.nextId = 1;
    }
}