/**
 * main.js
 * Main application orchestration for Data Structures and Algorithms Visualization
 */

// Application state
const AppState = {
    currentDataStructure: null,
    instances: {
        lsmTree: null,
        bloomFilter: null,
        skipList: null,
        ssTable: null
    },
    logger: null,
    complexityAnalyzer: null,
    hashFunctions: null,
    terminal: null,
    animationEngine: null,
    metricsDashboard: null,
    queryTracer: null,
    storageInspector: null,
    isInitialized: false,
    animationSpeed: 'normal', // slow, normal, fast
    debugMode: false
};

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing Data Structures Visualization...');

    try {
        // Initialize utility classes
        AppState.logger = new Logger({
            logLevel: 'INFO',
            enableConsole: true,
            enableStorage: true,
            maxStoredLogs: 1000
        });

        AppState.complexityAnalyzer = new ComplexityAnalyzer();
        AppState.hashFunctions = new HashFunctions();

        AppState.logger.info('App', 'Utilities initialized');

        // Initialize UI components
        initializeUI();

        // Initialize data structures
        initializeDataStructures();

        // Setup event listeners
        setupEventListeners();

        // Initialize terminal commands
        initializeTerminalCommands();

        AppState.isInitialized = true;
        AppState.logger.info('App', 'Application initialized successfully');

        // Show welcome message
        showWelcomeMessage();

    } catch (error) {
        console.error('Failed to initialize application:', error);
        AppState.logger.error('App', 'Initialization failed', error);
        showErrorMessage('Failed to initialize application. Please refresh the page.');
    }
}

/**
 * Initialize UI components
 */
function initializeUI() {
    AppState.logger.info('App', 'Initializing UI components');

    // Initialize Terminal
    if (typeof Terminal !== 'undefined') {
        AppState.terminal = new Terminal({
            containerId: 'terminal-container',
            prompt: 'dsa> ',
            welcomeMessage: 'Data Structures & Algorithms Interactive Terminal\nType "help" for available commands.'
        });
    }

    // Initialize Animation Engine
    if (typeof AnimationEngine !== 'undefined') {
        AppState.animationEngine = new AnimationEngine({
            canvasId: 'visualization-canvas',
            fps: 60
        });
    }

    // Initialize Metrics Dashboard
    if (typeof MetricsDashboard !== 'undefined') {
        AppState.metricsDashboard = new MetricsDashboard({
            containerId: 'metrics-container'
        });
    }

    // Initialize Query Tracer
    if (typeof QueryTracer !== 'undefined') {
        AppState.queryTracer = new QueryTracer({
            containerId: 'query-tracer-container'
        });
    }

    // Initialize Storage Inspector
    if (typeof StorageInspector !== 'undefined') {
        AppState.storageInspector = new StorageInspector({
            containerId: 'storage-inspector-container'
        });
    }

    AppState.logger.info('App', 'UI components initialized');
}

/**
 * Initialize data structures
 */
