/**
 * BloomFilter.js - Probabilistic Data Structure
 * 
 * Time Complexity:
 * - Add: O(k) where k = number of hash functions
 * - Check: O(k)
 * 
 * Space Complexity: O(m) where m = number of bits
 * 
 * False Positive Probability: (1 - e^(-kn/m))^k
 * where n = number of elements, m = bits, k = hash functions
 * 
 * Used to avoid expensive disk lookups in LSM Tree.
 */

export class BloomFilter {
    constructor(expectedElements = 1000, falsePositiveRate = 0.01) {
        this.expectedElements = expectedElements;
        this.falsePositiveRate = falsePositiveRate;
        
        // Calculate optimal bit array size
        // m = -n * ln(p) / (ln(2)^2)
        this.size = Math.ceil(
            -(expectedElements * Math.log(falsePositiveRate)) / (Math.log(2) ** 2)
        );
        
        // Calculate optimal number of hash functions
        // k = (m/n) * ln(2)
        this.numHashes = Math.ceil((this.size / expectedElements) * Math.log(2));
        
        // Bit array (using Uint8Array for efficiency)
        this.bits = new Uint8Array(Math.ceil(this.size / 8));
        
        // Statistics
        this.elementsAdded = 0;
        this.totalChecks = 0;
        this.truePositives = 0;
        this.falsePositives = 0;
        this.trueNegatives = 0;
    }

