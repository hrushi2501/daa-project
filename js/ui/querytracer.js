/**
 * QueryTracer.js - Visualize Query Execution Path
 * 
 * Shows step-by-step how queries traverse:
 * 1. Memtable (Skip List)
 * 2. Bloom Filters
 * 3. SSTables (L0 → L1 → L2...)
 * 
 * Displays complexity and timing for each step
 */

export class QueryTracer {
    constructor() {
        this.container = document.getElementById('query-tracer');
        this.traces = [];
        this.maxTraces = 10; // Keep last 10 traces
    }

    /**
     * Trace a query execution
     */
    traceQuery(queryResult) {
        const trace = {
            key: queryResult.key,
            found: queryResult.found,
            location: queryResult.location,
            searchPath: queryResult.searchPath || [],
            timestamp: Date.now(),
            totalTime: queryResult.totalTimeMs || '0',
            sstablesChecked: queryResult.sstablesChecked || 0
        };

        this.traces.unshift(trace);
        if (this.traces.length > this.maxTraces) {
            this.traces.pop();
        }

        this.render();
    }

    /**
     * Render all traces
     */
    render() {
        if (this.traces.length === 0) {
            this.container.innerHTML = `
                <div class="text-xs text-gray-500 text-center py-8">
                    Execute a query to see trace steps
                </div>
            `;
            return;
        }

        // Show only the most recent trace in detail
        const latestTrace = this.traces[0];
        
        this.container.innerHTML = `
            ${this.renderTraceDetail(latestTrace)}
            ${this.traces.length > 1 ? this.renderTraceHistory() : ''}
        `;
    }