function initializeDataStructures() {
    AppState.logger.info('App', 'Initializing data structures');

    try {
        // Initialize LSM Tree
        if (typeof LSMTree !== 'undefined') {
            AppState.instances.lsmTree = new LSMTree({
                memTableSize: 100,
                compactionThreshold: 3,
                logger: AppState.logger.createChildLogger('LSMTree'),
                complexityAnalyzer: AppState.complexityAnalyzer
            });
            AppState.logger.info('App', 'LSM Tree initialized');
        }

        // Initialize Bloom Filter
        if (typeof BloomFilter !== 'undefined') {
            AppState.instances.bloomFilter = new BloomFilter({
                size: 1000,
                numHashFunctions: 5,
                hashFunctions: AppState.hashFunctions,
                logger: AppState.logger.createChildLogger('BloomFilter'),
                complexityAnalyzer: AppState.complexityAnalyzer
            });
            AppState.logger.info('App', 'Bloom Filter initialized');
        }

        // Initialize Skip List
        if (typeof SkipList !== 'undefined') {
            AppState.instances.skipList = new SkipList({
                maxLevel: 16,
                probability: 0.5,
                logger: AppState.logger.createChildLogger('SkipList'),
                complexityAnalyzer: AppState.complexityAnalyzer
            });
            AppState.logger.info('App', 'Skip List initialized');
        }

        // Initialize SSTable
        if (typeof SSTable !== 'undefined') {
            AppState.instances.ssTable = new SSTable({
                blockSize: 64,
                logger: AppState.logger.createChildLogger('SSTable'),
                complexityAnalyzer: AppState.complexityAnalyzer
            });
            AppState.logger.info('App', 'SSTable initialized');
        }

        AppState.logger.info('App', 'All data structures initialized');
    } catch (error) {
        AppState.logger.error('App', 'Failed to initialize data structures', error);
        throw error;
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    AppState.logger.info('App', 'Setting up event listeners');

    // Data structure selector
    const dsSelector = document.getElementById('ds-selector');
    if (dsSelector) {
        dsSelector.addEventListener('change', (e) => {
            switchDataStructure(e.target.value);
        });
    }

    // Animation speed control
    const speedControl = document.getElementById('animation-speed');
    if (speedControl) {
        speedControl.addEventListener('change', (e) => {
            setAnimationSpeed(e.target.value);
        });
    }

    // Debug mode toggle
    const debugToggle = document.getElementById('debug-mode');
    if (debugToggle) {
        debugToggle.addEventListener('change', (e) => {
            toggleDebugMode(e.target.checked);
        });
    }

    // Clear/Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetCurrentDataStructure();
        });
    }

    // Export metrics button
    const exportBtn = document.getElementById('export-metrics-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportMetrics();
        });
    }

    // Export logs button
    const exportLogsBtn = document.getElementById('export-logs-btn');
    if (exportLogsBtn) {
        exportLogsBtn.addEventListener('click', () => {
            exportLogs();
        });
    }

    AppState.logger.info('App', 'Event listeners set up');
}

/**
 * Initialize terminal commands
 */
function initializeTerminalCommands() {
    if (!AppState.terminal) return;

    AppState.logger.info('App', 'Initializing terminal commands');

    // Help command
    AppState.terminal.addCommand('help', () => {
        return `
Available Commands:
==================

Data Structure Commands:
  use <structure>     - Switch to data structure (lsm, bloom, skiplist, sstable)
  insert <key> [val]  - Insert key-value pair
  search <key>        - Search for a key
  delete <key>        - Delete a key
  display             - Display current structure
  reset               - Reset current data structure

Analysis Commands:
  stats               - Show performance statistics
  complexity <op>     - Show complexity analysis for operation
  metrics             - Display metrics dashboard
  trace <query>       - Trace query execution

Utility Commands:
  speed <slow|normal|fast>  - Set animation speed
  debug <on|off>      - Toggle debug mode
  export metrics      - Export performance metrics
  export logs         - Export application logs
  clear               - Clear terminal
  help                - Show this help message

Examples:
  use lsm
  insert user123 {"name": "John", "age": 30}
  search user123
  stats
        `.trim();
    });

    // Use command
    AppState.terminal.addCommand('use', (args) => {
        if (!args[0]) return 'Usage: use <structure>';
        const structure = args[0].toLowerCase();
        switchDataStructure(structure);
        return `Switched to ${structure}`;
    });

    // Insert command
    AppState.terminal.addCommand('insert', (args) => {
        if (!AppState.currentDataStructure) {
            return 'Please select a data structure first (use <structure>)';
        }
        if (args.length < 1) return 'Usage: insert <key> [value]';
        
        const key = args[0];
        const value = args.slice(1).join(' ') || key;
        
        return performInsert(key, value);
    });

    // Search command
    AppState.terminal.addCommand('search', (args) => {
        if (!AppState.currentDataStructure) {
            return 'Please select a data structure first (use <structure>)';
        }
        if (args.length < 1) return 'Usage: search <key>';
        
        return performSearch(args[0]);
    });

    // Delete command
    AppState.terminal.addCommand('delete', (args) => {
        if (!AppState.currentDataStructure) {
            return 'Please select a data structure first (use <structure>)';
        }
        if (args.length < 1) return 'Usage: delete <key>';
        
        return performDelete(args[0]);
    });

    // Stats command
    AppState.terminal.addCommand('stats', () => {
        return getStatistics();
    });

    // Complexity command
    AppState.terminal.addCommand('complexity', (args) => {
        if (!args[0]) return 'Usage: complexity <operation>';
        return getComplexityInfo(args[0]);
    });

    // Clear command
    AppState.terminal.addCommand('clear', () => {
        if (AppState.terminal) {
            AppState.terminal.clear();
        }
        return '';
    });

    // Speed command
    AppState.terminal.addCommand('speed', (args) => {
        if (!args[0]) return 'Usage: speed <slow|normal|fast>';
        setAnimationSpeed(args[0]);
        return `Animation speed set to ${args[0]}`;
    });

    // Debug command
    AppState.terminal.addCommand('debug', (args) => {
        if (!args[0]) return 'Usage: debug <on|off>';
        const enable = args[0].toLowerCase() === 'on';
        toggleDebugMode(enable);
        return `Debug mode ${enable ? 'enabled' : 'disabled'}`;
    });

    AppState.logger.info('App', 'Terminal commands initialized');
}

