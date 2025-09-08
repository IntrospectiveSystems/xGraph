const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const EventEmitter = require('events');

class xGraphSpawner extends EventEmitter {
	constructor(options = {}) {
		super();
		this.options = options;
		this.processes = new Map();
		this.nextId = 1;
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
		const processId = this.nextId++;
		const {
			configPath = './config.json',
			cwd = process.cwd(),
			websocketPort,
			env = {},
			silent = false,
			verbose = false,
			debug = false
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
		const args = ['execute'];
		
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

		// Add WebSocket port to environment
		const processEnv = {
			...process.env,
			...env,
			XGRAPH_WEBSOCKET_PORT: wsPort.toString(),
			XGRAPH_SPAWNED: 'true'
		};

		// Spawn the xgraph process
		const child = spawn('node', [xgraphPath, ...args], {
			cwd: cwd,
			env: processEnv,
			stdio: silent ? 'pipe' : 'inherit'
		});

		const processInfo = {
			id: processId,
			child,
			wsPort,
			config: config,
			startTime: Date.now()
		};

		this.processes.set(processId, processInfo);

		// Handle process events
		child.on('exit', (code, signal) => {
			this.emit('processExit', { processId, code, signal });
			this.processes.delete(processId);
		});

		child.on('error', (error) => {
			this.emit('processError', { processId, error });
		});

		if (silent) {
			child.stdout.on('data', (data) => {
				this.emit('processOutput', { processId, type: 'stdout', data: data.toString() });
			});

			child.stderr.on('data', (data) => {
				this.emit('processOutput', { processId, type: 'stderr', data: data.toString() });
			});
		}

		this.emit('processSpawned', { 
			processId, 
			wsPort, 
			pid: child.pid,
			config 
		});

		return {
			processId,
			wsPort,
			pid: child.pid,
			kill: () => this.kill(processId),
			getInfo: () => this.getProcessInfo(processId)
		};
	}

	kill(processId, signal = 'SIGTERM') {
		const processInfo = this.processes.get(processId);
		if (!processInfo) {
			throw new Error(`Process ${processId} not found`);
		}

		processInfo.child.kill(signal);
		return true;
	}

	killAll(signal = 'SIGTERM') {
		const processIds = Array.from(this.processes.keys());
		processIds.forEach(id => this.kill(id, signal));
		return processIds.length;
	}

	getProcessInfo(processId) {
		const processInfo = this.processes.get(processId);
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
}

module.exports = xGraphSpawner;