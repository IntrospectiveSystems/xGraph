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
const jszip = require('jszip');
const CacheInterface = require('./CacheInterface.js')
const Nexus = require('./Nexus.js');
const tmp = require('tmp');
const fs = require('fs');
const path = require('path');
const xgrl = require('./xgrl.js');


module.exports = {
	retrieveModule
};
// retrieveModule('tcp://modulebroker.xgraphdev.com:27000', 'xGraph.WebViewer');

async function retrieveModule(url, module, version) {
	try {
		log.v('Creating Request...');
		let modRequest = await createModRequest(url, module, version);
		log.v(`Requesting ${module} from ${url}`);
		let zipBuffer64 = await sendRequest(modRequest);
		return zipBuffer64;
	} catch (e) {
		log.e(`Failed to retreive ${module}`);
		log.e(e);
	}
}

async function createModRequest(url, module, version) {

	//backwards compatability
	if (typeof url == 'object') {
		log.w('Source Objects are deprecated, please convert to a uri');
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



	// the next 2 lines and if statement should be depricated as we move away from 
	// fs module loading. (All modules shall be retrieved from brokers)
	let protocol = source.split(/:\/\//)[0];
	let _domain = source.split(/:\/\//)[1];
	if (protocol.length > 1 && (_domain !== undefined)) {
		try {
			// "exmaple.com:23897"

			let protocolModuleDefinition = await xgrl(source);
			let _ = await loadModuleFromBroker(argsArr, protocolObj, cmd);
			// log.d(_);
			return _;
		} catch (e) {
			log.e(e);
			if (e.code != 0) {
				return (e.text);
			}
		}
	} else {
		let _ = await loadModuleFromDisk(source, modnam);
		// console.log(_);
		return _;
	}


	/**
		* takes a protocol object, from the server, , an arguments array for the connection
		* and a module request command. 
		* sends the command to the xgrl and returns the results.
		*/
	function loadModuleFromBroker(protocolModuleDefinition, cmd) {
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
				// zip is still base64 Buffer.from(zip, 'base64');
				await cache.addModule(protocolModuleDefinition.Module, protocolModuleDefinition.Zip);
				protocolModuleDefinition.Zip  = undefined;

				// create an instance of it, with a pid we can
				// reference later
				await cache.createInstance(protocolModuleDefinition, proxyPid);
				// show its tree
				// log.v(tree.sync(cachePath, '**/*'));

				// 
				let system = new Nexus({
					cache: cachePath,
					silent: true,
					// logleveldebug: true
				});

				log.v('Booting Module Retrieval Subsystem');

				let hooks = await system.boot();

				let response = await new Promise(res => {
					hooks.send(cmd, proxyPid, (err, cmd) => {
						hooks.stop(0);
						res({ err, cmd });
					});
				});

				if (response.err) {
					throw new Error(response.err);
				}

				log.v('Module retrieved, shutting down Subsystem');

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

/**
 * load module from disk
 */
async function loadModuleFromDisk(source, modnam) {
	return await (async () => {
		modnam = modnam.replace(/\./g, path.sep);
		let ModPath = path.resolve(path.join(source, modnam));
		//read the module from path in the local file system
		//create the Module.json and add it to ModCache
		let zipmod = new jszip();

		//recursively zip the module
		await zipDirChidren(zipmod, ModPath);

		// TODO wait...
		return await new Promise(res => {
			zipmod.generateAsync({ type: 'uint8array' }).then((dat, fail) => {
				if (fail) {
					log.w('Genesis failed to create zip.');
					return;
				}

				log.v(`${modnam} returned from local file system`);
				res(dat);
			});
		})

		async function zipDirChidren(ziproot, containingPath) {
			let files;
			try {
				files = fs.readdirSync(containingPath);
			} catch (err) {
				let output = err + ' \nModule "' + containingPath + '" not available';
				log.e(output);
				return (output);
			}
			if (!files) {
				let output = ' \nModule "' + containingPath + '" not available';
				log.e(output);
				return (output);
			}
			for (let ifile = 0; ifile < files.length; ifile++) {
				let file = files[ifile];
				let path = containingPath + '/' + file;
				let stat = await new Promise(async (res, rej) => {
					fs.lstat(path, (err, stat) => {
						if (err) rej(err);
						else res(stat);
					});
				});

				if (stat) {
					if (!stat.isDirectory()) {
						let dat;
						try {
							dat = fs.readFileSync(path);
						} catch (err) {
							log.e('loadModuleFromDisk: error reading file ' +
								`${path}: ${err}`);
						}
						ziproot.file(file, dat);
					} else {
						await zipDirChidren(ziproot.folder(file), path);
					}
				}
			}
		}
	})();
}