/**
 * Switch to a different data structure
 */
function switchDataStructure(structure) {
    const structureMap = {
        'lsm': 'lsmTree',
        'lsmtree': 'lsmTree',
        'bloom': 'bloomFilter',
        'bloomfilter': 'bloomFilter',
        'skiplist': 'skipList',
        'skip': 'skipList',
        'sstable': 'ssTable',
        'ss': 'ssTable'
    };

    const dsKey = structureMap[structure.toLowerCase()];
    
    if (dsKey && AppState.instances[dsKey]) {
        AppState.currentDataStructure = dsKey;
        AppState.logger.info('App', `Switched to ${dsKey}`);
        
        // Update UI
        updateVisualization();
        return true;
    } else {
        AppState.logger.warn('App', `Invalid data structure: ${structure}`);
        return false;
    }
}

/**
 * Perform insert operation
 */
function performInsert(key, value) {
    const ds = AppState.instances[AppState.currentDataStructure];
    if (!ds) return 'No data structure selected';

    try {
        const opId = AppState.complexityAnalyzer.startOperation('insert', AppState.currentDataStructure);
        
        // Perform insertion based on data structure type
        if (AppState.currentDataStructure === 'bloomFilter') {
            ds.insert(key);
        } else {
            ds.insert(key, value);
        }
        
        AppState.complexityAnalyzer.endOperation(opId);
        
        updateVisualization();
        updateMetrics();
        
        return `Inserted: ${key} = ${value}`;
    } catch (error) {
        AppState.logger.error('App', 'Insert failed', error);
        return `Error: ${error.message}`;
    }
}

/**
 * Perform search operation
 */
function performSearch(key) {
    const ds = AppState.instances[AppState.currentDataStructure];
    if (!ds) return 'No data structure selected';

    try {
        const opId = AppState.complexityAnalyzer.startOperation('search', AppState.currentDataStructure);
        
        const result = ds.search(key);
        
        AppState.complexityAnalyzer.endOperation(opId);
        
        updateMetrics();
        
        if (result === null || result === undefined || result === false) {
            return `Key '${key}' not found`;
        } else {
            return `Found: ${key} = ${JSON.stringify(result)}`;
        }
    } catch (error) {
        AppState.logger.error('App', 'Search failed', error);
        return `Error: ${error.message}`;
    }
}

/**
 * Perform delete operation
 */
function performDelete(key) {
    const ds = AppState.instances[AppState.currentDataStructure];
    if (!ds) return 'No data structure selected';

    try {
        const opId = AppState.complexityAnalyzer.startOperation('delete', AppState.currentDataStructure);
        
        const result = ds.delete(key);
        
        AppState.complexityAnalyzer.endOperation(opId);
        
        updateVisualization();
        updateMetrics();
        
        return result ? `Deleted: ${key}` : `Key '${key}' not found`;
    } catch (error) {
        AppState.logger.error('App', 'Delete failed', error);
        return `Error: ${error.message}`;
    }
}

/**
 * Get statistics for current data structure
 */
function getStatistics() {
    if (!AppState.currentDataStructure) {
        return 'No data structure selected';
    }

    const stats = AppState.complexityAnalyzer.getStatistics(AppState.currentDataStructure);
    
    let output = `\nStatistics for ${AppState.currentDataStructure}:\n`;
    output += `${'='.repeat(50)}\n`;
    output += `Total Operations: ${stats.totalOperations}\n`;
    output += `Average Duration: ${stats.averageDuration.toFixed(3)}ms\n`;
    output += `Total Comparisons: ${stats.totalComparisons}\n`;
    output += `Total Array Accesses: ${stats.totalArrayAccesses}\n`;
    output += `Total Hash Calculations: ${stats.totalHashCalculations}\n\n`;
    
    if (Object.keys(stats.operationBreakdown).length > 0) {
        output += 'Operation Breakdown:\n';
        Object.entries(stats.operationBreakdown).forEach(([op, data]) => {
            output += `  ${op}: ${data.count} ops, avg ${data.avgDuration.toFixed(3)}ms\n`;
        });
    }
    
    return output;
}

