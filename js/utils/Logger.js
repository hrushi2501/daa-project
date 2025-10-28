/**
 * Logger.js
 * Comprehensive logging and debugging utility for data structure operations
 */

export class Logger {
    constructor(options = {}) {
        this.logLevel = options.logLevel || 'INFO';
        this.enableConsole = options.enableConsole !== false;
        this.enableStorage = options.enableStorage || false;
        this.maxStoredLogs = options.maxStoredLogs || 1000;
        this.logs = [];
        this.categories = new Set();
        this.filters = new Set();
        
        // Log levels in order of severity
        this.levels = {
            TRACE: 0,
            DEBUG: 1,
            INFO: 2,
            WARN: 3,
            ERROR: 4,
            FATAL: 5
        };

        // Color codes for console output
        this.colors = {
            TRACE: '\x1b[37m',  // White
            DEBUG: '\x1b[36m',  // Cyan
            INFO: '\x1b[32m',   // Green
            WARN: '\x1b[33m',   // Yellow
            ERROR: '\x1b[31m',  // Red
            FATAL: '\x1b[35m',  // Magenta
            RESET: '\x1b[0m'
        };

        // Browser-friendly styles
        this.styles = {
            TRACE: 'color: #999',
            DEBUG: 'color: #00BCD4',
            INFO: 'color: #4CAF50',
            WARN: 'color: #FF9800; font-weight: bold',
            ERROR: 'color: #F44336; font-weight: bold',
            FATAL: 'color: #9C27B0; font-weight: bold'
        };
    }

    /**
     * Check if message should be logged based on level
     * @param {string} level - Log level
     * @returns {boolean} Whether to log
     * @private
     */
    _shouldLog(level) {
        return this.levels[level] >= this.levels[this.logLevel];
    }

    /**
     * Format timestamp
     * @returns {string} Formatted timestamp
     * @private
     */
    _getTimestamp() {
        const now = new Date();
        return now.toISOString();
    }

    /**
     * Core logging method
     * @param {string} level - Log level
     * @param {string} category - Log category
     * @param {string} message - Log message
     * @param {*} data - Additional data
     * @private
     */
    _log(level, category, message, data = null) {
        if (!this._shouldLog(level)) return;

        // Check filters
        if (this.filters.size > 0 && !this.filters.has(category)) {
            return;
        }

        const logEntry = {
            timestamp: this._getTimestamp(),
            level,
            category,
            message,
            data,
            stackTrace: level === 'ERROR' || level === 'FATAL' ? new Error().stack : null
        };

        // Store in memory if enabled
        if (this.enableStorage) {
            this.logs.push(logEntry);
            if (this.logs.length > this.maxStoredLogs) {
                this.logs.shift(); // Remove oldest log
            }
        }

        // Track categories
        this.categories.add(category);

        // Console output
        if (this.enableConsole) {
            this._outputToConsole(logEntry);
        }

        return logEntry;
    }

    /**
     * Output log to console with appropriate formatting
     * @param {Object} logEntry - Log entry object
     * @private
     */
    _outputToConsole(logEntry) {
        const { timestamp, level, category, message, data } = logEntry;
        const timeStr = timestamp.split('T')[1].split('.')[0];
        
        // Browser environment
        if (typeof window !== 'undefined') {
            const style = this.styles[level];
            console.log(
                `%c[${timeStr}] [${level}] [${category}] ${message}`,
                style
            );
            if (data !== null) {
                console.log(data);
            }
        } 
        // Node environment
        else {
            const color = this.colors[level];
            const reset = this.colors.RESET;
            console.log(
                `${color}[${timeStr}] [${level}] [${category}] ${message}${reset}`
            );
            if (data !== null) {
                console.log(data);
            }
        }

        // Show stack trace for errors
        if (logEntry.stackTrace && (level === 'ERROR' || level === 'FATAL')) {
            console.log('Stack trace:', logEntry.stackTrace);
        }
    }

