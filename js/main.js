/**
 * main.js
 * Main application orchestration for Data Structures and Algorithms Visualization
 */

// Import engine modules
import { LSMTree } from './engine/LSMTree.js';
import { BloomFilter } from './engine/Bloomfilter.js';
import { SkipList } from './engine/Skiplist.js';
import { SSTable } from './engine/SSTable.js';

// Import UI modules
import { AnimationEngine } from './ui/animationengine.js';
import { MetricsDashboard } from './ui/metricsdashboard.js';
import { QueryTracer } from './ui/querytracer.js';
import { StorageInspector } from './ui/storageinspector.js';
import { Terminal } from './ui/terminal.js';

// Import utility modules
import { ComplexityAnalyzer } from './utils/ComplexityAnalyzer.js';
import { HashFunctions } from './utils/HashFunctions.js';
import { Logger } from './utils/Logger.js';

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

    // Note: UI components will be initialized after data structures are created
    // because they need the LSM Tree instance
    
    AppState.logger.info('App', 'UI components ready for initialization');
}

/**
 * Initialize data structures
 */
function initializeDataStructures() {
    AppState.logger.info('App', 'Initializing data structures');

    try {
        // Initialize LSM Tree
        AppState.instances.lsmTree = new LSMTree(10); // memtableThreshold = 10
        AppState.logger.info('App', 'LSM Tree initialized');

        // Initialize UI components now that LSM Tree is ready
        
        // Initialize Terminal
        const terminalOutput = document.getElementById('terminal-output');
        const commandInput = document.getElementById('command-input');
        if (terminalOutput && commandInput) {
            AppState.terminal = new Terminal(
                AppState.instances.lsmTree,
                terminalOutput,
                commandInput
            );
            AppState.logger.info('App', 'Terminal initialized');
        }

        // Initialize Animation Engine
        AppState.animationEngine = new AnimationEngine(AppState.instances.lsmTree);
        AppState.logger.info('App', 'Animation Engine initialized');

        // Initialize Metrics Dashboard
        AppState.metricsDashboard = new MetricsDashboard(AppState.instances.lsmTree);
        AppState.logger.info('App', 'Metrics Dashboard initialized');

        // Initialize Query Tracer
        AppState.queryTracer = new QueryTracer();
        AppState.logger.info('App', 'Query Tracer initialized');

        // Initialize Storage Inspector
        AppState.storageInspector = new StorageInspector(AppState.instances.lsmTree);
        AppState.logger.info('App', 'Storage Inspector initialized');

        // Start auto-update for dashboard and storage inspector
        AppState.metricsDashboard.start(1000);
        AppState.storageInspector.start(10000); // Reduce frequency to 10 seconds to prevent flickering

        // Register LSM Tree callbacks for UI updates
        AppState.instances.lsmTree.on('onMemtableInsert', (result) => {
            if (AppState.animationEngine) {
                AppState.animationEngine.animateInsert(result.key || result.memtableResult?.key);
            }
        });

        AppState.instances.lsmTree.on('onRead', (result) => {
            if (AppState.queryTracer) {
                AppState.queryTracer.traceQuery(result);
            }
        });

        AppState.instances.lsmTree.on('onMemtableFlush', (result) => {
            if (AppState.storageInspector) {
                AppState.storageInspector.showFlushAnimation();
                AppState.storageInspector.update(); // Immediately update on flush
            }
        });

        AppState.instances.lsmTree.on('onCompaction', (results) => {
            if (AppState.storageInspector && results.length > 0) {
                AppState.storageInspector.showCompactionAnimation(
                    results[0].sourceLevel,
                    results[0].targetLevel
                );
                // Delay update slightly to show animation
                setTimeout(() => AppState.storageInspector.update(), 100);
            }
        });

        AppState.logger.info('App', 'All data structures and UI initialized');
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

    // Clear button
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear all data? This cannot be undone.')) {
                AppState.instances.lsmTree.clear();
                if (AppState.terminal) {
                    AppState.terminal.clearOutput();
                }
                if (AppState.queryTracer) {
                    AppState.queryTracer.clear();
                }
                if (AppState.metricsDashboard) {
                    AppState.metricsDashboard.reset();
                }
                if (AppState.storageInspector) {
                    AppState.storageInspector.reset();
                }
                AppState.logger.info('App', 'All data cleared');
            }
        });
    }

    // Demo button
    const demoBtn = document.getElementById('demo-btn');
    if (demoBtn) {
        demoBtn.addEventListener('click', async () => {
            AppState.logger.info('App', 'Running demo');
            await AppState.instances.lsmTree.runDemo();
        });
    }

    AppState.logger.info('App', 'Event listeners set up');
}

/**
 * Initialize terminal commands
 */
function initializeTerminalCommands() {
    // Terminal commands are now handled internally by the Terminal class
    // No additional command registration needed here
    AppState.logger.info('App', 'Terminal commands ready');
}

/**
 * Show welcome message
 */
function showWelcomeMessage() {
    AppState.logger.info('App', 'Application ready');
    console.log('%c Hybrid Indexing Engine ', 'background: #3b82f6; color: white; font-size: 16px; padding: 10px;');
    console.log('%c LSM Tree Visualization Tool ', 'color: #666; font-size: 12px;');
    console.log('\nType commands in the terminal or click "Run Demo"');
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    console.error(message);
    alert(`Error: ${message}`);
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Handle window resize for canvas
window.addEventListener('resize', () => {
    if (AppState.animationEngine) {
        AppState.animationEngine.setupCanvas();
    }
});

// Handle visibility change (pause animations when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (AppState.animationEngine) {
        if (document.hidden) {
            AppState.animationEngine.stop();
        } else {
            AppState.animationEngine.startAnimation();
        }
    }
});

// Error handling
window.addEventListener('error', (e) => {
    if (AppState.logger) {
        AppState.logger.error('App', 'Uncaught error', {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno
        });
    }
    console.error('Application error:', e);
});

window.addEventListener('unhandledrejection', (e) => {
    if (AppState.logger) {
        AppState.logger.error('App', 'Unhandled promise rejection', {
            reason: e.reason
        });
    }
    console.error('Unhandled promise rejection:', e.reason);
});