/**
 * AnimationEngine.js - Canvas-based Visualizations
 * 
 * Renders:
 * 1. Skip List structure (memtable)
 * 2. Bloom Filter bit array
 * 
 * Uses HTML5 Canvas for performance
 */

export class AnimationEngine {
    constructor(lsmTree) {
        this.lsmTree = lsmTree;
        
        // Canvas elements
        this.memtableCanvas = document.getElementById('memtable-canvas');
        this.bloomCanvas = document.getElementById('bloom-canvas');
        
        // Contexts
        this.memtableCtx = this.memtableCanvas.getContext('2d');
        this.bloomCtx = this.bloomCanvas.getContext('2d');
        
        // Animation state
        this.animationFrame = null;
        this.highlightedNodes = new Set();
        this.highlightedBits = new Set();
        
        this.setupCanvas();
        this.startAnimation();
    }

    /**
     * Setup canvas dimensions
     */
    setupCanvas() {
        // Memtable canvas
        const memtableRect = this.memtableCanvas.getBoundingClientRect();
        this.memtableCanvas.width = memtableRect.width * window.devicePixelRatio;
        this.memtableCanvas.height = memtableRect.height * window.devicePixelRatio;
        this.memtableCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Bloom canvas
        const bloomRect = this.bloomCanvas.getBoundingClientRect();
        this.bloomCanvas.width = bloomRect.width * window.devicePixelRatio;
        this.bloomCanvas.height = bloomRect.height * window.devicePixelRatio;
        this.bloomCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        const animate = () => {
            this.render();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * Stop animation
     */
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    /**
     * Main render function
     */
    render() {
        this.renderMemtable();
        this.renderBloomFilter();
    }

    /**
     * Render Skip List (Memtable) structure
     */
    renderMemtable() {
        const ctx = this.memtableCtx;
        const canvas = this.memtableCanvas;
        
        // Get skip list structure
        const state = this.lsmTree.getState();
        const structure = state.memtable.structure;
        
        // Calculate required width based on content
        const nodeWidth = 60;
        const levelHeight = 40;
        const leftMargin = 50;
        const nodeSpacing = 15;
        
        // Find max nodes in any level
        const maxNodes = structure.reduce((max, level) => Math.max(max, level.nodes.length), 0);
        const requiredWidth = leftMargin + (maxNodes * (nodeWidth + nodeSpacing)) + 20;
        
        // Get container dimensions
        const containerWidth = canvas.parentElement.clientWidth;
        const height = 192; // Fixed height (h-48 = 192px)
        
        // Use the larger of container width or required width
        const width = Math.max(containerWidth, requiredWidth);
        
        // Update canvas size if needed
        if (canvas.width !== width * window.devicePixelRatio || canvas.height !== height * window.devicePixelRatio) {
            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        
        // Clear canvas
        ctx.fillStyle = '#030712'; // gray-950
        ctx.fillRect(0, 0, width, height);
        
        if (structure.length === 0 || state.memtable.size === 0) {
            // Show empty state
            ctx.fillStyle = '#6b7280'; // gray-500
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Empty Memtable', width / 2, height / 2);
            return;
        }
        
        // Calculate layout
        const nodeHeight = 30;
        const topMargin = 10;
        
        // Draw each level
        structure.forEach((level, levelIndex) => {
            const y = topMargin + levelIndex * levelHeight;
            
            // Draw level label
            ctx.fillStyle = '#9ca3af'; // gray-400
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`L${level.level}`, leftMargin - 5, y + 20);
            
            // Draw nodes
            level.nodes.forEach((node, nodeIndex) => {
                const x = leftMargin + nodeIndex * (nodeWidth + nodeSpacing);
                
                // Check if highlighted
                const isHighlighted = this.highlightedNodes.has(node.key);
                
                // Draw node
                ctx.fillStyle = isHighlighted ? '#3b82f6' : '#1f2937'; // blue-500 or gray-800
                ctx.strokeStyle = isHighlighted ? '#60a5fa' : '#374151'; // blue-400 or gray-700
                ctx.lineWidth = 2;
                
                // Rounded rectangle
                this.roundRect(ctx, x, y, nodeWidth, nodeHeight, 4);
                ctx.fill();
                ctx.stroke();
                
                // Draw key text
                ctx.fillStyle = isHighlighted ? '#ffffff' : '#d1d5db'; // white or gray-300
                ctx.font = '11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(
                    node.key.length > 8 ? node.key.substring(0, 8) + '...' : node.key,
                    x + nodeWidth / 2,
                    y + nodeHeight / 2 + 4
                );
                
                // Draw pointer to next node
                if (nodeIndex < level.nodes.length - 1) {
                    const nextX = leftMargin + (nodeIndex + 1) * (nodeWidth + nodeSpacing);
                    ctx.strokeStyle = '#4b5563'; // gray-600
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + nodeWidth, y + nodeHeight / 2);
                    ctx.lineTo(nextX, y + nodeHeight / 2);
                    ctx.stroke();
                    
                    // Arrow head
                    ctx.beginPath();
                    ctx.moveTo(nextX - 5, y + nodeHeight / 2 - 3);
                    ctx.lineTo(nextX, y + nodeHeight / 2);
                    ctx.lineTo(nextX - 5, y + nodeHeight / 2 + 3);
                    ctx.stroke();
                }
            });
        });
        
        // Draw statistics
        ctx.fillStyle = '#6b7280'; // gray-500
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
            `${state.memtable.size} keys • ${structure.length} levels`,
            10,
            height - 5
        );
    }

    /**
     * Render Bloom Filter bit array
     */
    renderBloomFilter() {
        const ctx = this.bloomCtx;
        const canvas = this.bloomCanvas;
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;
        
        // Clear canvas
        ctx.fillStyle = '#030712'; // gray-950
        ctx.fillRect(0, 0, width, height);
        
        // Get first SSTable's bloom filter (if exists)
        const state = this.lsmTree.getState();
        const sstables = this.lsmTree.sstableManager.getLevel(0);
        
        if (sstables.length === 0) {
            // Show empty state
            ctx.fillStyle = '#6b7280'; // gray-500
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('No Bloom Filters yet', width / 2, height / 2);
            return;
        }
        
        // Get bloom filter from first SSTable
        const bloomFilter = sstables[0].bloomFilter;
        const bitArray = bloomFilter.getBitArray();
        
        // Calculate bit visualization
        const bitsPerRow = 64;
        const bitSize = Math.floor(width / bitsPerRow) - 1;
        const rows = Math.ceil(Math.min(bitArray.length, 512) / bitsPerRow); // Show max 512 bits
        
        const topMargin = 10;
        const leftMargin = 5;
        
        // Draw bits
        for (let i = 0; i < Math.min(bitArray.length, 512); i++) {
            const row = Math.floor(i / bitsPerRow);
            const col = i % bitsPerRow;
            
            const x = leftMargin + col * (bitSize + 1);
            const y = topMargin + row * (bitSize + 1);
            
            const isSet = bitArray[i] === 1;
            const isHighlighted = this.highlightedBits.has(i);
            
            // Draw bit
            if (isSet) {
                ctx.fillStyle = isHighlighted ? '#60a5fa' : '#3b82f6'; // blue-400 or blue-500
            } else {
                ctx.fillStyle = '#1f2937'; // gray-800
            }
            
            ctx.fillRect(x, y, bitSize, bitSize);
            
            // Draw border for highlighted bits
            if (isHighlighted) {
                ctx.strokeStyle = '#93c5fd'; // blue-300
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, bitSize, bitSize);
            }
        }
        
        // Draw statistics
        const fillPercentage = bloomFilter.getFillPercentage();
        const stats = bloomFilter.getStats();
        
        ctx.fillStyle = '#6b7280'; // gray-500
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
            `${stats.elementsAdded} elements • ${fillPercentage}% full • ${stats.numHashes} hashes`,
            10,
            height - 5
        );
    }

    /**
     * Helper: Draw rounded rectangle
     */
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * Highlight skip list node
     */
    highlightNode(key, duration = 1000) {
        this.highlightedNodes.add(key);
        setTimeout(() => {
            this.highlightedNodes.delete(key);
        }, duration);
    }

    /**
     * Highlight bloom filter bits
     */
    highlightBits(indices, duration = 1000) {
        indices.forEach(i => this.highlightedBits.add(i));
        setTimeout(() => {
            indices.forEach(i => this.highlightedBits.delete(i));
        }, duration);
    }

    /**
     * Animate insertion into skip list
     */
    animateInsert(key) {
        this.highlightNode(key, 800);
    }

    /**
     * Animate bloom filter add
     */
    animateBloomAdd(indices) {
        this.highlightBits(indices, 600);
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        this.highlightedNodes.clear();
        this.highlightedBits.clear();
    }

    /**
     * Take screenshot of canvas
     */
    screenshot(canvasName = 'memtable') {
        const canvas = canvasName === 'memtable' ? this.memtableCanvas : this.bloomCanvas;
        return canvas.toDataURL('image/png');
    }

    /**
     * Export visualization as image
     */
    exportImage(canvasName = 'memtable') {
        const dataUrl = this.screenshot(canvasName);
        const link = document.createElement('a');
        link.download = `${canvasName}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
    }
}