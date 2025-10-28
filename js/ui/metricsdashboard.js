/**
 * MetricsDashboard.js - Real-time Performance Metrics Display
 * 
 * Tracks and displays:
 * - Write/Read operation counts
 * - Write amplification factor
 * - Bloom filter false positive rate
 * - Operation latency
 * - Trends and changes
 */

export class MetricsDashboard {
    constructor(lsmTree) {
        this.lsmTree = lsmTree;
        
        // Metric elements
        this.elements = {
            writeCount: document.getElementById('write-count'),
            writeTrend: document.getElementById('write-trend'),
            readCount: document.getElementById('read-count'),
            readTrend: document.getElementById('read-trend'),
            writeAmp: document.getElementById('write-amp'),
            waStatus: document.getElementById('wa-status'),
            bloomFp: document.getElementById('bloom-fp'),
            bloomStatus: document.getElementById('bloom-status')
        };
        
        // Previous values for trend calculation
        this.previous = {
            writes: 0,
            reads: 0,
            writeAmp: 1.0,
            bloomFp: 0
        };
        
        // Update interval
        this.updateInterval = null;
    }

    /**
     * Start auto-updating metrics
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
     * Update all metrics
     */
    update() {
        const stats = this.lsmTree.getStats();
        
        this.updateWriteMetrics(stats);
        this.updateReadMetrics(stats);
        this.updateWriteAmplification(stats);
        this.updateBloomFilter(stats);
    }

    /**
     * Update write operation metrics
     */
    updateWriteMetrics(stats) {
        const currentWrites = stats.operations.totalWrites;
        
        // Update count
        this.animateValue(
            this.elements.writeCount,
            this.previous.writes,
            currentWrites
        );
        
        // Update trend
        if (currentWrites > this.previous.writes) {
            const increase = currentWrites - this.previous.writes;
            this.elements.writeTrend.textContent = `↑ +${increase}`;
            this.elements.writeTrend.className = 'text-xs text-green-400';
        } else if (currentWrites < this.previous.writes) {
            const decrease = this.previous.writes - currentWrites;
            this.elements.writeTrend.textContent = `↓ -${decrease}`;
            this.elements.writeTrend.className = 'text-xs text-red-400';
        } else {
            this.elements.writeTrend.textContent = '—';
            this.elements.writeTrend.className = 'text-xs text-gray-500';
        }
        
        this.previous.writes = currentWrites;
        
        // Add pulse animation on change
        if (currentWrites > this.previous.writes) {
            this.elements.writeCount.parentElement.classList.add('metric-update');
            setTimeout(() => {
                this.elements.writeCount.parentElement.classList.remove('metric-update');
            }, 500);
        }
    }

    /**
     * Update read operation metrics
     */
    updateReadMetrics(stats) {
        const currentReads = stats.operations.totalReads;
        
        // Update count
        this.animateValue(
            this.elements.readCount,
            this.previous.reads,
            currentReads
        );
        
        // Update trend
        if (currentReads > this.previous.reads) {
            const increase = currentReads - this.previous.reads;
            this.elements.readTrend.textContent = `↑ +${increase}`;
            this.elements.readTrend.className = 'text-xs text-blue-400';
        } else if (currentReads < this.previous.reads) {
            const decrease = this.previous.reads - currentReads;
            this.elements.readTrend.textContent = `↓ -${decrease}`;
            this.elements.readTrend.className = 'text-xs text-red-400';
        } else {
            this.elements.readTrend.textContent = '—';
            this.elements.readTrend.className = 'text-xs text-gray-500';
        }
        
        this.previous.reads = currentReads;
        
        // Add pulse animation on change
        if (currentReads > this.previous.reads) {
            this.elements.readCount.parentElement.classList.add('metric-update');
            setTimeout(() => {
                this.elements.readCount.parentElement.classList.remove('metric-update');
            }, 500);
        }
    }

    /**
     * Update write amplification metric
     */
    updateWriteAmplification(stats) {
        const currentWA = stats.writeAmplification;
        
        // Update value
        this.elements.writeAmp.textContent = `${currentWA.toFixed(1)}x`;
        
        // Update status based on value
        let status, statusClass;
        if (currentWA < 5) {
            status = 'Excellent';
            statusClass = 'text-green-400';
        } else if (currentWA < 10) {
            status = 'Good';
            statusClass = 'text-blue-400';
        } else if (currentWA < 20) {
            status = 'Normal';
            statusClass = 'text-yellow-400';
        } else {
            status = 'High';
            statusClass = 'text-red-400';
        }
        
        this.elements.waStatus.textContent = status;
        this.elements.waStatus.className = `text-xs ${statusClass}`;
        
        // Color-code the metric value
        if (currentWA < 10) {
            this.elements.writeAmp.className = 'text-2xl font-bold text-green-400';
        } else if (currentWA < 20) {
            this.elements.writeAmp.className = 'text-2xl font-bold text-yellow-400';
        } else {
            this.elements.writeAmp.className = 'text-2xl font-bold text-red-400';
        }
        
        this.previous.writeAmp = currentWA;
        
        // Add pulse animation on significant change
        if (Math.abs(currentWA - this.previous.writeAmp) > 1) {
            this.elements.writeAmp.parentElement.classList.add('metric-update');
            setTimeout(() => {
                this.elements.writeAmp.parentElement.classList.remove('metric-update');
            }, 500);
        }
    }

