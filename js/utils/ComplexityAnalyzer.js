/**
 * ComplexityAnalyzer.js
 * Provides runtime analysis and performance metrics calculation for data structures
 */

class ComplexityAnalyzer {
    constructor() {
        this.metrics = new Map();
        this.operationCounts = new Map();
        this.timeComplexities = {
            bloomFilter: {
                insert: 'O(k)',
                search: 'O(k)',
                space: 'O(m)'
            },
            skipList: {
                insert: 'O(log n)',
                search: 'O(log n)',
                delete: 'O(log n)',
                space: 'O(n)'
            },
            lsmTree: {
                insert: 'O(1) amortized',
                search: 'O(log n)',
                compaction: 'O(n log n)',
                space: 'O(n)'
            },
            ssTable: {
                read: 'O(log n)',
                write: 'O(n log n)',
                space: 'O(n)'
            }
        };
    }

    /**
     * Start tracking an operation
     * @param {string} operationType - Type of operation (insert, search, delete, etc.)
     * @param {string} dataStructure - Name of the data structure
     * @returns {string} Operation ID for tracking
     */
    startOperation(operationType, dataStructure) {
        const operationId = `${dataStructure}_${operationType}_${Date.now()}`;
        const metric = {
            id: operationId,
            type: operationType,
            dataStructure: dataStructure,
            startTime: performance.now(),
            startMemory: this._getMemoryUsage(),
            comparisons: 0,
            arrayAccesses: 0,
            hashCalculations: 0
        };
        
        this.metrics.set(operationId, metric);
        
        // Update operation count
        const countKey = `${dataStructure}_${operationType}`;
        this.operationCounts.set(countKey, (this.operationCounts.get(countKey) || 0) + 1);
        
        return operationId;
    }

    /**
     * End tracking an operation and calculate metrics
     * @param {string} operationId - The operation ID returned by startOperation
     * @returns {Object} Operation metrics
     */
    endOperation(operationId) {
        const metric = this.metrics.get(operationId);
        if (!metric) {
            console.warn(`Operation ${operationId} not found`);
            return null;
        }

        metric.endTime = performance.now();
        metric.endMemory = this._getMemoryUsage();
        metric.duration = metric.endTime - metric.startTime;
        metric.memoryDelta = metric.endMemory - metric.startMemory;
        metric.complexity = this._getComplexity(metric.dataStructure, metric.type);
        
        return metric;
    }

    /**
     * Record a comparison operation
     * @param {string} operationId - The operation ID
     */
    recordComparison(operationId) {
        const metric = this.metrics.get(operationId);
        if (metric) {
            metric.comparisons++;
        }
    }

    /**
     * Record an array access
     * @param {string} operationId - The operation ID
     */
    recordArrayAccess(operationId) {
        const metric = this.metrics.get(operationId);
        if (metric) {
            metric.arrayAccesses++;
        }
    }

    /**
     * Record a hash calculation
     * @param {string} operationId - The operation ID
     */
    recordHashCalculation(operationId) {
        const metric = this.metrics.get(operationId);
        if (metric) {
            metric.hashCalculations++;
        }
    }

    /**
     * Get the theoretical complexity for an operation
     * @param {string} dataStructure - Name of the data structure
     * @param {string} operation - Type of operation
     * @returns {string} Big O notation
     */
    _getComplexity(dataStructure, operation) {
        const ds = this.timeComplexities[dataStructure];
        return ds ? (ds[operation] || 'O(?)') : 'O(?)';
    }