    /**
     * Render detailed trace view
     */
    renderTraceDetail(trace) {
        const statusColor = trace.found ? 'text-green-400' : 'text-yellow-400';
        const statusIcon = trace.found ? '✓' : '✗';

        return `
            <div class="space-y-3 animate-fade-in">
                <!-- Query header -->
                <div class="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-gray-400 uppercase tracking-wide">Latest Query</span>
                        <span class="${statusColor} text-xs font-semibold">${statusIcon} ${trace.found ? 'Found' : 'Not Found'}</span>
                    </div>
                    <div class="text-sm font-mono text-gray-200 mb-2">${trace.key}</div>
                    <div class="flex items-center justify-between text-xs">
                        <span class="text-gray-500">Total Time</span>
                        <span class="text-gray-300">${trace.totalTime}ms</span>
                    </div>
                    <div class="flex items-center justify-between text-xs mt-1">
                        <span class="text-gray-500">SSTables Checked</span>
                        <span class="text-gray-300">${trace.sstablesChecked}</span>
                    </div>
                </div>

                <!-- Search path -->
                <div class="space-y-2">
                    <div class="text-xs text-gray-400 uppercase tracking-wide mb-2">Execution Path</div>
                    ${trace.searchPath.map((step, index) => this.renderStep(step, index, trace.found && step.found)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render individual search step
     */
    renderStep(step, index, isFinalStep) {
        let stepColor, borderColor, iconColor, icon;

        if (step.found) {
            stepColor = 'bg-green-500/10';
            borderColor = 'border-green-500/30';
            iconColor = 'text-green-400';
            icon = '✓';
        } else if (step.bloomFilterSaved) {
            stepColor = 'bg-blue-500/10';
            borderColor = 'border-blue-500/30';
            iconColor = 'text-blue-400';
            icon = '⚡';
        } else {
            stepColor = 'bg-gray-800';
            borderColor = 'border-gray-700';
            iconColor = 'text-gray-500';
            icon = '○';
        }

        const isActive = isFinalStep;

        return `
            <div class="trace-step ${isActive ? 'trace-step-active' : ''} relative pl-6">
                <!-- Step connector line -->
                ${index > 0 ? `
                    <div class="absolute left-2 -top-2 w-0.5 h-4 bg-gray-700"></div>
                ` : ''}
                
                <!-- Step content -->
                <div class="${stepColor} rounded-lg p-3 border ${borderColor} ${isActive ? 'glow-blue' : ''}">
                    <div class="flex items-start gap-3">
                        <!-- Step icon -->
                        <div class="flex-shrink-0 mt-0.5">
                            <span class="${iconColor} font-bold">${icon}</span>
                        </div>
                        
                        <!-- Step details -->
                        <div class="flex-1 min-w-0">
                            <div class="text-xs text-gray-300 font-semibold mb-1">
                                Step ${index + 1}: ${step.location}
                            </div>
                            
                            <div class="space-y-1 text-xs">
                                ${step.comparisons !== undefined ? `
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">Comparisons</span>
                                        <span class="text-gray-400">${step.comparisons}</span>
                                    </div>
                                ` : ''}
                                
                                ${step.timeMs ? `
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">Time</span>
                                        <span class="text-gray-400">${step.timeMs}ms</span>
                                    </div>
                                ` : ''}
                                
                                ${step.complexity ? `
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">Complexity</span>
                                        <span class="text-purple-400 font-mono text-[10px]">${step.complexity}</span>
                                    </div>
                                ` : ''}
                                
                                ${step.bloomFilterSaved ? `
                                    <div class="text-blue-400 text-[10px] mt-1">
                                        ⚡ Bloom filter saved disk read
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render trace history (collapsed)
     */
    renderTraceHistory() {
        return `
            <div class="mt-4 pt-4 border-t border-gray-800">
                <div class="text-xs text-gray-400 uppercase tracking-wide mb-2">Recent Queries</div>
                <div class="space-y-1">
                    ${this.traces.slice(1, 6).map((trace, index) => `
                        <div class="flex items-center justify-between bg-gray-800 rounded px-3 py-2 text-xs border border-gray-700 hover:border-gray-600 transition cursor-pointer"
                             onclick="window.showTraceDetail(${index + 1})">
                            <div class="flex items-center gap-2 min-w-0 flex-1">
                                <span class="${trace.found ? 'text-green-400' : 'text-yellow-400'}">${trace.found ? '✓' : '✗'}</span>
                                <span class="text-gray-300 font-mono truncate">${trace.key}</span>
                            </div>
                            <div class="flex items-center gap-2 text-gray-500">
                                <span>${trace.totalTime}ms</span>
                                <span>→</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Show detailed view of a specific trace
     */
    showTraceDetail(index) {
        if (index >= 0 && index < this.traces.length) {
            const trace = this.traces[index];
            
            // Create modal or expanded view
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-gray-900 rounded-lg p-6 max-w-lg w-full mx-4 border border-gray-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-200">Query Trace Details</h3>
                        <button class="text-gray-500 hover:text-gray-300" onclick="this.closest('.fixed').remove()">✕</button>
                    </div>
                    ${this.renderTraceDetail(trace)}
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close on click outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
    }

    /**
     * Clear all traces
     */
    clear() {
        this.traces = [];
        this.render();
    }

    /**
     * Export traces for analysis
     */
    exportTraces() {
        return this.traces.map(trace => ({
            key: trace.key,
            found: trace.found,
            totalTimeMs: trace.totalTime,
            sstablesChecked: trace.sstablesChecked,
            steps: trace.searchPath.length,
            timestamp: trace.timestamp
        }));
    }

    /**
     * Get statistics from traces
     */
    getStats() {
        if (this.traces.length === 0) {
            return {
                avgTimeMs: 0,
                avgSSTables: 0,
                hitRate: 0,
                bloomFilterSaves: 0
            };
        }

        const avgTime = this.traces.reduce((sum, t) => sum + parseFloat(t.totalTime), 0) / this.traces.length;
        const avgSSTables = this.traces.reduce((sum, t) => sum + t.sstablesChecked, 0) / this.traces.length;
        const hits = this.traces.filter(t => t.found).length;
        const bloomSaves = this.traces.reduce((sum, t) => {
            return sum + t.searchPath.filter(s => s.bloomFilterSaved).length;
        }, 0);

        return {
            avgTimeMs: avgTime.toFixed(3),
            avgSSTables: avgSSTables.toFixed(1),
            hitRate: ((hits / this.traces.length) * 100).toFixed(1) + '%',
            bloomFilterSaves: bloomSaves
        };
    }

    /**
     * Highlight a specific step
     */
    highlightStep(stepIndex) {
        const steps = this.container.querySelectorAll('.trace-step');
        if (steps[stepIndex]) {
            steps[stepIndex].classList.add('glow-blue');
            setTimeout(() => {
                steps[stepIndex].classList.remove('glow-blue');
            }, 1000);
        }
    }

    /**
     * Animate query flow
     */
    async animateQuery(trace) {
        for (let i = 0; i < trace.searchPath.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            this.highlightStep(i);
        }
    }
}

// Make showTraceDetail available globally
window.showTraceDetail = function(index) {
    // This will be called from the UI component instance
    console.log('Show trace detail:', index);
};