    /**
     * Update Bloom filter metrics
     */
    updateBloomFilter(stats) {
        const effectiveness = parseFloat(stats.bloomFilter.effectiveness);
        
        // Update false positive rate (inverse of effectiveness)
        const fpRate = 100 - effectiveness;
        this.elements.bloomFp.textContent = `${fpRate.toFixed(1)}%`;
        
        // Update status
        let status, statusClass;
        if (fpRate < 1) {
            status = 'Optimal';
            statusClass = 'text-green-400';
        } else if (fpRate < 5) {
            status = 'Good';
            statusClass = 'text-blue-400';
        } else if (fpRate < 10) {
            status = 'Normal';
            statusClass = 'text-yellow-400';
        } else {
            status = 'High';
            statusClass = 'text-red-400';
        }
        
        this.elements.bloomStatus.textContent = status;
        this.elements.bloomStatus.className = `text-xs ${statusClass}`;
        
        // Color-code the metric value
        if (fpRate < 1) {
            this.elements.bloomFp.className = 'text-2xl font-bold text-green-400';
        } else if (fpRate < 5) {
            this.elements.bloomFp.className = 'text-2xl font-bold text-blue-400';
        } else {
            this.elements.bloomFp.className = 'text-2xl font-bold text-yellow-400';
        }
        
        this.previous.bloomFp = fpRate;
    }

    /**
     * Animate value change
     */
    animateValue(element, start, end, duration = 300) {
        if (start === end) {
            element.textContent = end;
            return;
        }
        
        const startTime = performance.now();
        const difference = end - start;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (difference * easeOut));
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = end;
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Force immediate update
     */
    forceUpdate() {
        this.update();
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.elements.writeCount.textContent = '0';
        this.elements.writeTrend.textContent = '—';
        this.elements.readCount.textContent = '0';
        this.elements.readTrend.textContent = '—';
        this.elements.writeAmp.textContent = '1.0x';
        this.elements.waStatus.textContent = 'Normal';
        this.elements.bloomFp.textContent = '0.0%';
        this.elements.bloomStatus.textContent = 'Optimal';
        
        this.previous = {
            writes: 0,
            reads: 0,
            writeAmp: 1.0,
            bloomFp: 0
        };
    }

    /**
     * Get current metrics snapshot
     */
    getSnapshot() {
        return {
            writes: parseInt(this.elements.writeCount.textContent),
            reads: parseInt(this.elements.readCount.textContent),
            writeAmp: parseFloat(this.elements.writeAmp.textContent),
            bloomFp: parseFloat(this.elements.bloomFp.textContent),
            timestamp: Date.now()
        };
    }

    /**
     * Create sparkline chart (mini trend graph)
     * For future enhancement
     */
    createSparkline(container, data, color = '#3b82f6') {
        // Simple sparkline implementation
        const width = container.offsetWidth;
        const height = 40;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        
        const points = data.map((value, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((value - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');
        
        container.innerHTML = `
            <svg width="${width}" height="${height}" class="sparkline">
                <polyline 
                    points="${points}" 
                    fill="none" 
                    stroke="${color}" 
                    stroke-width="2"
                />
            </svg>
        `;
    }

    /**
     * Highlight metric temporarily
     */
    highlightMetric(metricName, duration = 1000) {
        const element = this.elements[metricName];
        if (!element) return;
        
        const card = element.closest('.bg-gray-800');
        if (card) {
            card.classList.add('glow-blue');
            setTimeout(() => {
                card.classList.remove('glow-blue');
            }, duration);
        }
    }

    /**
     * Show metric tooltip
     */
    showTooltip(metricName, message) {
        const element = this.elements[metricName];
        if (!element) return;
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute bg-gray-900 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700 z-50';
        tooltip.textContent = message;
        tooltip.style.bottom = '100%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%) translateY(-5px)';
        
        const container = element.closest('.bg-gray-800');
        container.style.position = 'relative';
        container.appendChild(tooltip);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            tooltip.remove();
        }, 3000);
    }
}