    /**
     * Hash function 1: Simple multiplicative hash
     */
    hash1(key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
        }
        return Math.abs(hash) % this.size;
    }

    /**
     * Hash function 2: FNV-1a hash
     */
    hash2(key) {
        let hash = 2166136261;
        for (let i = 0; i < key.length; i++) {
            hash ^= key.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return Math.abs(hash) % this.size;
    }

    /**
     * Hash function 3: DJB2 hash
     */
    hash3(key) {
        let hash = 5381;
        for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) + hash) + key.charCodeAt(i);
        }
        return Math.abs(hash) % this.size;
    }

    /**
     * Generate k hash values using double hashing technique
     * h_i(x) = (hash1(x) + i * hash2(x)) mod m
     * 
     * @param {string} key - The key to hash
     * @returns {Array<number>} - Array of hash indices
     */
    getHashes(key) {
        const h1 = this.hash1(key);
        const h2 = this.hash2(key);
        const hashes = [];

        for (let i = 0; i < this.numHashes; i++) {
            const hash = (h1 + i * h2) % this.size;
            hashes.push(Math.abs(hash));
        }

        return hashes;
    }

    /**
     * Set a bit in the bit array
     */
    setBit(index) {
        const byteIndex = Math.floor(index / 8);
        const bitIndex = index % 8;
        this.bits[byteIndex] |= (1 << bitIndex);
    }

    /**
     * Check if a bit is set
     */
    getBit(index) {
        const byteIndex = Math.floor(index / 8);
        const bitIndex = index % 8;
        return (this.bits[byteIndex] & (1 << bitIndex)) !== 0;
    }

    /**
     * Add an element to the Bloom filter
     * Time Complexity: O(k)
     * 
     * @param {string} key - The key to add
     * @returns {object} - Add operation details
     */
    add(key) {
        const startTime = performance.now();
        const hashes = this.getHashes(key);
        const setBits = [];

        for (const hash of hashes) {
            const wasPreviouslySet = this.getBit(hash);
            this.setBit(hash);
            setBits.push({
                index: hash,
                wasSet: wasPreviouslySet
            });
        }

        this.elementsAdded++;
        const endTime = performance.now();

        return {
            operation: 'ADD',
            key,
            hashes,
            setBits,
            timeMs: (endTime - startTime).toFixed(3),
            fillPercentage: this.getFillPercentage()
        };
    }

    /**
     * Check if an element might be in the set
     * Time Complexity: O(k)
     * 
     * Returns:
     * - true: element MIGHT be in set (could be false positive)
     * - false: element is DEFINITELY NOT in set (no false negatives)
     * 
     * @param {string} key - The key to check
     * @returns {object} - Check result with details
     */
    contains(key) {
        const startTime = performance.now();
        const hashes = this.getHashes(key);
        const bitChecks = [];
        let allBitsSet = true;

        for (const hash of hashes) {
            const isSet = this.getBit(hash);
            bitChecks.push({
                index: hash,
                isSet
            });
            if (!isSet) {
                allBitsSet = false;
                break; // Early exit optimization
            }
        }

        this.totalChecks++;
        const endTime = performance.now();

        return {
            mightExist: allBitsSet,
            hashes,
            bitChecks,
            timeMs: (endTime - startTime).toFixed(3),
            complexity: `O(${this.numHashes})`
        };
    }

    /**
     * Get percentage of bits set (fill rate)
     */
    getFillPercentage() {
        let bitsSet = 0;
        for (let i = 0; i < this.size; i++) {
            if (this.getBit(i)) {
                bitsSet++;
            }
        }
        return ((bitsSet / this.size) * 100).toFixed(2);
    }

    /**
     * Calculate theoretical false positive probability
     * Formula: (1 - e^(-kn/m))^k
     */
    getTheoreticalFalsePositiveRate() {
        if (this.elementsAdded === 0) return 0;
        
        const k = this.numHashes;
        const n = this.elementsAdded;
        const m = this.size;
        
        return Math.pow(1 - Math.exp(-k * n / m), k);
    }

    /**
     * Calculate actual false positive rate from statistics
     */
    getActualFalsePositiveRate() {
        const totalPositives = this.truePositives + this.falsePositives;
        if (totalPositives === 0) return 0;
        return this.falsePositives / totalPositives;
    }

    /**
     * Get bit array representation for visualization
     */
    getBitArray() {
        const bitArray = [];
        for (let i = 0; i < this.size; i++) {
            bitArray.push(this.getBit(i) ? 1 : 0);
        }
        return bitArray;
    }

    /**
     * Get chunks of bit array for better visualization
     */
    getBitChunks(chunkSize = 64) {
        const bitArray = this.getBitArray();
        const chunks = [];
        
        for (let i = 0; i < bitArray.length; i += chunkSize) {
            chunks.push(bitArray.slice(i, i + chunkSize));
        }
        
        return chunks;
    }

    /**
     * Get memory size in bytes
     */
    getMemorySize() {
        return this.bits.length;
    }

    /**
     * Clear the bloom filter
     */
    clear() {
        this.bits = new Uint8Array(Math.ceil(this.size / 8));
        this.elementsAdded = 0;
        this.totalChecks = 0;
        this.truePositives = 0;
        this.falsePositives = 0;
        this.trueNegatives = 0;
    }

    /**
     * Get comprehensive statistics
     */
    getStats() {
        return {
            size: this.size,
            numHashes: this.numHashes,
            expectedElements: this.expectedElements,
            elementsAdded: this.elementsAdded,
            targetFalsePositiveRate: (this.falsePositiveRate * 100).toFixed(2) + '%',
            theoreticalFPRate: (this.getTheoreticalFalsePositiveRate() * 100).toFixed(4) + '%',
            actualFPRate: this.totalChecks > 0 
                ? (this.getActualFalsePositiveRate() * 100).toFixed(4) + '%' 
                : 'N/A',
            fillPercentage: this.getFillPercentage() + '%',
            memorySizeBytes: this.getMemorySize(),
            memorySizeKB: (this.getMemorySize() / 1024).toFixed(2),
            totalChecks: this.totalChecks,
            truePositives: this.truePositives,
            falsePositives: this.falsePositives,
            trueNegatives: this.trueNegatives,
            bitsPerElement: (this.size / Math.max(1, this.elementsAdded)).toFixed(2),
            spaceEfficiency: `${((this.getMemorySize() / Math.max(1, this.elementsAdded))).toFixed(0)} bytes/element`
        };
    }

    /**
     * Export for SSTable serialization
     */
    export() {
        return {
            size: this.size,
            numHashes: this.numHashes,
            bits: Array.from(this.bits),
            elementsAdded: this.elementsAdded
        };
    }

    /**
     * Import from serialized data
     */
    static import(data) {
        const bf = new BloomFilter();
        bf.size = data.size;
        bf.numHashes = data.numHashes;
        bf.bits = new Uint8Array(data.bits);
        bf.elementsAdded = data.elementsAdded;
        return bf;
    }
}