/**
 * SkipList.js - Probabilistic Skip List Implementation
 * 
 * Time Complexity:
 * - Insert: O(log n) average, O(n) worst case
 * - Search: O(log n) average, O(n) worst case
 * - Delete: O(log n) average, O(n) worst case
 * 
 * Space Complexity: O(n) where n is number of elements
 * 
 * Used as the in-memory Memtable in LSM Tree architecture.
 */

class SkipListNode {
    constructor(key, value, level) {
        this.key = key;
        this.value = value;
        this.forward = new Array(level + 1).fill(null);
        this.timestamp = Date.now();
    }
}

export class SkipList {
    constructor(maxLevel = 16, probability = 0.5) {
        this.maxLevel = maxLevel;
        this.probability = probability;
        this.level = 0;
        this.header = new SkipListNode(null, null, maxLevel);
        this.size = 0;
    }

    /**
     * Generate random level for new node
     * Expected level height = log(n) / log(1/p)
     */
    randomLevel() {
        let level = 0;
        while (Math.random() < this.probability && level < this.maxLevel) {
            level++;
        }
        return level;
    }

    /**
     * Insert key-value pair into skip list
     * Time Complexity: O(log n) average
     * 
     * @param {string} key - The key to insert
     * @param {any} value - The value associated with key
     * @returns {object} - Insert statistics
     */
    insert(key, value) {
        const startTime = performance.now();
        const update = new Array(this.maxLevel + 1);
        let current = this.header;
        let comparisons = 0;

        // Find position to insert (traverse from top level down)
        for (let i = this.level; i >= 0; i--) {
            while (current.forward[i] && current.forward[i].key < key) {
                current = current.forward[i];
                comparisons++;
            }
            update[i] = current;
        }

        current = current.forward[0];

        // Update existing key
        if (current && current.key === key) {
            current.value = value;
            current.timestamp = Date.now();
            const endTime = performance.now();
            
            return {
                operation: 'UPDATE',
                key,
                level: this.getNodeLevel(current),
                comparisons,
                timeMs: (endTime - startTime).toFixed(3),
                size: this.size
            };
        }

        // Insert new node
        const newLevel = this.randomLevel();
        
        if (newLevel > this.level) {
            for (let i = this.level + 1; i <= newLevel; i++) {
                update[i] = this.header;
            }
            this.level = newLevel;
        }

        const newNode = new SkipListNode(key, value, newLevel);

        // Insert node at all levels
        for (let i = 0; i <= newLevel; i++) {
            newNode.forward[i] = update[i].forward[i];
            update[i].forward[i] = newNode;
        }

        this.size++;
        const endTime = performance.now();

        return {
            operation: 'INSERT',
            key,
            level: newLevel,
            comparisons,
            timeMs: (endTime - startTime).toFixed(3),
            size: this.size
        };
    }

    /**
     * Search for a key in skip list
     * Time Complexity: O(log n) average
     * 
     * @param {string} key - The key to search
     * @returns {object|null} - Found value or null
     */
    search(key) {
        const startTime = performance.now();
        let current = this.header;
        let comparisons = 0;
        const path = [];

        // Traverse from top level down
        for (let i = this.level; i >= 0; i--) {
            while (current.forward[i] && current.forward[i].key < key) {
                current = current.forward[i];
                comparisons++;
            }
            path.push({ level: i, key: current.key });
        }

        current = current.forward[0];
        const endTime = performance.now();

        if (current && current.key === key) {
            return {
                found: true,
                value: current.value,
                comparisons,
                timeMs: (endTime - startTime).toFixed(3),
                path
            };
        }

        return {
            found: false,
            comparisons,
            timeMs: (endTime - startTime).toFixed(3),
            path
        };
    }

    /**
     * Delete a key from skip list
     * Time Complexity: O(log n) average
     * 
     * @param {string} key - The key to delete
     * @returns {object} - Delete result
     */
    delete(key) {
        const startTime = performance.now();
        const update = new Array(this.maxLevel + 1);
        let current = this.header;
        let comparisons = 0;

        // Find node to delete
        for (let i = this.level; i >= 0; i--) {
            while (current.forward[i] && current.forward[i].key < key) {
                current = current.forward[i];
                comparisons++;
            }
            update[i] = current;
        }

        current = current.forward[0];

        if (!current || current.key !== key) {
            const endTime = performance.now();
            return {
                success: false,
                message: 'Key not found',
                comparisons,
                timeMs: (endTime - startTime).toFixed(3)
            };
        }

        // Remove node from all levels
        for (let i = 0; i <= this.level; i++) {
            if (update[i].forward[i] !== current) break;
            update[i].forward[i] = current.forward[i];
        }

        // Update list level
        while (this.level > 0 && !this.header.forward[this.level]) {
            this.level--;
        }

        this.size--;
        const endTime = performance.now();

        return {
            success: true,
            key,
            comparisons,
            timeMs: (endTime - startTime).toFixed(3),
            size: this.size
        };
    }

    /**
     * Get all key-value pairs in sorted order
     * Time Complexity: O(n)
     * 
     * @returns {Array} - Array of {key, value} objects
     */
    getAllEntries() {
        const entries = [];
        let current = this.header.forward[0];

        while (current) {
            entries.push({
                key: current.key,
                value: current.value,
                timestamp: current.timestamp
            });
            current = current.forward[0];
        }

        return entries;
    }

    /**
     * Get node level for visualization
     */
    getNodeLevel(node) {
        let level = 0;
        while (level <= this.maxLevel && node.forward[level]) {
            level++;
        }
        return level - 1;
    }

    /**
     * Get structure for visualization
     * Returns array of levels with nodes
     */
    getStructure() {
        const structure = [];
        
        for (let i = this.level; i >= 0; i--) {
            const levelNodes = [];
            let current = this.header.forward[i];
            
            while (current) {
                levelNodes.push({
                    key: current.key,
                    value: current.value,
                    level: i
                });
                current = current.forward[i];
            }
            
            structure.push({
                level: i,
                nodes: levelNodes
            });
        }
        
        return structure;
    }

    /**
     * Get memory size estimate in bytes
     */
    getMemorySize() {
        let totalSize = 0;
        let current = this.header.forward[0];

        while (current) {
            // Estimate: key + value + pointers + metadata
            const keySize = current.key ? current.key.length * 2 : 0;
            const valueSize = JSON.stringify(current.value).length * 2;
            const pointerSize = current.forward.length * 8; // 8 bytes per pointer
            const metadataSize = 16; // timestamp + misc

            totalSize += keySize + valueSize + pointerSize + metadataSize;
            current = current.forward[0];
        }

        return totalSize;
    }

    /**
     * Clear all entries
     */
    clear() {
        this.header = new SkipListNode(null, null, this.maxLevel);
        this.level = 0;
        this.size = 0;
    }

    /**
     * Check if skip list is empty
     */
    isEmpty() {
        return this.size === 0;
    }

    /**
     * Get statistics for complexity analysis
     */
    getStats() {
        return {
            size: this.size,
            level: this.level,
            maxLevel: this.maxLevel,
            expectedLevel: Math.log2(this.size + 1),
            memorySizeBytes: this.getMemorySize(),
            memorySizeKB: (this.getMemorySize() / 1024).toFixed(2),
            avgSearchComplexity: 'O(log n)',
            avgInsertComplexity: 'O(log n)',
            avgDeleteComplexity: 'O(log n)'
        };
    }
}