/**
 * Get complexity information
 */
function getComplexityInfo(operation) {
    if (!AppState.currentDataStructure) {
        return 'No data structure selected';
    }

    const analysis = AppState.complexityAnalyzer.analyzeComplexity(
        AppState.currentDataStructure,
        operation,
        100 // Sample size
    );
    
    let output = `\nComplexity Analysis for ${operation} on ${AppState.currentDataStructure}:\n`;
    output += `${'='.repeat(50)}\n`;
    output += `Time Complexity: ${analysis.complexity}\n`;
    output += `Description: ${analysis.description}\n`;
    output += `Estimated operations for n=100: ${analysis.estimatedOperations}\n`;
    
    return output;
}

/**
 * Update visualization
 */
function updateVisualization() {
    if (AppState.animationEngine && AppState.currentDataStructure) {
        const ds = AppState.instances[AppState.currentDataStructure];
        AppState.animationEngine.render(ds);
    }
}

/**
 * Update metrics dashboard
 */
function updateMetrics() {
    if (AppState.metricsDashboard && AppState.currentDataStructure) {
        const stats = AppState.complexityAnalyzer.getStatistics(AppState.currentDataStructure);
        AppState.metricsDashboard.update(stats);
    }
}

/**
 * Reset current data structure
 */
function resetCurrentDataStructure() {
    if (!AppState.currentDataStructure) return;

    const ds = AppState.instances[AppState.currentDataStructure];
    if (ds && typeof ds.reset === 'function') {
        ds.reset();
        AppState.logger.info('App', `Reset ${AppState.currentDataStructure}`);
        updateVisualization();
    }
}

/**
 * Set animation speed
 */
function setAnimationSpeed(speed) {
    AppState.animationSpeed = speed;
    AppState.logger.info('App', `Animation speed set to ${speed}`);
    
    if (AppState.animationEngine) {
        const speedMap = { slow: 30, normal: 60, fast: 120 };
        AppState.animationEngine.setFPS(speedMap[speed] || 60);
    }
}

/**
 * Toggle debug mode
 */
function toggleDebugMode(enable) {
    AppState.debugMode = enable;
    AppState.logger.setLogLevel(enable ? 'DEBUG' : 'INFO');
    AppState.logger.info('App', `Debug mode ${enable ? 'enabled' : 'disabled'}`);
}

/**
 * Export performance metrics
 */
function exportMetrics() {
    const metrics = AppState.complexityAnalyzer.exportMetrics();
    downloadFile('metrics.json', metrics, 'application/json');
    AppState.logger.info('App', 'Metrics exported');
}

/**
 * Export application logs
 */
function exportLogs() {
    const logs = AppState.logger.exportJSON();
    downloadFile('logs.json', logs, 'application/json');
    AppState.logger.info('App', 'Logs exported');
}

/**
 * Download file helper
 */
function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Show welcome message
 */
