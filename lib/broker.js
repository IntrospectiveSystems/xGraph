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
const Nexus = require('./Nexus.js')
const tmp = require('tmp');
const fs = require('fs');
const path = require('path');
const https = require('https');
const appdata = path.join((process.env.APPDATA || path.join(process.env.HOME,
	(process.platform == 'darwin' ? 'Library/Preferences' : ''))), '.xgraph');
log.v(appdata);
try { fs.mkdirSync(appdata); } catch (e) { ''; }

module.exports = {
	retrieveModule
}
// retrieveModule('tcp://modulebroker.xgraphdev.com:27000', 'xGraph.WebViewer');

async function retrieveModule(url, module, version) {
	try {
		log.v('Creating Request...');
		let modRequest = await createModRequest(url, module, version);
		log.v(`Sending request for ${module} to ${url}`);
		let zipBuffer = await sendRequest(modRequest);
		return zipBuffer;
		// log.d(zipBuffer)
	} catch(e) {
		log.e(`Failed to retreive ${module}`);
		log.e(e);
	}
}

async function createModRequest(url, module, version) {
	//backwards compatability
	if(typeof url == 'object') {
		log.w('Source Objects are deprecated, please convert to a uri');
		url = `tcp://${url.Host}:${url.Port}`;
	}
	// let folder = moduleKeys[ifolder];
	// if (!(Modules[folder].Source in Config.Sources)){
	// 	rejectSetup(`Source ${Modules[folder].Source} not defined in Config.Sources`);
	// 	return;
	// }
	let modRequest = {
		Module: module,
		Source: url,
		Version: version || undefined
	};

	return modRequest;
}

/**
	* load protocol to access modules
	*/
function getProtocolModule(protocol) {
	return new Promise(function (resolve, reject) {
		let cacheFilepath = path.join(appdata, protocol);
		if (fs.existsSync(cacheFilepath)) {
			return resolve(JSON.parse(fs.readFileSync(cacheFilepath).toString()));
		}

		let options = {
			host: 'protocols.xgraphdev.com',
			port: 443,
			path: '/' + protocol,
			method: 'GET',
			rejectUnauthorized: false,
		};

		let req = https.request(options, function (res) {
			res.setEncoding('utf8');
			let response = '';
			res.on('data', function (chunk) {
				response += chunk;
			});
			res.on('end', _ => {
				try {
					resolve(JSON.parse(response));
					try{ fs.writeFileSync(cacheFilepath, response);} catch(e){reject({
						code:1,
						text:`fail to save protocol at ${cacheFilepath}`+
						'\n delete file and try again'
					});}
				} catch (e) {
					reject({ code: 0, text: 'try and retrieve locally' });
				}
			});
		});

		req.on('error', function (e) {
			log.e('problem with request: ' + e.message);
			reject({ code: 1, text: 'problem with request: ' + e.message });
		});

		// write data to request body
		req.end();
	});
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

	if (typeof source == 'string') {
		let protocol = source.split(/:\/\//)[0];
		let _domain = source.split(/:\/\//)[1];
		let cmd = {};
		cmd.Cmd = 'GetModule';
		cmd.Name = modnam;
		cmd.Passport = {
			Disp: 'Query',
			Pid: '0'.repeat(32)
		};
		if ('Version' in modRequest) {
			cmd.Version = modRequest.Version;
		}
		modRequest.Version = 'latest';

		// log.d(protocol, _domain)
		if (protocol.length > 1 && (_domain !== undefined)) {
			try {
				// "exmaple.com:23897"
				let argumentString = source.replace(/[a-zA-Z]*:\/\//, '');
				let argsArr = argumentString.split(/:/);
				let protocolObj = await getProtocolModule(protocol);
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
			let _ =  await loadModuleFromDisk(source, modnam);
			// console.log(_);
			return _;
		}
	}

	/**
		* takes a protocol object, from the server, , an arguments array for the connection
		* and a module request command. 
		* sends the command to the xurl and returns the results.
		*/
	function loadModuleFromBroker(args, protocolObject, cmd) {
		// TODO do tmp with promises betterer
		return new Promise((res, rej) => {
			tmp.dir(async (err, dir, cleanupCallback) => {
				if (err) throw err;

				let cachePath = path.join(dir, 'cache');
				let zip = Buffer.from(protocolObject.Module, 'base64');
				let parString = JSON.stringify(protocolObject.Par, null, 2);
				let proxyPid = '0'.repeat(32);

				// TODO DO THIS PARSE WAY DIFFERENT AND ALLOW FOR DEFAULTS
				for (let i = 0; i < Math.max(args.length, 2); i++) {
					parString = parString.replace(`%${i + 1}`, args[i] || 27000);
				}

				let par = JSON.parse(parString);
				par.Module = 'BrokerProxy';

				// create the cache on disk
				let cache = new CacheInterface({
					path: cachePath,
					// log
					// uncomment for cache interface debugging...
				});

				// add the proxy to it
				await cache.addModule('BrokerProxy', zip);

				// create an instance of it, with a pid we can
				// reference later
				await cache.createInstance({
					Module: 'BrokerProxy',
					Par: par
				}, proxyPid);

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

				// return the module from the command, in buffer form!
				return res(Buffer.from(response.cmd.Module, 'base64'));
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