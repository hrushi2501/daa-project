# Quick Start Guide

## Running the Application

### Method 1: Direct Browser Access (Simplest)

1. Navigate to the project directory
2. Double-click `index.html` or right-click and select "Open with" → Your browser
3. The application will load immediately

### Method 2: Local Web Server (Recommended for Development)

Using npm:
```bash
npm install
npm start
```

Using Python:
```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

Using Node.js http-server:
```bash
npx http-server -c-1 -p 8080
```

Then open `http://localhost:8080` in your browser.

## First Steps

### 1. Run the Demo

Click the **"Run Demo"** button at the top right to see the LSM Tree in action with sample data.

### 2. Try Terminal Commands

Type commands in the terminal at the left side:

```
PUT user:001 {"name":"Alice","age":25}
GET user:001
STATS
```

### 3. Watch the Visualizations

- **Memtable (Skip List)**: Top canvas shows the in-memory structure
- **Bloom Filter**: Middle canvas displays bit array visualization  
- **SSTables**: Bottom section shows disk storage levels (L0, L1, L2...)
- **Metrics Dashboard**: Top metrics show write/read operations, write amplification, and Bloom filter stats
- **Query Tracer**: Right panel shows detailed query execution paths

## Example Commands

### Basic Operations

```bash
# Insert data
PUT product:001 {"name":"Laptop","price":999}
PUT product:002 {"name":"Mouse","price":29}
PUT product:003 {"name":"Keyboard","price":79}

# Read data
GET product:001

# Check statistics
STATS

# Delete data
DELETE product:002
```

### Advanced Operations

```bash
# Trigger compaction manually
COMPACT 0

# Clear all data
CLEAR

# View help
HELP
```

## Understanding the Visualizations

### Skip List (Memtable)
- Shows nodes organized in levels
- Higher levels = express lanes for faster search
- Blue highlighted nodes indicate recent operations

### Bloom Filter
- Blue squares = set bits (key may exist)
- Gray squares = unset bits
- More blue = higher fill rate

### SSTables
- L0: Fresh data from memtable flushes
- L1, L2, L3: Compacted, sorted data
- Color-coded progress bars show fill levels

### Metrics
- **Write Ops**: Total PUT/DELETE operations
- **Read Ops**: Total GET operations  
- **Write Amp**: How many times data is rewritten (target: <10x)
- **Bloom FP**: False positive rate (target: <1%)

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Clear terminal output
- `↑` `↓` - Navigate command history
- `Tab` - Autocomplete commands

## Console Demos

Open browser DevTools (F12) and try these demos:

```javascript
// Run automated demos
Demo.lsmTreeDemo()
Demo.bloomFilterDemo()
Demo.skipListDemo()

// Stress test
Demo.stressTest(100)

// Hash function analysis
Demo.hashFunctionDemo()

// Complexity analysis
Demo.complexityDemo()
```

## Troubleshooting

### Page doesn't load properly
- Make sure you're using a modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- Check browser console (F12) for errors
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Visualizations not updating
- Check that canvases are visible
- Try resizing the browser window
- Click "Clear Data" and try again

### Commands not working
- Make sure the terminal input is focused
- Check command syntax with `HELP`
- Try refreshing the page

## Next Steps

1. Experiment with different data patterns
2. Watch how compaction works when memtable fills up
3. Compare Bloom filter effectiveness with different data sizes
4. Observe write amplification under different workloads
5. Try the console demos for automated testing

## Learning Resources

- **LSM Trees**: Used in LevelDB, RocksDB, Cassandra, HBase
- **Bloom Filters**: Fast membership testing with controlled false positives
- **Skip Lists**: Redis uses skip lists for sorted sets
- **Write Amplification**: Key metric in write-optimized databases

Enjoy exploring data structures! 🚀