function showWelcomeMessage() {
    if (AppState.terminal) {
        AppState.terminal.write('\nWelcome to Data Structures & Algorithms Visualization!');
        AppState.terminal.write('Type "help" for available commands.\n');
    }
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    console.error(message);
    if (AppState.terminal) {
        AppState.terminal.write(`ERROR: ${message}`);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Demo functions for testing
const Demo = {
    /**
     * Run LSM Tree demo
     */
    lsmTreeDemo: function() {
        console.log('Running LSM Tree Demo...');
        switchDataStructure('lsm');
        
        // Insert sample data
        const sampleData = [
            ['user1', '{"name": "Alice", "age": 25}'],
            ['user2', '{"name": "Bob", "age": 30}'],
            ['user3', '{"name": "Charlie", "age": 35}'],
            ['user4', '{"name": "Diana", "age": 28}'],
            ['user5', '{"name": "Eve", "age": 32}']
        ];

        sampleData.forEach(([key, value], index) => {
            setTimeout(() => {
                performInsert(key, value);
                console.log(`Inserted ${key}`);
            }, index * 1000);
        });

        // Search after inserts
        setTimeout(() => {
            console.log('\nSearching for user3:');
            console.log(performSearch('user3'));
        }, 6000);

        // Show stats
        setTimeout(() => {
            console.log(getStatistics());
        }, 7000);
    },

    /**
     * Run Bloom Filter demo
     */
    bloomFilterDemo: function() {
        console.log('Running Bloom Filter Demo...');
        switchDataStructure('bloom');

        const words = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
        
        // Insert words
        words.forEach((word, index) => {
            setTimeout(() => {
                performInsert(word, '');
                console.log(`Added ${word} to Bloom Filter`);
            }, index * 800);
        });

        // Test membership
        setTimeout(() => {
            console.log('\nTesting membership:');
            console.log(performSearch('apple'));   // Should be found
            console.log(performSearch('banana'));  // Should be found
            console.log(performSearch('grape'));   // Probably not found
        }, 5000);

        // Show stats
        setTimeout(() => {
            console.log(getStatistics());
        }, 6000);
    },

    /**
     * Run Skip List demo
     */
    skipListDemo: function() {
        console.log('Running Skip List Demo...');
        switchDataStructure('skiplist');

        const numbers = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
        
        // Insert numbers
        numbers.forEach((num, index) => {
            setTimeout(() => {
                performInsert(`key${num}`, num.toString());
                console.log(`Inserted key${num} = ${num}`);
            }, index * 700);
        });

        // Search operations
        setTimeout(() => {
            console.log('\nSearching:');
            console.log(performSearch('key4'));
            console.log(performSearch('key9'));
            console.log(performSearch('key7'));
        }, 8000);

        // Show stats
        setTimeout(() => {
            console.log(getStatistics());
        }, 9000);
    },

    /**
     * Run comparison demo across all structures
     */
    comparisonDemo: function() {
        console.log('Running Comparison Demo...');
        
        const operations = [
            { ds: 'bloom', key: 'test1', value: '' },
            { ds: 'skiplist', key: 'test1', value: 'value1' },
            { ds: 'lsm', key: 'test1', value: 'value1' }
        ];

        operations.forEach(({ ds, key, value }, index) => {
            setTimeout(() => {
                switchDataStructure(ds);
                performInsert(key, value);
                console.log(`${ds}: Inserted ${key}`);
            }, index * 2000);
        });

        // Show comparison
        setTimeout(() => {
            console.log('\nPerformance Comparison:');
            const comparison = AppState.complexityAnalyzer.comparePerformance([
                'bloomFilter', 'skipList', 'lsmTree'
            ]);
            console.log(JSON.stringify(comparison, null, 2));
        }, 7000);
    },

    /**
     * Run stress test
     */
    stressTest: function(numOperations = 100) {
        console.log(`Running stress test with ${numOperations} operations...`);
        switchDataStructure('lsm');

        const startTime = performance.now();

        for (let i = 0; i < numOperations; i++) {
            const key = `key${i}`;
            const value = `value${i}`;
            performInsert(key, value);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`\nStress test completed in ${duration.toFixed(2)}ms`);
        console.log(`Average per operation: ${(duration / numOperations).toFixed(3)}ms`);
        console.log(getStatistics());
    },

    /**
     * Demonstrate hash function quality
     */
    hashFunctionDemo: function() {
        console.log('Running Hash Function Demo...');
        
        const testKeys = [];
        for (let i = 0; i < 100; i++) {
            testKeys.push(`key${i}`);
        }

        const hashFunc = (key, size) => AppState.hashFunctions.djb2Hash(key) % size;
        const stats = AppState.hashFunctions.testDistribution(hashFunc, testKeys, 50);

        console.log('\nHash Function Distribution Analysis:');
        console.log(`Total Keys: ${stats.totalKeys}`);
        console.log(`Table Size: ${stats.tableSize}`);
        console.log(`Load Factor: ${stats.loadFactor}`);
        console.log(`Non-empty Buckets: ${stats.nonEmptyBuckets}`);
        console.log(`Max Collisions: ${stats.maxCollisions}`);
        console.log(`Average Collisions: ${stats.avgCollisions}`);
        console.log(`Standard Deviation: ${stats.stdDeviation}`);
        console.log(`Uniformity: ${stats.uniformity}`);
    },

    /**
     * Demonstrate complexity analysis
     */
    complexityDemo: function() {
        console.log('Running Complexity Analysis Demo...');

        const structures = ['lsmTree', 'bloomFilter', 'skipList'];
        const operations = ['insert', 'search'];
        const inputSizes = [10, 100, 1000, 10000];

        console.log('\nComplexity Analysis:\n');
        
        structures.forEach(ds => {
            console.log(`${ds.toUpperCase()}:`);
            operations.forEach(op => {
                console.log(`  ${op}:`);
                inputSizes.forEach(size => {
                    const analysis = AppState.complexityAnalyzer.analyzeComplexity(ds, op, size);
                    console.log(`    n=${size}: ${analysis.complexity} ≈ ${analysis.estimatedOperations} operations`);
                });
            });
            console.log('');
        });
    },

    /**
     * Interactive tutorial
     */
    tutorial: function() {
        if (!AppState.terminal) {
            console.log('Terminal not available');
            return;
        }

        console.log('Starting interactive tutorial...');
        
        AppState.terminal.write('\n=== Interactive Tutorial ===\n');
        AppState.terminal.write('\nStep 1: Let\'s start with an LSM Tree');
        AppState.terminal.write('Command: use lsm\n');
        
        setTimeout(() => {
            AppState.terminal.write('\nStep 2: Insert some data');
            AppState.terminal.write('Command: insert user1 {"name": "Alice"}');
            AppState.terminal.write('Try it yourself now!\n');
        }, 2000);

        setTimeout(() => {
            AppState.terminal.write('\nStep 3: Search for the data');
            AppState.terminal.write('Command: search user1');
            AppState.terminal.write('Try it yourself!\n');
        }, 5000);

        setTimeout(() => {
            AppState.terminal.write('\nStep 4: Check the statistics');
            AppState.terminal.write('Command: stats');
            AppState.terminal.write('See the performance metrics!\n');
        }, 8000);

        setTimeout(() => {
            AppState.terminal.write('\nStep 5: Try other data structures');
            AppState.terminal.write('Commands: use bloom, use skiplist');
            AppState.terminal.write('\nExperiment and have fun!\n');
        }, 11000);
    }
};

// Expose to global scope for console access
window.AppState = AppState;
window.Demo = Demo;

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K: Clear terminal
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (AppState.terminal) {
            AppState.terminal.clear();
        }
    }

    // Ctrl/Cmd + E: Export metrics
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportMetrics();
    }

    // Ctrl/Cmd + L: Export logs
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        exportLogs();
    }

    // Ctrl/Cmd + R: Reset current data structure
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        resetCurrentDataStructure();
    }

    // F1: Show help
    if (e.key === 'F1') {
        e.preventDefault();
        if (AppState.terminal) {
            AppState.terminal.executeCommand('help');
        }
    }
});

