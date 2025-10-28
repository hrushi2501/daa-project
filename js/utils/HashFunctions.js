/**
 * HashFunctions.js
 * Collection of hash function implementations for Bloom Filters and other data structures
 */

export class HashFunctions {
    constructor() {
        this.seed = 0x9747b28c;
    }

    /**
     * Simple hash function using division method
     * @param {string} key - Input key
     * @param {number} size - Hash table size
     * @returns {number} Hash value
     */
    divisionHash(key, size) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash += key.charCodeAt(i);
        }
        return hash % size;
    }

    /**
     * Multiplication hash function
     * @param {string} key - Input key
     * @param {number} size - Hash table size
     * @returns {number} Hash value
     */
    multiplicationHash(key, size) {
        const A = 0.6180339887; // (sqrt(5) - 1) / 2 - golden ratio
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash += key.charCodeAt(i);
        }
        const fractionalPart = (hash * A) % 1;
        return Math.floor(size * fractionalPart);
    }

    /**
     * DJB2 hash function - popular and efficient
     * @param {string} key - Input key
     * @returns {number} Hash value
     */
    djb2Hash(key) {
        let hash = 5381;
        for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) + hash) + key.charCodeAt(i); // hash * 33 + c
        }
        return hash >>> 0; // Convert to unsigned 32-bit integer
    }

    /**
     * SDBM hash function
     * @param {string} key - Input key
     * @returns {number} Hash value
     */
    sdbmHash(key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = char + (hash << 6) + (hash << 16) - hash;
        }
        return hash >>> 0;
    }

    /**
     * FNV-1a (Fowler-Noll-Vo) hash function
     * @param {string} key - Input key
     * @returns {number} Hash value
     */
    fnv1aHash(key) {
        let hash = 2166136261; // FNV offset basis
        for (let i = 0; i < key.length; i++) {
            hash ^= key.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return hash >>> 0;
    }

    /**
     * MurmurHash3 32-bit implementation (simplified)
     * @param {string} key - Input key
     * @param {number} seed - Hash seed
     * @returns {number} Hash value
     */
    murmurHash3(key, seed = this.seed) {
        let hash = seed;
        const c1 = 0xcc9e2d51;
        const c2 = 0x1b873593;
        const r1 = 15;
        const r2 = 13;
        const m = 5;
        const n = 0xe6546b64;

        for (let i = 0; i < key.length; i++) {
            let k = key.charCodeAt(i);
            k = Math.imul(k, c1);
            k = (k << r1) | (k >>> (32 - r1));
            k = Math.imul(k, c2);

            hash ^= k;
            hash = (hash << r2) | (hash >>> (32 - r2));
            hash = Math.imul(hash, m) + n;
        }

        hash ^= key.length;
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x85ebca6b);
        hash ^= hash >>> 13;
        hash = Math.imul(hash, 0xc2b2ae35);
        hash ^= hash >>> 16;

        return hash >>> 0;
    }

    /**
     * Jenkins One-at-a-time hash
     * @param {string} key - Input key
     * @returns {number} Hash value
     */
    jenkinsHash(key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash += key.charCodeAt(i);
            hash += hash << 10;
            hash ^= hash >>> 6;
        }
        hash += hash << 3;
        hash ^= hash >>> 11;
        hash += hash << 15;
        return hash >>> 0;
    }

    /**
     * Polynomial rolling hash
     * @param {string} key - Input key
     * @param {number} prime - Prime number for polynomial
     * @param {number} mod - Modulo value
     * @returns {number} Hash value
     */
    polynomialHash(key, prime = 31, mod = 1e9 + 9) {
        let hash = 0;
        let powerOfPrime = 1;
        
        for (let i = 0; i < key.length; i++) {
            hash = (hash + (key.charCodeAt(i) * powerOfPrime) % mod) % mod;
            powerOfPrime = (powerOfPrime * prime) % mod;
        }
        
        return hash;
    }

    /**
     * CRC32 hash (simplified implementation)
     * @param {string} key - Input key
     * @returns {number} Hash value
     */
    crc32Hash(key) {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < key.length; i++) {
            const byte = key.charCodeAt(i);
            crc ^= byte;
            for (let j = 0; j < 8; j++) {
                crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
            }
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    /**
     * Generate k independent hash functions for Bloom Filter
     * Uses double hashing technique with two base hash functions
     * @param {string} key - Input key
     * @param {number} k - Number of hash functions needed
     * @param {number} m - Size of bit array
     * @returns {Array<number>} Array of k hash values
     */
    getKHashValues(key, k, m) {
        const hash1 = this.djb2Hash(key);
        const hash2 = this.fnv1aHash(key);
        const hashes = [];

        for (let i = 0; i < k; i++) {
            // Double hashing: h_i(x) = (h1(x) + i * h2(x)) mod m
            const combinedHash = (hash1 + i * hash2) % m;
            hashes.push(combinedHash >= 0 ? combinedHash : combinedHash + m);
        }

        return hashes;
    }

    /**
     * Generate hash values using different hash functions
     * Useful for comparing hash function quality
     * @param {string} key - Input key
     * @param {number} size - Hash table size
     * @returns {Object} Object with hash values from different functions
     */
    getAllHashes(key, size) {
        return {
            division: this.divisionHash(key, size),
            multiplication: this.multiplicationHash(key, size),
            djb2: this.djb2Hash(key) % size,
            sdbm: this.sdbmHash(key) % size,
            fnv1a: this.fnv1aHash(key) % size,
            murmur3: this.murmurHash3(key) % size,
            jenkins: this.jenkinsHash(key) % size,
            crc32: this.crc32Hash(key) % size
        };
    }

    /**
     * Test hash function distribution quality
     * @param {Function} hashFunc - Hash function to test
     * @param {Array<string>} keys - Array of test keys
     * @param {number} size - Hash table size
     * @returns {Object} Distribution statistics
     */
    testDistribution(hashFunc, keys, size) {
        const buckets = new Array(size).fill(0);
        const hashValues = [];

        keys.forEach(key => {
            const hash = hashFunc.call(this, key, size);
            buckets[hash % size]++;
            hashValues.push(hash);
        });

        // Calculate statistics
        const nonEmptyBuckets = buckets.filter(count => count > 0).length;
        const maxCollisions = Math.max(...buckets);
        const avgCollisions = keys.length / size;
        
        // Calculate standard deviation
        const variance = buckets.reduce((sum, count) => {
            return sum + Math.pow(count - avgCollisions, 2);
        }, 0) / size;
        const stdDeviation = Math.sqrt(variance);

        return {
            totalKeys: keys.length,
            tableSize: size,
            nonEmptyBuckets,
            loadFactor: keys.length / size,
            maxCollisions,
            avgCollisions: avgCollisions.toFixed(2),
            stdDeviation: stdDeviation.toFixed(2),
            uniformity: (nonEmptyBuckets / size * 100).toFixed(2) + '%'
        };
    }

    /**
     * Generate a perfect hash seed for a given set of keys
     * (Simplified - not a true perfect hash, but finds a good seed)
     * @param {Array<string>} keys - Array of keys
     * @param {number} size - Hash table size
     * @param {number} maxAttempts - Maximum attempts to find good seed
     * @returns {number} Best seed found
     */
    findGoodSeed(keys, size, maxAttempts = 100) {
        let bestSeed = 0;
        let minCollisions = Infinity;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            this.seed = Math.floor(Math.random() * 0xFFFFFFFF);
            const seen = new Set();
            let collisions = 0;

            for (const key of keys) {
                const hash = this.murmurHash3(key) % size;
                if (seen.has(hash)) {
                    collisions++;
                } else {
                    seen.add(hash);
                }
            }

            if (collisions < minCollisions) {
                minCollisions = collisions;
                bestSeed = this.seed;
            }

            if (collisions === 0) break; // Perfect hash found
        }

        this.seed = bestSeed;
        return bestSeed;
    }

    /**
     * Consistent hashing - maps keys to nodes
     * @param {string} key - Input key
     * @param {Array<string>} nodes - Array of node identifiers
     * @param {number} virtualNodes - Number of virtual nodes per physical node
     * @returns {string} Selected node
     */
    consistentHash(key, nodes, virtualNodes = 150) {
        const ring = [];
        
        // Create virtual nodes
        nodes.forEach(node => {
            for (let i = 0; i < virtualNodes; i++) {
                const virtualKey = `${node}:${i}`;
                const hash = this.murmurHash3(virtualKey);
                ring.push({ hash, node });
            }
        });

        // Sort ring by hash value
        ring.sort((a, b) => a.hash - b.hash);

        // Find position for key
        const keyHash = this.murmurHash3(key);
        
        // Binary search for the first node with hash >= keyHash
        let left = 0;
        let right = ring.length - 1;
        
        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (ring[mid].hash < keyHash) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        return ring[left % ring.length].node;
    }

    /**
     * Get recommended hash functions for Bloom Filter
     * @returns {Array<Function>} Array of hash functions
     */
    getBloomFilterHashFunctions() {
        return [
            (key) => this.djb2Hash(key),
            (key) => this.fnv1aHash(key),
            (key) => this.murmurHash3(key),
            (key) => this.sdbmHash(key),
            (key) => this.jenkinsHash(key)
        ];
    }
}

// Export for Node.js compatibility (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HashFunctions };
}