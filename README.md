# Data Structures and Algorithms Visualization

This project is an interactive web-based visualization tool for advanced data structures and algorithms, focusing on Log-Structured Merge Trees (LSM Trees), Bloom Filters, Skip Lists, and related concepts.

## Features

- **LSM Tree Visualization**: Interactive demonstration of LSM Tree operations including compaction and SSTable management
- **Bloom Filter Implementation**: Visual representation of Bloom Filter's probabilistic data structure
- **Skip List Navigation**: Step-by-step visualization of Skip List operations
- **Performance Metrics**: Real-time analysis of algorithmic complexity and performance
- **Query Tracing**: Visual tracking of query execution paths
- **Storage Inspector**: Real-time inspection of data structure storage states

## Project Structure

```
├── index.html           # Main entry point of the application
├── css/
│   └── custom.css      # Custom styling for the visualization
├── js/
│   ├── main.js         # Main application logic
│   ├── engine/         # Core data structure implementations
│   │   ├── Bloomfilter.js
│   │   ├── Compaction.js
│   │   ├── LSMTree.js
│   │   ├── Skiplist.js
│   │   └── SSTable.js
│   ├── ui/            # User interface components
│   │   ├── animationengine.js
│   │   ├── metricsdashboard.js
│   │   ├── querytracer.js
│   │   ├── storageinspector.js
│   │   └── terminal.js
│   └── utils/         # Utility functions and helpers
│       ├── ComplexityAnalyzer.js
│       ├── HashFunctions.js
│       └── Logger.js
```

## Components

### Engine Components

- **LSM Tree**: Implementation of Log-Structured Merge Tree with support for efficient writes and compaction
- **Bloom Filter**: Space-efficient probabilistic data structure for membership queries
- **Skip List**: Probabilistic alternative to balanced trees with O(log n) operations
- **SSTable**: Sorted String Table implementation for persistent storage
- **Compaction**: Management of compaction strategies for LSM Tree

### UI Components

- **Animation Engine**: Handles smooth transitions and visual representations of operations
- **Metrics Dashboard**: Real-time performance monitoring and complexity analysis
- **Query Tracer**: Visual representation of query execution paths
- **Storage Inspector**: Interface for examining internal states of data structures
- **Terminal**: Interactive command interface for direct interaction with data structures

### Utility Components

- **Complexity Analyzer**: Runtime analysis and performance metrics calculation
- **Hash Functions**: Various hash function implementations for Bloom Filter
- **Logger**: Logging and debugging utility

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Use the interactive terminal or UI controls to experiment with different data structures

## Technical Details

- Built with vanilla JavaScript for optimal performance
- Uses HTML5 Canvas for visualizations
- Implements modern algorithmic concepts with focus on educational value
- Real-time complexity analysis and performance monitoring

## Educational Value

This project serves as an educational tool for understanding:
- Advanced data structure operations and internals
- Time and space complexity analysis
- Modern database concepts
- Algorithmic visualization techniques

## Performance Considerations

The implementation focuses on:
- Efficient memory usage through careful data structure design
- Optimized rendering for smooth visualizations
- Balanced trade-offs between performance and educational clarity

## Contributing

Contributions are welcome! Please feel free to submit pull requests or create issues for bugs and feature requests.

## License

[Add your chosen license here]