/**
 * StorageInspector.js - Visualize Memtable and SSTables
 * 
 * Displays:
 * - Memtable structure and fill level
 * - SSTable levels (L0, L1, L2...)
 * - Compaction status
 * - Key ranges
 */

export class StorageInspector {
    constructor(lsmTree) {
        this.lsmTree = lsmTree;
        
        // DOM elements
        this.memtableKeys = document.getElementById('memtable-keys');
        this.memtableSize = document.getElementById('memtable-size');
        this.memtableStatus = document.getElementById('memtable-status');
        this.sstablesContainer = document.getElementById('sstables-container');
        
        // Update interval
        this.updateInterval = null;
    }

    /**
     * Start auto-updating
     */
    start(intervalMs = 1000) {
        this.update(); // Initial update
        
        this.updateInterval = setInterval(() => {
            this.update();
        }, intervalMs);
    }

    /**
     * Stop auto-updating
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update all storage views
     */
    update() {
        const state = this.lsmTree.getState();
        
        this.updateMemtable(state.memtable);
        this.updateSSTables(state.sstables);
    }

    /**
     * Update memtable display
     */
    updateMemtable(memtable) {
        // Update key count
        this.memtableKeys.textContent = memtable.size;
        
        // Update size
        const sizeKB = (memtable.size * 100 / 1024).toFixed(2); // Rough estimate
        this.memtableSize.textContent = `${sizeKB} KB`;
        
        // Update status based on fill level
        const fillPercentage = (memtable.size / memtable.maxSize) * 100;
        
        if (fillPercentage < 50) {
            this.memtableStatus.className = 'px-2 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20 text-xs';
            this.memtableStatus.innerHTML = '<span class="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse mr-1"></span>Active';
        } else if (fillPercentage < 80) {
            this.memtableStatus.className = 'px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/20 text-xs';
            this.memtableStatus.innerHTML = '<span class="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse mr-1"></span>Filling';
        } else {
            this.memtableStatus.className = 'px-2 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20 text-xs';
            this.memtableStatus.innerHTML = '<span class="inline-block w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse mr-1"></span>Near Full';
        }
    }

    /**
     * Update SSTables display
     */
    updateSSTables(sstables) {
        if (sstables.levels.length === 0) {
            this.sstablesContainer.innerHTML = `
                <div class="text-xs text-gray-500 text-center py-8">
                    No SSTables yet. Write operations will create them.
                </div>
            `;
            return;
        }
        
        // Build SSTable level bars
        let html = '';
        
        for (const level of sstables.levels) {
            html += this.createLevelBar(level);
        }
        
        this.sstablesContainer.innerHTML = html;
    }