    /**
     * Log trace level message
     * @param {string} category - Log category
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    trace(category, message, data = null) {
        return this._log('TRACE', category, message, data);
    }

    /**
     * Log debug level message
     * @param {string} category - Log category
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    debug(category, message, data = null) {
        return this._log('DEBUG', category, message, data);
    }

    /**
     * Log info level message
     * @param {string} category - Log category
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    info(category, message, data = null) {
        return this._log('INFO', category, message, data);
    }

    /**
     * Log warning level message
     * @param {string} category - Log category
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    warn(category, message, data = null) {
        return this._log('WARN', category, message, data);
    }

    /**
     * Log error level message
     * @param {string} category - Log category
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    error(category, message, data = null) {
        return this._log('ERROR', category, message, data);
    }

    /**
     * Log fatal level message
     * @param {string} category - Log category
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    fatal(category, message, data = null) {
        return this._log('FATAL', category, message, data);
    }

    /**
     * Log operation start
     * @param {string} category - Log category
     * @param {string} operation - Operation name
     * @param {*} params - Operation parameters
     * @returns {number} Operation ID for tracking
     */
    startOperation(category, operation, params = null) {
        const operationId = Date.now() + Math.random();
        this.info(category, `Starting operation: ${operation}`, {
            operationId,
            params,
            startTime: performance.now()
        });
        return operationId;
    }

    /**
     * Log operation end
     * @param {string} category - Log category
     * @param {string} operation - Operation name
     * @param {number} operationId - Operation ID from startOperation
     * @param {*} result - Operation result
     */
    endOperation(category, operation, operationId, result = null) {
        this.info(category, `Completed operation: ${operation}`, {
            operationId,
            endTime: performance.now(),
            result
        });
    }

    /**
     * Log data structure state
     * @param {string} category - Log category
     * @param {string} structure - Data structure name
     * @param {Object} state - Current state
     */
    logState(category, structure, state) {
        this.debug(category, `${structure} state snapshot`, state);
    }

    /**
     * Log performance metrics
     * @param {string} category - Log category
     * @param {Object} metrics - Performance metrics
     */
    logMetrics(category, metrics) {
        this.info(category, 'Performance metrics', metrics);
    }

