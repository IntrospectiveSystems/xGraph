const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const EventEmitter = require('events');

class xGraphSpawner extends EventEmitter {
	constructor(options = {}) {
		super();
		this.options = options;
		this.processes = new Map();
		this.xID = Math.random().toString(36).substring(2, 15);
	}

	async getAvailablePort(startPort = 8080, maxRetries = 100) {
		for (let port = startPort; port < startPort + maxRetries; port++) {
			if (await this.isPortAvailable(port)) {
				return port;
			}
		}
		throw new Error(`No available ports found between ${startPort} and ${startPort + maxRetries}`);
	}

	isPortAvailable(port) {
		return new Promise((resolve) => {
			const server = net.createServer();
			
			server.listen(port, () => {
				server.close(() => resolve(true));
			});
			
			server.on('error', () => resolve(false));
		});
	}

	async spawn(config = {}) {
		const {
			configPath = './config.json',
			cwd = process.cwd(),
			websocketPort,
			env = {},
			silent = false,
			verbose = false,
			debug = false,
			channel = false,
			xID = this.xID
		} = config;

		// Determine WebSocket port
		let wsPort;
		if (websocketPort) {
			if (!(await this.isPortAvailable(websocketPort))) {
				throw new Error(`Port ${websocketPort} is not available`);
			}
			wsPort = websocketPort;
		} else {
			wsPort = await this.getAvailablePort();
		}

		// Build xgraph command arguments
		const xgraphPath = path.resolve(__dirname, '../src/xgraph.js');
		const args = ['reset'];

		if (configPath) {
			args.push('--config', configPath);
		}
		if (cwd) {
			args.push('--cwd', cwd);
		}
		if (silent) {
			args.push('--silent');
		}
		if (verbose) {
			args.push('--verbose');
		}
		if (debug) {
			args.push('--debug');
		}
		if (channel) {
			args.push('--channel');
		}

		// Add WebSocket port to environment
		const processEnv = {
			...process.env,
			...env,
			XGRAPH_WEBSOCKET_PORT: wsPort.toString(),
			XGRAPH_SPAWNED: 'true'
		};

		// Determine stdio configuration based on flags
		let stdioConfig;
		if (silent) {
			stdioConfig = 'pipe'; // Pipe but don't process
		} else if (channel) {
			stdioConfig = 'pipe'; // Pipe for processing
		} else {
			stdioConfig = 'inherit'; // Direct output to console
		}

		// Spawn the xgraph process
		const child = spawn('node', [xgraphPath, ...args], {
			cwd: cwd,
			env: processEnv,
			stdio: stdioConfig
		});

		const processInfo = {
			id: xID,
			child,
			wsPort,
			config: config,
			startTime: Date.now(),
			logs: [], // Buffer for storing log entries when channel is enabled
			maxLogEntries: 1000 // Limit log buffer size
		};

		this.processes.set(xID, processInfo);

		// Handle process events
		child.on('exit', (code, signal) => {
			this.emit('xChildExit', { xID, code, signal });
			this.processes.delete(xID);
		});

		child.on('error', (error) => {
			this.emit('xChildError', { xID, error });
		});

		// Handle stdout/stderr based on flags
		if (channel) {
			// Channel mode: buffer logs and emit for external processing
			child.stdout.on('data', (data) => {
				const logEntry = {
					timestamp: Date.now(),
					type: 'stdout',
					data: data.toString(),
					xID
				};
				
				// Add to buffer with size limit
				processInfo.logs.push(logEntry);
				if (processInfo.logs.length > processInfo.maxLogEntries) {
					processInfo.logs.shift(); // Remove oldest entry
				}
				
				this.emit('xChildOutput', logEntry);
			});

			child.stderr.on('data', (data) => {
				const logEntry = {
					timestamp: Date.now(),
					type: 'stderr',
					data: data.toString(),
					xID
				};
				
				processInfo.logs.push(logEntry);
				if (processInfo.logs.length > processInfo.maxLogEntries) {
					processInfo.logs.shift();
				}
				
				this.emit('xChildOutput', logEntry);
			});
		} else if (silent) {
			// Silent mode: pipe stdout/stderr but don't process or emit anything
			// Data is discarded - no logging, no events
		}
		// If neither silent nor channel, stdio is 'inherit' so output goes directly to console

		this.emit('xChildSpawned', { 
			xID, 
			wsPort, 
			pid: child.pid,
			config 
		});

		return {
			xID,
			wsPort,
			pid: child.pid,
			kill: () => this.kill(xID),
			getInfo: () => this.getProcessInfo(xID)
		};
	}

	kill(xID, signal = 'SIGTERM') {
		const processInfo = this.processes.get(xID);
		if (!processInfo) {
			throw new Error(`Process ${xID} not found`);
		}

		processInfo.child.kill(signal);
		return true;
	}

	killAll(signal = 'SIGTERM') {
		const xIDs = Array.from(this.processes.keys());
		xIDs.forEach(id => this.kill(id, signal));
		return xIDs.length;
	}

	getProcessInfo(xID) {
		const processInfo = this.processes.get(xID);
		if (!processInfo) {
			return null;
		}

		return {
			id: processInfo.id,
			pid: processInfo.child.pid,
			wsPort: processInfo.wsPort,
			config: processInfo.config,
			startTime: processInfo.startTime,
			uptime: Date.now() - processInfo.startTime,
			running: !processInfo.child.killed
		};
	}

	listProcesses() {
		return Array.from(this.processes.keys()).map(id => this.getProcessInfo(id));
	}

	getProcessCount() {
		return this.processes.size;
	}

	// Get logs for a specific process (only available when channel mode was used)
	getLogs(xID, limit = 100) {
		const processInfo = this.processes.get(xID);
		if (!processInfo) {
			return null;
		}
		
		return processInfo.logs.slice(-limit);
	}

	// Get all logs from all processes
	getAllLogs(limit = 100) {
		const allLogs = [];
		this.processes.forEach((processInfo) => {
			allLogs.push(...processInfo.logs);
		});
		
		// Sort by timestamp and return most recent
		return allLogs
			.sort((a, b) => a.timestamp - b.timestamp)
			.slice(-limit);
	}

	// Clear logs for a specific process
	clearLogs(xID) {
		const processInfo = this.processes.get(xID);
		if (processInfo) {
			processInfo.logs = [];
			return true;
		}
		return false;
	}

	// Stream logs to external handler (for WebSocket or other integrations)
	streamLogsToHandler(handler) {
		this.on('xChildOutput', handler);
		return () => this.removeListener('xChildOutput', handler);
	}
}

module.exports = xGraphSpawner;