# Data Structures and Algorithms Visualization

This project is an interactive web-based visualization tool for advanced data structures and algorithms, focusing on Log-Structured Merge Trees (LSM Trees), Bloom Filters, Skip Lists, and related concepts.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hrushi2501/daa-project)

## 🌐 Live Demo

**[View Live Demo on Vercel](https://your-deployment-url.vercel.app)** _(Update this URL after deployment)_

## Features

- **LSM Tree Visualization**: Interactive demonstration of LSM Tree operations including compaction and SSTable management
- **Bloom Filter Implementation**: Visual representation of Bloom Filter's probabilistic data structure
- **Skip List Navigation**: Step-by-step visualization of Skip List operations
- **Performance Metrics**: Real-time analysis of algorithmic complexity and performance
- **Query Tracing**: Visual tracking of query execution paths
- **Storage Inspector**: Real-time inspection of data structure storage states
- **Interactive Terminal**: Command-line interface for direct interaction with data structures

## Quick Start

### Option 1: Open Directly in Browser (No Installation Required)

1. Clone or download this repository
2. Open `index.html` in a modern web browser (Chrome, Firefox, Edge, or Safari)
3. Start experimenting with the data structures!

### Option 2: Use Local Web Server (Recommended)

```bash
# Install dependencies (optional, for development tools)
npm install

# Start local server
npm start

# Or use any other web server, e.g.:
python -m http.server 8080
# Then open http://localhost:8080 in your browser
```

## Project Structure

```text
├── index.html           # Main entry point of the application
├── package.json         # Project metadata and dependencies
├── css/
│   └── custom.css      # Custom styling and animations
├── js/
│   ├── main.js         # Main application logic and orchestration
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

## How to Use

### Terminal Commands

The application includes an interactive terminal. Here are the available commands:

- **PUT key value** - Insert or update a key-value pair
  ```text
  PUT user:001 {"name":"Alice","age":25}
  ```

- **GET key** - Retrieve value by key
  ```text
  GET user:001
  ```

- **DELETE key** - Mark key as deleted (tombstone)
  ```text
  DELETE user:001
  ```

- **COMPACT level** - Trigger manual compaction
  ```text
  COMPACT 0
  ```

- **STATS** - Display system statistics and metrics

- **CLEAR** - Clear all data

- **HELP** - Show help message

### Run Demo

Click the "Run Demo" button to see the LSM Tree in action with sample data.

### Keyboard Shortcuts

- `Ctrl/Cmd + K` - Clear terminal
- `↑/↓` - Navigate command history
- `Tab` - Autocomplete commands

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

## Technical Details

- Built with vanilla JavaScript (ES6+ modules) for optimal performance
- Uses HTML5 Canvas for visualizations
- Implements modern algorithmic concepts with focus on educational value
- Real-time complexity analysis and performance monitoring
- No build step required - runs directly in modern browsers

## Educational Value

This project serves as an educational tool for understanding:

- Advanced data structure operations and internals
- Time and space complexity analysis
- Modern database concepts (LSM Trees used in LevelDB, RocksDB, Cassandra)
- Algorithmic visualization techniques

## Performance Considerations

The implementation focuses on:

- Efficient memory usage through careful data structure design
- Optimized rendering for smooth visualizations
- Balanced trade-offs between performance and educational clarity

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

Contributions are welcome! Please feel free to submit pull requests or create issues for bugs and feature requests.

## License

MIT License - See LICENSE file for details
