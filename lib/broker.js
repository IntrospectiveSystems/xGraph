#!/usr/bin/env node

const log = new (require('signale').Signale)({
	disabled: false,
	interactive: false,
	stream: process.stdout,
	types: {
		v: {
			badge: '',
			color: 'grey',
			label: 'verbose'
		},
		d: {
			badge: '',
			color: 'magenta',
			label: 'debug'
		},
		i: {
			badge: '',
			color: 'cyan',
			label: 'info'
		},
		w: {
			badge: '',
			color: 'yellow',
			label: 'warning'
		},
		e: {
			badge: '',
			color: 'red',
			label: 'error'
		}
	}
});
const CacheInterface = require('./Cache.js');
const Nexus = require('./Nexus.js');
const tmp = require('tmp');
const path = require('path');
const { modDefinition } = require('./xgrl.js');
let configOptions;


module.exports = {
	retrieveModule
};

async function retrieveModule(url, module, version, options) {
	configOptions = options;
	try {
		// log.v(`Creating Request for ${module}`);
		let modRequest = await createModRequest(url, module, version);
		// log.v(`Requesting ${module} from ${url}: \n${JSON.stringify(modRequest, null, 2)}`);
		let zipBuffer64 = await sendRequest(modRequest);
		return zipBuffer64;
	} catch (e) {
		throw e;
	}
}

async function createModRequest(url, module, version) {
	//backwards compatability
	if (typeof url == 'object') {
		// log.w('Source Objects are deprecated, please convert to a uri');
		url = `tcp://${url.Host}:${url.Port}`;
	}

	let modRequest = {
		Module: module,
		Source: url,
		Version: version || undefined
	};

	return modRequest;
}


/**
	* For loading modules
	* Modules come from a defined broker, or disk depending on the module definition
	* @param {Object} modRequest
	* @param {String} modRequest.Module the dot notation of the module name
	* @param {String} modRequest.Source the source Broker or path reference for the module
	* @param {Function} fun  the callback has form (error, module.json)
	*/
async function sendRequest(modRequest) {
	let modnam = modRequest.Module;
	let source = modRequest.Source;

	let cmd = {
		Cmd: 'GetModule',
		Name: modnam,
		// eventually tagged versions will be a thing and we can send latest to the broker
		// replace undefined with 'latest';
		Version: ('Version' in modRequest) ? modRequest.Version : undefined,
		Passport: {
			Disp: 'Query',
			Pid: '0'.repeat(32)
		}
	};

	try {
		// "exmaple.com:23897"
		let protocolObject = await modDefinition(source);
		let _ = await loadModule(protocolObject, cmd);
		// log.d(modRequest.Module, modRequest.Source, typeof _);
		return _;
	} catch (e) {
		throw e;
		// log.e(e);
		//TODO think about this one.
		// process.exit(1);
		// if (e.code != 0) {
		// 	return (e.text);
		// }
	}


	/**
		* takes a protocol object, from the server, , an arguments array for the connection
		* and a module request command. 
		* sends the command to the xgrl and returns the results.
		*/
	function loadModule(protocolObject, cmd) {
		// TODO do tmp with promises betterer
		return new Promise((res, rej) => {
			tmp.dir(async (err, dir, cleanupCallback) => {
				if (err) throw err;

				let cachePath = path.join(dir, 'cache');
				let proxyPid = '0'.repeat(32);

				// create the cache on disk
				let cache = new CacheInterface({
					path: cachePath,
					// log
					// uncomment for cache interface debugging...
				});

				// add the proxy to it
				await cache.addModule(protocolObject.moduleDefinition.Module, protocolObject.zip);

				if ('config' in protocolObject && (protocolObject.config != undefined)) {
					for (let key of protocolObject.config) {
						protocolObject.moduleDefinition.Par[key] = configOptions[key.toLowerCase()];
					}
				}

				// create an instance of it, with a pid we can
				// reference later
				await cache.createInstance(protocolObject.moduleDefinition, proxyPid);
				// show its tree
				// log.v(tree.sync(cachePath, '**/*'));

				let system = new Nexus({
					cache: cachePath,
					silent: true,
					// logleveldebug: true
				});

				// log.v(`Booting Module Retrieval Subsystem: ${cmd.Name}`);

				let hooks = await system.boot();
				let response = await new Promise(res => {
					hooks.send(cmd, proxyPid, (err, cmd) => {
						hooks.stop(0);
						res({ err, cmd });
					});
				});

				if (response.err) {
					rej(response.err);
				}

				// log.v(`Module ${cmd.Name} retrieved, shutting down Subsystem`);

				// cleanup, our job here is DONE!
				cache.delete();
				// Manual cleanup
				cleanupCallback();

				// return the module from the command, in base64 form!
				return res(response.cmd.Module);
			});
		});
	}
}