    /**
     * Create visual bar for SSTable level
     */
    createLevelBar(level) {
        const totalSize = level.sstables.reduce((sum, s) => sum + parseFloat(s.sizeKB), 0);
        const totalKeys = level.sstables.reduce((sum, s) => sum + s.keyCount, 0);
        
        // Color scheme per level
        const colors = {
            0: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
            1: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
            2: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
            3: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400' }
        };
        
        const color = colors[level.level] || colors[0];
        
        // Calculate fill percentage (relative to max level size)
        const maxSizes = { 0: 40, 1: 400, 2: 4000, 3: 40000 }; // KB
        const maxSize = maxSizes[level.level] || 100000;
        const fillPercent = Math.min((totalSize / maxSize) * 100, 100);
        
        return `
            <div class="space-y-2 animate-fade-in">
                <div class="flex items-center gap-3">
                    <span class="text-xs ${color.text} font-semibold w-12">L${level.level}</span>
                    
                    <div class="flex-1 bg-gray-800 rounded-full h-10 relative overflow-hidden border ${color.border}">
                        <!-- Fill bar -->
                        <div class="absolute inset-0 ${color.bg} sstable-bar transition-all duration-500" 
                             style="width: ${fillPercent}%"></div>
                        
                        <!-- Content -->
                        <div class="absolute inset-0 flex items-center justify-between px-4 z-10">
                            <div class="flex items-center gap-3">
                                <span class="text-xs ${color.text} font-semibold">
                                    ${level.sstables.length} SSTable${level.sstables.length > 1 ? 's' : ''}
                                </span>
                                <span class="text-xs text-gray-400">
                                    ${totalKeys} keys
                                </span>
                            </div>
                            <span class="text-xs text-gray-400">
                                ${totalSize.toFixed(2)} KB
                            </span>
                        </div>
                    </div>
                    
                    <!-- Level info button -->
                    <button class="text-xs text-gray-500 hover:text-gray-300 transition" 
                            onclick="window.showLevelDetails(${level.level})">
                        ⓘ
                    </button>
                </div>
                
                <!-- SSTable details (collapsed by default) -->
                <div id="level-${level.level}-details" class="hidden ml-12 space-y-1">
                    ${level.sstables.map(s => this.createSSTableCard(s, color)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Create individual SSTable card
     */
    createSSTableCard(sstable, color) {
        const keyRangeStr = sstable.keyRange.min && sstable.keyRange.max
            ? `${sstable.keyRange.min} → ${sstable.keyRange.max}`
            : 'Empty';
        
        return `
            <div class="bg-gray-900 rounded p-2 border ${color.border} text-xs">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="${color.text} font-mono">${sstable.id}</span>
                        <span class="text-gray-500">•</span>
                        <span class="text-gray-400">${sstable.keyCount} keys</span>
                        <span class="text-gray-500">•</span>
                        <span class="text-gray-400">${sstable.sizeKB} KB</span>
                    </div>
                </div>
                <div class="text-gray-500 mt-1 font-mono text-[10px]">
                    Range: ${keyRangeStr}
                </div>
            </div>
        `;
    }

    /**
     * Show level details
     */
    showLevelDetails(level) {
        const detailsDiv = document.getElementById(`level-${level}-details`);
        if (detailsDiv) {
            detailsDiv.classList.toggle('hidden');
        }
    }

    /**
     * Highlight memtable activity
     */
    highlightMemtable() {
        const canvas = document.getElementById('memtable-canvas');
        if (canvas) {
            canvas.classList.add('glow-blue');
            setTimeout(() => {
                canvas.classList.remove('glow-blue');
            }, 500);
        }
    }

    /**
     * Highlight level during compaction
     */
    highlightLevel(level) {
        const levelBar = this.sstablesContainer.querySelector(`[data-level="${level}"]`);
        if (levelBar) {
            levelBar.classList.add('compacting');
            setTimeout(() => {
                levelBar.classList.remove('compacting');
            }, 2000);
        }
    }

    /**
     * Show flush animation
     */
    showFlushAnimation() {
        const memtableCard = this.memtableStatus.closest('.bg-gray-900');
        if (memtableCard) {
            // Flash animation
            memtableCard.classList.add('glow-yellow');
            setTimeout(() => {
                memtableCard.classList.remove('glow-yellow');
            }, 1000);
        }
        
        // Update immediately
        this.update();
    }

    /**
     * Show compaction animation
     */
    showCompactionAnimation(sourceLevel, targetLevel) {
        // Highlight both levels
        this.highlightLevel(sourceLevel);
        setTimeout(() => {
            this.highlightLevel(targetLevel);
        }, 1000);
        
        // Update after animation
        setTimeout(() => {
            this.update();
        }, 2000);
    }

    /**
     * Get statistics summary
     */
    getSummary() {
        const state = this.lsmTree.getState();
        
        return {
            memtable: {
                keys: state.memtable.size,
                maxKeys: state.memtable.maxSize,
                fillPercentage: (state.memtable.size / state.memtable.maxSize * 100).toFixed(1)
            },
            sstables: {
                totalLevels: state.sstables.levels.length,
                totalTables: state.sstables.levels.reduce((sum, l) => sum + l.sstables.length, 0),
                totalKeys: state.sstables.levels.reduce((sum, l) => 
                    sum + l.sstables.reduce((s, t) => s + t.keyCount, 0), 0
                )
            }
        };
    }

    /**
     * Create visual level indicator
     */
    createLevelIndicator(level, status = 'normal') {
        const statusClasses = {
            normal: 'bg-gray-700 border-gray-600',
            active: 'bg-blue-500/20 border-blue-500/50 animate-pulse',
            compacting: 'bg-yellow-500/20 border-yellow-500/50 animate-pulse',
            full: 'bg-red-500/20 border-red-500/50'
        };
        
        return `
            <div class="inline-flex items-center gap-1 px-2 py-1 rounded border ${statusClasses[status]} text-xs">
                <span class="text-gray-400">L${level}</span>
            </div>
        `;
    }

    /**
     * Force immediate update
     */
    forceUpdate() {
        this.update();
    }

    /**
     * Reset display
     */
    reset() {
        this.memtableKeys.textContent = '0';
        this.memtableSize.textContent = '0 KB';
        this.memtableStatus.className = 'px-2 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20 text-xs';
        this.memtableStatus.innerHTML = '<span class="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse mr-1"></span>Active';
        
        this.sstablesContainer.innerHTML = `
            <div class="text-xs text-gray-500 text-center py-8">
                No SSTables yet. Write operations will create them.
            </div>
        `;
    }
}

// Make showLevelDetails available globally for onclick handlers
window.showLevelDetails = function(level) {
    const detailsDiv = document.getElementById(`level-${level}-details`);
    if (detailsDiv) {
        detailsDiv.classList.toggle('hidden');
    }
};