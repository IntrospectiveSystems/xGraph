const WebSocket = require('ws');
const EventEmitter = require('events');
const uuid = require('uuid/v4');

class WebSocketServer extends EventEmitter {
	constructor(options = {}) {
		super();
		this.port = options.port || parseInt(process.env.XGRAPH_WEBSOCKET_PORT) || 8080;
		this.server = null;
		this.clients = new Map();
		this.messageHandlers = new Map();
		this.nexus = options.nexus || null;
		this.log = options.log || console;
	}

	start() {
		return new Promise((resolve, reject) => {
			try {
				this.server = new WebSocket.Server({ port: this.port });

				this.server.on('connection', (ws, req) => {
					const clientId = uuid();
					
					const client = {
						id: clientId,
						ws: ws,
						remoteAddress: req.socket.remoteAddress,
						connectedAt: new Date(),
						isAlive: true
					};

					this.clients.set(clientId, client);
					this.log.i(`WebSocket client connected: ${clientId} from ${client.remoteAddress}`);

					// Handle ping/pong for connection health
					ws.isAlive = true;
					ws.on('pong', () => {
						ws.isAlive = true;
					});

					// Handle incoming messages
					ws.on('message', (data) => {
						this.handleMessage(clientId, data);
					});

					// Handle client disconnect
					ws.on('close', () => {
						this.clients.delete(clientId);
						this.log.i(`WebSocket client disconnected: ${clientId}`);
						this.emit('clientDisconnected', { clientId });
					});

					ws.on('error', (error) => {
						this.log.e(`WebSocket client error (${clientId}):`, error);
						this.clients.delete(clientId);
					});

					this.emit('clientConnected', { clientId, client });
				});

				// Health check interval
				this.healthCheckInterval = setInterval(() => {
					this.server.clients.forEach((ws) => {
						if (!ws.isAlive) {
							return ws.terminate();
						}
						ws.isAlive = false;
						ws.ping();
					});
				}, 30000);

				this.server.on('listening', () => {
					this.log.i(`WebSocket server listening on port ${this.port}`);
					resolve(this.port);
				});

				this.server.on('error', (error) => {
					this.log.e('WebSocket server error:', error);
					reject(error);
				});

			} catch (error) {
				reject(error);
			}
		});
	}

	stop() {
		return new Promise((resolve) => {
			if (this.healthCheckInterval) {
				clearInterval(this.healthCheckInterval);
			}

			if (this.server) {
				this.server.close(() => {
					this.log.i('WebSocket server stopped');
					resolve();
				});
			} else {
				resolve();
			}
		});
	}

	handleMessage(clientId, data) {
		try {
			const message = JSON.parse(data);
			this.log.d(`Received message from ${clientId}:`, message);

			// Message format: { id, type, target, method, args, callback }
			const { id, type, target, method, args = [], callback } = message;

			switch (type) {
				case 'moduleCall':
					this.handleModuleCall(clientId, { id, target, method, args, callback });
					break;
				case 'broadcast':
					this.handleBroadcast(clientId, message);
					break;
				case 'response':
					this.handleResponse(clientId, message);
					break;
				default:
					this.log.w(`Unknown message type: ${type}`);
					this.sendError(clientId, id, `Unknown message type: ${type}`);
			}

		} catch (error) {
			this.log.e('Error parsing WebSocket message:', error);
			this.sendError(clientId, null, 'Invalid JSON message');
		}
	}

	async handleModuleCall(clientId, { id, target, method, args, callback }) {
		try {
			if (!this.nexus) {
				throw new Error('Nexus not available for module calls');
			}

			// Route the call through Nexus
			const result = await this.routeToModule(target, method, args);
			
			if (callback) {
				this.sendMessage(clientId, {
					id: id,
					type: 'response',
					result: result,
					callback: callback
				});
			}

		} catch (error) {
			this.log.e('Module call error:', error);
			this.sendError(clientId, id, error.message);
		}
	}

	async routeToModule(moduleName, methodName, args) {
		// This will be implemented when we integrate with Nexus
		// For now, we'll define the interface
		if (!this.nexus || typeof this.nexus.sendMessage !== 'function') {
			throw new Error('Nexus routing not available');
		}

		// Route through Nexus message system
		return new Promise((resolve, reject) => {
			const messageId = uuid();
			
			// Set up one-time response handler
			const responseHandler = (response) => {
				if (response.id === messageId) {
					this.removeListener('moduleResponse', responseHandler);
					if (response.error) {
						reject(new Error(response.error));
					} else {
						resolve(response.result);
					}
				}
			};

			this.on('moduleResponse', responseHandler);

			// Send message through Nexus
			try {
				this.nexus.sendMessage({
					id: messageId,
					target: moduleName,
					method: methodName,
					args: args,
					source: 'WebSocketServer'
				});
			} catch (error) {
				this.removeListener('moduleResponse', responseHandler);
				reject(error);
			}

			// Timeout after 30 seconds
			setTimeout(() => {
				this.removeListener('moduleResponse', responseHandler);
				reject(new Error('Module call timeout'));
			}, 30000);
		});
	}

	handleBroadcast(clientId, message) {
		// Broadcast to all other clients
		this.broadcast(message, clientId);
	}

	handleResponse(clientId, message) {
		// Handle responses from modules back to clients
		this.emit('moduleResponse', message);
	}

	sendMessage(clientId, message) {
		const client = this.clients.get(clientId);
		if (!client || client.ws.readyState !== WebSocket.OPEN) {
			this.log.w(`Cannot send message to client ${clientId}: client not available`);
			return false;
		}

		try {
			client.ws.send(JSON.stringify(message));
			return true;
		} catch (error) {
			this.log.e('Error sending message:', error);
			return false;
		}
	}

	sendError(clientId, messageId, error) {
		this.sendMessage(clientId, {
			id: messageId,
			type: 'error',
			error: error
		});
	}

	broadcast(message, excludeClientId = null) {
		let sent = 0;
		this.clients.forEach((client, clientId) => {
			if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
				if (this.sendMessage(clientId, message)) {
					sent++;
				}
			}
		});
		return sent;
	}

	// Method for modules to send responses back through WebSocket
	sendModuleResponse(messageId, result, error = null) {
		// Find the client that made the original request
		// In a more sophisticated implementation, we'd track request origins
		this.broadcast({
			id: messageId,
			type: 'response',
			result: error ? null : result,
			error: error
		});
	}

	getConnectedClients() {
		return Array.from(this.clients.values()).map(client => ({
			id: client.id,
			remoteAddress: client.remoteAddress,
			connectedAt: client.connectedAt,
			isAlive: client.isAlive
		}));
	}

	getClientCount() {
		return this.clients.size;
	}

	setNexus(nexus) {
		this.nexus = nexus;
	}
}

module.exports = WebSocketServer;