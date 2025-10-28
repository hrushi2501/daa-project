/**
 * Terminal.js - Command Line Interface for LSM Tree
 * 
 * Supported Commands:
 * - PUT key value
 * - GET key
 * - DELETE key
 * - COMPACT level
 * - STATS
 * - HELP
 * - CLEAR
 */

export class Terminal {
    constructor(lsmTree, outputElement, inputElement) {
        this.lsmTree = lsmTree;
        this.outputElement = outputElement;
        this.inputElement = inputElement;
        this.commandHistory = [];
        this.historyIndex = -1;
        
        this.setupEventListeners();
        this.printWelcome();
    }

    /**
     * Setup input event listeners
     */
    setupEventListeners() {
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const command = this.inputElement.value.trim();
                if (command) {
                    this.executeCommand(command);
                    this.commandHistory.push(command);
                    this.historyIndex = this.commandHistory.length;
                    this.inputElement.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.autocomplete();
            }
        });
    }

    /**
     * Navigate command history
     */
    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;
        
        this.historyIndex += direction;
        
        if (this.historyIndex < 0) {
            this.historyIndex = 0;
        } else if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length;
            this.inputElement.value = '';
            return;
        }
        
        this.inputElement.value = this.commandHistory[this.historyIndex];
    }

    /**
     * Simple autocomplete
     */
    autocomplete() {
        const commands = ['PUT', 'GET', 'DELETE', 'COMPACT', 'STATS', 'HELP', 'CLEAR'];
        const input = this.inputElement.value.toUpperCase();
        
        for (const cmd of commands) {
            if (cmd.startsWith(input)) {
                this.inputElement.value = cmd + ' ';
                return;
            }
        }
    }

    /**
     * Print welcome message
     */
    printWelcome() {
        this.print(`
<div class="text-blue-400 font-semibold">Hybrid Indexing Engine v1.0</div>
<div class="text-gray-500 text-xs mt-1">
  Architecture: LSM Tree (Log-Structured Merge Tree)<br>
  Data Structures: Skip List • Bloom Filter • SSTable<br>
  Algorithms: O(log n) writes • O(k·log n) reads • O(n log k) compaction
</div>
<div class="text-gray-400 text-xs mt-2">Type HELP for commands</div>
        `.trim(), 'system');
    }

    /**
     * Execute command
     */
    executeCommand(command) {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0].toUpperCase();
        
        // Echo command
        this.print(`<span class="text-blue-400">$</span> ${command}`, 'command');
        
        try {
            switch (cmd) {
                case 'PUT':
                    this.handlePut(parts);
                    break;
                case 'GET':
                    this.handleGet(parts);
                    break;
                case 'DELETE':
                    this.handleDelete(parts);
                    break;
                case 'COMPACT':
                    this.handleCompact(parts);
                    break;
                case 'STATS':
                    this.handleStats();
                    break;
                case 'HELP':
                    this.handleHelp();
                    break;
                case 'CLEAR':
                    this.handleClear();
                    break;
                default:
                    this.printError(`Unknown command: ${cmd}. Type HELP for available commands.`);
            }
        } catch (error) {
            this.printError(`Error: ${error.message}`);
        }
        
        // Scroll to bottom
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    /**
     * Handle PUT command
     */
    handlePut(parts) {
        if (parts.length < 3) {
            this.printError('Usage: PUT key value');
            return;
        }
        
        const key = parts[1];
        const value = parts.slice(2).join(' ');
        
        // Try to parse value as JSON
        let parsedValue;
        try {
            parsedValue = JSON.parse(value);
        } catch {
            parsedValue = value; // Use as string if not JSON
        }
        
        const result = this.lsmTree.put(key, parsedValue);
        
        this.print(`
<div class="text-green-400">✓ Inserted successfully</div>
<div class="text-xs text-gray-500 mt-1">
  • Key: <span class="text-gray-300">${key}</span><br>
  • Location: <span class="text-gray-300">Memtable</span><br>
  • Time: <span class="text-gray-300">${result.totalTimeMs}ms</span><br>
  • Complexity: <span class="text-gray-300">${result.complexity}</span>
  ${result.flushed ? '<br>• <span class="text-yellow-400">Memtable flushed to L0 SSTable</span>' : ''}
  ${result.compacted ? '<br>• <span class="text-orange-400">Auto-compaction triggered</span>' : ''}
</div>
        `.trim(), 'success');
    }

    /**
     * Handle GET command
     */
    handleGet(parts) {
        if (parts.length < 2) {
            this.printError('Usage: GET key');
            return;
        }
        
        const key = parts[1];
        const result = this.lsmTree.get(key);
        
        if (result.found) {
            const valueStr = typeof result.value === 'object' 
                ? JSON.stringify(result.value, null, 2) 
                : result.value;
            
            this.print(`
<div class="text-green-400">✓ Found</div>
<div class="text-xs text-gray-500 mt-1">
  • Key: <span class="text-gray-300">${key}</span><br>
  • Location: <span class="text-gray-300">${result.location}</span><br>
  • Time: <span class="text-gray-300">${result.totalTimeMs}ms</span><br>
  • SSTables Checked: <span class="text-gray-300">${result.sstablesChecked || 0}</span><br>
  • Complexity: <span class="text-gray-300">${result.complexity}</span>
</div>
<div class="text-gray-300 mt-2 text-xs">
  <div class="text-gray-500">Value:</div>
  <pre class="text-gray-100 mt-1">${valueStr}</pre>
</div>
            `.trim(), 'success');
        } else {
            this.print(`
<div class="text-yellow-400">⚠ Key not found</div>
<div class="text-xs text-gray-500 mt-1">
  • Key: <span class="text-gray-300">${key}</span><br>
  • SSTables Checked: <span class="text-gray-300">${result.sstablesChecked || 0}</span><br>
  • Time: <span class="text-gray-300">${result.totalTimeMs}ms</span>
</div>
            `.trim(), 'warning');
        }
        
        // Print search path
        if (result.searchPath && result.searchPath.length > 0) {
            this.print(`
<div class="text-xs text-gray-500 mt-2">Search Path:</div>
${result.searchPath.map((step, i) => `
  <div class="text-xs text-gray-600 ml-2">
    ${i + 1}. ${step.location} 
    ${step.found ? '<span class="text-green-400">✓</span>' : '<span class="text-gray-500">✗</span>'}
    ${step.bloomFilterSaved ? '<span class="text-blue-400">(Bloom saved)</span>' : ''}
  </div>
`).join('')}
            `.trim(), 'info');
        }
    }

    /**
     * Handle DELETE command
     */
    handleDelete(parts) {
        if (parts.length < 2) {
            this.printError('Usage: DELETE key');
            return;
        }
        
        const key = parts[1];
        const result = this.lsmTree.delete(key);
        
        this.print(`
<div class="text-red-400">✓ Tombstone created</div>
<div class="text-xs text-gray-500 mt-1">
  • Key: <span class="text-gray-300">${key}</span><br>
  • Operation: <span class="text-gray-300">Tombstone (null) inserted</span><br>
  • Time: <span class="text-gray-300">${result.totalTimeMs}ms</span><br>
  • Note: <span class="text-gray-400">Key will be removed during compaction</span>
  ${result.flushed ? '<br>• <span class="text-yellow-400">Memtable flushed to L0 SSTable</span>' : ''}
</div>
        `.trim(), 'delete');
    }

    /**
     * Handle COMPACT command
     */
    handleCompact(parts) {
        if (parts.length < 2) {
            this.printError('Usage: COMPACT level (e.g., COMPACT 0 to compact L0→L1)');
            return;
        }
        
        const sourceLevel = parseInt(parts[1]);
        const targetLevel = sourceLevel + 1;
        
        if (isNaN(sourceLevel) || sourceLevel < 0) {
            this.printError('Invalid level number');
            return;
        }
        
        const result = this.lsmTree.compact(sourceLevel, targetLevel);
        
        if (result.success) {
            this.print(`
<div class="text-orange-400">✓ Compaction completed</div>
<div class="text-xs text-gray-500 mt-1">
  • Levels: <span class="text-gray-300">L${sourceLevel} → L${targetLevel}</span><br>
  • Input SSTables: <span class="text-gray-300">${result.inputSSTables}</span><br>
  • Output SSTables: <span class="text-gray-300">${result.outputSSTables}</span><br>
  • Duplicates Removed: <span class="text-gray-300">${result.duplicatesRemoved}</span><br>
  • Write Amplification: <span class="text-gray-300">${result.writeAmplification}x</span><br>
  • Time: <span class="text-gray-300">${result.timeMs}ms</span><br>
  • Complexity: <span class="text-gray-300">${result.mergeStats.complexity}</span>
</div>
            `.trim(), 'compaction');
        } else {
            this.printError(result.message);
        }
    }

    /**
     * Handle STATS command
     */
    handleStats() {
        const stats = this.lsmTree.getStats();
        
        this.print(`
<div class="text-blue-400 font-semibold">System Statistics</div>

<div class="text-xs mt-2">
  <div class="text-gray-400 font-semibold">Operations:</div>
  <div class="text-gray-500 ml-2">
    • Writes: <span class="text-gray-300">${stats.operations.totalWrites}</span><br>
    • Reads: <span class="text-gray-300">${stats.operations.totalReads}</span><br>
    • Deletes: <span class="text-gray-300">${stats.operations.totalDeletes}</span><br>
    • Total: <span class="text-gray-300">${stats.operations.total}</span>
  </div>
</div>

<div class="text-xs mt-2">
  <div class="text-gray-400 font-semibold">Memtable (Skip List):</div>
  <div class="text-gray-500 ml-2">
    • Size: <span class="text-gray-300">${stats.memtable.size} / ${this.lsmTree.memtableThreshold}</span><br>
    • Level: <span class="text-gray-300">${stats.memtable.level} (max: ${stats.memtable.maxLevel})</span><br>
    • Memory: <span class="text-gray-300">${stats.memtable.memorySizeKB} KB</span><br>
    • Threshold: <span class="text-gray-300">${stats.memtable.thresholdReached}</span>
  </div>
</div>

<div class="text-xs mt-2">
  <div class="text-gray-400 font-semibold">SSTables (Disk):</div>
  <div class="text-gray-500 ml-2">
    • Total: <span class="text-gray-300">${stats.sstables.totalSSTables}</span><br>
    • Size: <span class="text-gray-300">${stats.sstables.totalSizeKB} KB</span><br>
    ${Object.entries(stats.sstables.levels).map(([level, data]) => 
      `• L${level}: <span class="text-gray-300">${data.count} tables (${(data.size / 1024).toFixed(2)} KB)</span>`
    ).join('<br>')}
  </div>
</div>

<div class="text-xs mt-2">
  <div class="text-gray-400 font-semibold">Performance Metrics:</div>
  <div class="text-gray-500 ml-2">
    • Write Amplification: <span class="text-gray-300">${stats.writeAmplification}x</span><br>
    • Bloom Filter Effectiveness: <span class="text-gray-300">${stats.bloomFilter.effectiveness}</span><br>
    • Disk Reads Saved: <span class="text-gray-300">${stats.bloomFilter.savedDiskReads}</span><br>
    • Total Compactions: <span class="text-gray-300">${stats.compaction.totalCompactions}</span>
  </div>
</div>

<div class="text-xs mt-2">
  <div class="text-gray-400 font-semibold">Complexity Analysis:</div>
  <div class="text-gray-500 ml-2">
    • Write: <span class="text-green-400">${stats.memtable.avgInsertComplexity}</span><br>
    • Read: <span class="text-blue-400">O(log n + k·log n)</span><br>
    • Compaction: <span class="text-yellow-400">O(n log k)</span>
  </div>
</div>
        `.trim(), 'stats');
    }

    /**
     * Handle HELP command
     */
    handleHelp() {
        this.print(`
<div class="text-blue-400 font-semibold">Available Commands</div>

<div class="text-xs mt-2 space-y-1">
  <div>
    <span class="text-green-400">PUT key value</span>
    <div class="text-gray-500 ml-4">Insert or update key-value pair</div>
    <div class="text-gray-600 ml-4 text-xs">Example: PUT user:001 {"name":"Alice"}</div>
  </div>
  
  <div class="mt-2">
    <span class="text-blue-400">GET key</span>
    <div class="text-gray-500 ml-4">Retrieve value by key</div>
    <div class="text-gray-600 ml-4 text-xs">Example: GET user:001</div>
  </div>
  
  <div class="mt-2">
    <span class="text-red-400">DELETE key</span>
    <div class="text-gray-500 ml-4">Mark key as deleted (tombstone)</div>
    <div class="text-gray-600 ml-4 text-xs">Example: DELETE user:001</div>
  </div>
  
  <div class="mt-2">
    <span class="text-orange-400">COMPACT level</span>
    <div class="text-gray-500 ml-4">Trigger compaction from level N to N+1</div>
    <div class="text-gray-600 ml-4 text-xs">Example: COMPACT 0</div>
  </div>
  
  <div class="mt-2">
    <span class="text-purple-400">STATS</span>
    <div class="text-gray-500 ml-4">Display system statistics and metrics</div>
  </div>
  
  <div class="mt-2">
    <span class="text-yellow-400">CLEAR</span>
    <div class="text-gray-500 ml-4">Clear all data (memtable + SSTables)</div>
  </div>
  
  <div class="mt-2">
    <span class="text-gray-400">HELP</span>
    <div class="text-gray-500 ml-4">Show this help message</div>
  </div>
</div>

<div class="text-xs text-gray-500 mt-3">
  • Use ↑/↓ to navigate command history<br>
  • Use Tab for autocomplete
</div>
        `.trim(), 'help');
    }

    /**
     * Handle CLEAR command
     */
    handleClear() {
        this.lsmTree.clear();
        this.print(`
<div class="text-yellow-400">✓ All data cleared</div>
<div class="text-xs text-gray-500 mt-1">
  • Memtable emptied<br>    
  • All SSTables removed<br>
  • Statistics reset
</div>
        `.trim(), 'warning');
    }

    /**
     * Print to terminal
     */
    print(message, type = 'normal') {
        const div = document.createElement('div');
        div.className = 'terminal-line text-sm';
        div.innerHTML = message;
        this.outputElement.appendChild(div);
    }

    /**
     * Print error message
     */
    printError(message) {
        this.print(`<span class="text-red-400">✗ ${message}</span>`, 'error');
    }

    /**
     * Clear terminal output
     */
    clearOutput() {
        this.outputElement.innerHTML = '';
        this.printWelcome();
    }
}