// Handle window resize for canvas
window.addEventListener('resize', () => {
    if (AppState.animationEngine) {
        AppState.animationEngine.resize();
        updateVisualization();
    }
});

// Handle visibility change (pause animations when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (AppState.animationEngine) {
        if (document.hidden) {
            AppState.animationEngine.pause();
        } else {
            AppState.animationEngine.resume();
        }
    }
});

// Error handling
window.addEventListener('error', (e) => {
    AppState.logger.error('App', 'Uncaught error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
    });
});

window.addEventListener('unhandledrejection', (e) => {
    AppState.logger.error('App', 'Unhandled promise rejection', {
        reason: e.reason
    });
});

// Log application info
console.log('%c Data Structures & Algorithms Visualization ', 'background: #4CAF50; color: white; font-size: 16px; padding: 10px;');
console.log('%c Educational Tool for Advanced Data Structures ', 'color: #666; font-size: 12px;');
console.log('\nAvailable demos:');
console.log('  Demo.lsmTreeDemo()       - LSM Tree demonstration');
console.log('  Demo.bloomFilterDemo()   - Bloom Filter demonstration');
console.log('  Demo.skipListDemo()      - Skip List demonstration');
console.log('  Demo.comparisonDemo()    - Compare all structures');
console.log('  Demo.stressTest(100)     - Run stress test');
console.log('  Demo.hashFunctionDemo()  - Hash function analysis');
console.log('  Demo.complexityDemo()    - Complexity analysis');
console.log('  Demo.tutorial()          - Interactive tutorial');
console.log('\nAccess application state: AppState');
console.log('Available keyboard shortcuts:');
console.log('  Ctrl/Cmd + K  - Clear terminal');
console.log('  Ctrl/Cmd + E  - Export metrics');
console.log('  Ctrl/Cmd + L  - Export logs');
console.log('  Ctrl/Cmd + R  - Reset data structure');
console.log('  F1            - Show help');

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppState, Demo, initializeApp };
}