    /**
     * Set minimum log level
     * @param {string} level - Log level (TRACE, DEBUG, INFO, WARN, ERROR, FATAL)
     */
    setLogLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.logLevel = level;
            this.info('Logger', `Log level set to ${level}`);
        } else {
            this.warn('Logger', `Invalid log level: ${level}`);
        }
    }

    /**
     * Add category filter (only log these categories)
     * @param {string} category - Category to filter
     */
    addFilter(category) {
        this.filters.add(category);
    }

    /**
     * Remove category filter
     * @param {string} category - Category to remove from filter
     */
    removeFilter(category) {
        this.filters.delete(category);
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.filters.clear();
    }

    /**
     * Get all logs
     * @param {Object} options - Filter options
     * @returns {Array} Filtered logs
     */
    getLogs(options = {}) {
        let filteredLogs = [...this.logs];

        if (options.level) {
            const minLevel = this.levels[options.level];
            filteredLogs = filteredLogs.filter(log => 
                this.levels[log.level] >= minLevel
            );
        }

        if (options.category) {
            filteredLogs = filteredLogs.filter(log => 
                log.category === options.category
            );
        }

        if (options.startTime) {
            filteredLogs = filteredLogs.filter(log => 
                new Date(log.timestamp) >= new Date(options.startTime)
            );
        }

        if (options.endTime) {
            filteredLogs = filteredLogs.filter(log => 
                new Date(log.timestamp) <= new Date(options.endTime)
            );
        }

        if (options.search) {
            const searchLower = options.search.toLowerCase();
            filteredLogs = filteredLogs.filter(log =>
                log.message.toLowerCase().includes(searchLower) ||
                log.category.toLowerCase().includes(searchLower)
            );
        }

        return filteredLogs;
    }

    /**
     * Get log statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            byCategory: {},
            categories: Array.from(this.categories)
        };

        // Count by level
        Object.keys(this.levels).forEach(level => {
            stats.byLevel[level] = 0;
        });

        // Count by category
        this.logs.forEach(log => {
            stats.byLevel[log.level]++;
            stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
        });

        return stats;
    }

    /**
     * Export logs as JSON
     * @param {Object} options - Export options
     * @returns {string} JSON string
     */
    exportJSON(options = {}) {
        const logs = this.getLogs(options);
        return JSON.stringify(logs, null, 2);
    }

    /**
     * Export logs as CSV
     * @param {Object} options - Export options
     * @returns {string} CSV string
     */
    exportCSV(options = {}) {
        const logs = this.getLogs(options);
        if (logs.length === 0) return '';

        const headers = ['timestamp', 'level', 'category', 'message'];
        const csv = [headers.join(',')];

        logs.forEach(log => {
            const row = [
                log.timestamp,
                log.level,
                log.category,
                `"${log.message.replace(/"/g, '""')}"`
            ];
            csv.push(row.join(','));
        });

        return csv.join('\n');
    }

    /**
     * Export logs as formatted text
     * @param {Object} options - Export options
     * @returns {string} Formatted text
     */
    exportText(options = {}) {
        const logs = this.getLogs(options);
        return logs.map(log => {
            const timeStr = log.timestamp.split('T')[1].split('.')[0];
            let output = `[${timeStr}] [${log.level}] [${log.category}] ${log.message}`;
            if (log.data !== null) {
                output += `\n  Data: ${JSON.stringify(log.data, null, 2)}`;
            }
            return output;
        }).join('\n\n');
    }

    /**
     * Clear all stored logs
     */
    clear() {
        this.logs = [];
        this.info('Logger', 'Logs cleared');
    }

    /**
     * Create a child logger with a specific category
     * @param {string} category - Category for the child logger
     * @returns {Object} Child logger object
     */
    createChildLogger(category) {
        return {
            trace: (msg, data) => this.trace(category, msg, data),
            debug: (msg, data) => this.debug(category, msg, data),
            info: (msg, data) => this.info(category, msg, data),
            warn: (msg, data) => this.warn(category, msg, data),
            error: (msg, data) => this.error(category, msg, data),
            fatal: (msg, data) => this.fatal(category, msg, data),
            startOperation: (op, params) => this.startOperation(category, op, params),
            endOperation: (op, id, result) => this.endOperation(category, op, id, result)
        };
    }

    /**
     * Create a performance timer
     * @param {string} category - Log category
     * @param {string} label - Timer label
     * @returns {Function} Stop function
     */
    time(category, label) {
        const startTime = performance.now();
        this.debug(category, `Timer started: ${label}`);

        return () => {
            const duration = performance.now() - startTime;
            this.info(category, `Timer ${label}: ${duration.toFixed(3)}ms`);
            return duration;
        };
    }

    /**
     * Log with grouping (for browser console)
     * @param {string} category - Log category
     * @param {string} groupName - Group name
     * @param {Function} callback - Function to execute within group
     */
    group(category, groupName, callback) {
        if (typeof console.group === 'function') {
            console.group(`[${category}] ${groupName}`);
        } else {
            this.info(category, `=== ${groupName} ===`);
        }

        try {
            callback();
        } finally {
            if (typeof console.groupEnd === 'function') {
                console.groupEnd();
            } else {
                this.info(category, `=== End ${groupName} ===`);
            }
        }
    }

    /**
     * Assert condition and log if false
     * @param {boolean} condition - Condition to test
     * @param {string} category - Log category
     * @param {string} message - Error message if assertion fails
     */
    assert(condition, category, message) {
        if (!condition) {
            this.error(category, `Assertion failed: ${message}`);
            if (typeof console.assert === 'function') {
                console.assert(condition, message);
            }
        }
    }

    /**
     * Get summary report
     * @returns {string} Formatted summary
     */
    getSummary() {
        const stats = this.getStatistics();
        let summary = '=== Logger Summary ===\n\n';
        summary += `Total logs: ${stats.total}\n`;
        summary += `Active categories: ${stats.categories.length}\n\n`;
        
        summary += 'Logs by level:\n';
        Object.entries(stats.byLevel).forEach(([level, count]) => {
            if (count > 0) {
                summary += `  ${level}: ${count}\n`;
            }
        });

        summary += '\nLogs by category:\n';
        Object.entries(stats.byCategory)
            .sort((a, b) => b[1] - a[1])
            .forEach(([category, count]) => {
                summary += `  ${category}: ${count}\n`;
            });

        return summary;
    }
}

// Export for Node.js compatibility (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Logger };
}