    /**
     * Get memory usage (approximation)
     * @returns {number} Memory in bytes
     * @private
     */
    _getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0; // Memory API not available
    }

    /**
     * Get statistics for a specific data structure
     * @param {string} dataStructure - Name of the data structure
     * @returns {Object} Statistics object
     */
    getStatistics(dataStructure) {
        const stats = {
            totalOperations: 0,
            averageDuration: 0,
            operationBreakdown: {},
            totalComparisons: 0,
            totalArrayAccesses: 0,
            totalHashCalculations: 0
        };

        const relevantMetrics = Array.from(this.metrics.values())
            .filter(m => m.dataStructure === dataStructure && m.endTime);

        if (relevantMetrics.length === 0) {
            return stats;
        }

        stats.totalOperations = relevantMetrics.length;
        
        let totalDuration = 0;
        relevantMetrics.forEach(metric => {
            totalDuration += metric.duration;
            stats.totalComparisons += metric.comparisons;
            stats.totalArrayAccesses += metric.arrayAccesses;
            stats.totalHashCalculations += metric.hashCalculations;

            if (!stats.operationBreakdown[metric.type]) {
                stats.operationBreakdown[metric.type] = {
                    count: 0,
                    totalDuration: 0,
                    avgDuration: 0
                };
            }
            stats.operationBreakdown[metric.type].count++;
            stats.operationBreakdown[metric.type].totalDuration += metric.duration;
        });

        stats.averageDuration = totalDuration / stats.totalOperations;

        // Calculate average durations for each operation type
        Object.keys(stats.operationBreakdown).forEach(opType => {
            const op = stats.operationBreakdown[opType];
            op.avgDuration = op.totalDuration / op.count;
        });

        return stats;
    }

    /**
     * Analyze complexity based on input size
     * @param {string} dataStructure - Name of the data structure
     * @param {string} operation - Type of operation
     * @param {number} inputSize - Size of input (n)
     * @returns {Object} Complexity analysis
     */
    analyzeComplexity(dataStructure, operation, inputSize) {
        const complexity = this._getComplexity(dataStructure, operation);
        let estimatedOperations = 0;

        // Estimate operations based on complexity
        if (complexity.includes('log n')) {
            estimatedOperations = Math.log2(inputSize);
        } else if (complexity.includes('n log n')) {
            estimatedOperations = inputSize * Math.log2(inputSize);
        } else if (complexity.includes('n²') || complexity.includes('n^2')) {
            estimatedOperations = inputSize * inputSize;
        } else if (complexity.includes('n')) {
            estimatedOperations = inputSize;
        } else if (complexity.includes('k')) {
            estimatedOperations = inputSize; // k is typically small constant
        } else {
            estimatedOperations = 1; // O(1)
        }

        return {
            complexity,
            inputSize,
            estimatedOperations: Math.ceil(estimatedOperations),
            description: this._getComplexityDescription(complexity)
        };
    }

    /**
     * Get human-readable description of complexity
     * @param {string} complexity - Big O notation
     * @returns {string} Description
     * @private
     */
    _getComplexityDescription(complexity) {
        const descriptions = {
            'O(1)': 'Constant time - operation takes same time regardless of input size',
            'O(log n)': 'Logarithmic time - operation time increases logarithmically with input size',
            'O(n)': 'Linear time - operation time increases linearly with input size',
            'O(n log n)': 'Linearithmic time - common in efficient sorting algorithms',
            'O(n²)': 'Quadratic time - operation time increases quadratically with input size',
            'O(k)': 'Constant time based on parameter k (e.g., number of hash functions)'
        };

        for (const [key, desc] of Object.entries(descriptions)) {
            if (complexity.includes(key)) {
                return desc;
            }
        }

        return 'Custom complexity';
    }

    /**
     * Compare performance of different data structures
     * @param {Array<string>} dataStructures - Array of data structure names
     * @returns {Object} Comparison results
     */
    comparePerformance(dataStructures) {
        const comparison = {};
        
        dataStructures.forEach(ds => {
            comparison[ds] = this.getStatistics(ds);
        });

        return comparison;
    }

    /**
     * Export all metrics as JSON
     * @returns {string} JSON string of all metrics
     */
    exportMetrics() {
        const data = {
            metrics: Array.from(this.metrics.entries()),
            operationCounts: Array.from(this.operationCounts.entries()),
            timestamp: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Clear all metrics
     */
    reset() {
        this.metrics.clear();
        this.operationCounts.clear();
    }

    /**
     * Get a summary report
     * @returns {string} Formatted summary
     */
    getSummaryReport() {
        let report = '=== Performance Analysis Summary ===\n\n';
        
        const dataStructures = new Set(
            Array.from(this.metrics.values()).map(m => m.dataStructure)
        );

        dataStructures.forEach(ds => {
            const stats = this.getStatistics(ds);
            report += `${ds.toUpperCase()}:\n`;
            report += `  Total Operations: ${stats.totalOperations}\n`;
            report += `  Average Duration: ${stats.averageDuration.toFixed(3)}ms\n`;
            report += `  Total Comparisons: ${stats.totalComparisons}\n`;
            report += `  Total Array Accesses: ${stats.totalArrayAccesses}\n`;
            report += `  Total Hash Calculations: ${stats.totalHashCalculations}\n`;
            
            if (Object.keys(stats.operationBreakdown).length > 0) {
                report += '  Operation Breakdown:\n';
                Object.entries(stats.operationBreakdown).forEach(([op, data]) => {
                    report += `    ${op}: ${data.count} ops, avg ${data.avgDuration.toFixed(3)}ms\n`;
                });
            }
            report += '\n';
        });

        return report;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComplexityAnalyzer;
}