#!/usr/bin/env node


const createLogger = require('./Logger.js');
const CacheInterface = require('./Cache.js');
const Nexus = require('./Nexus.js');
const tmp = require('tmp-promise');
const path = require('path');
const { getProtocolObject } = require('./xgrl.js');
let configOptions, log;


class Broker {
	constructor(xgrl, __options = {}) {
		log = (('logger' in __options) && (__options['logger'])) ? 
			__options.logger : createLogger(__options);
		log.v(`Constructing broker for Source ${xgrl}`);
		this.configOptions = __options;
		this.xgrl = xgrl;
		this.debug = __options.debug || false;
		this.startup = this.boot(xgrl);
	}

	async boot(xgrl) {
		
		const tmpDir = await tmp.dir();
		const dir = tmpDir.path;
		this.tmpCleanup = tmpDir.cleanup;
		const protocolObject = await getProtocolObject(xgrl, this.configOptions);

		const cachePath = path.join(dir, 'cache');
		this.proxyPid = '0'.repeat(32);

		// create the cache on disk
		const cache = new CacheInterface({
			path: cachePath,
			// log
			// uncomment for cache interface debugging...
		});

		this.cache = cache;

		// add the proxy to it
		await cache.addModule(protocolObject.moduleDefinition.Module, protocolObject.zip);

		if ('config' in protocolObject && (protocolObject.config != undefined)) {
			for (const key of protocolObject.config) {
				protocolObject.moduleDefinition.Par[key] = this.configOptions[key.toLowerCase()];
			}
		}

		// create an instance of it, with a pid we can
		// reference later
		await cache.createInstance(protocolObject.moduleDefinition, this.proxyPid);
		// show its tree
		// log.v(tree.sync(cachePath, '**/*'));

		log.v(`Starting broker for Source ${xgrl}`);
		this.system = new Nexus({
			cache: cachePath,
			silent: true,
			// logleveldebug: true
		});

		this.hooks = await this.system.boot();
	}

	async getModule(moduleDefinition) {
		// console.dir({
		// 	...moduleDefinition,
		// 	xgrl: this.xgrl
		// })

		let hooks = await this.system.boot();
		const request = {
			Cmd: 'GetModule',
			Name: moduleDefinition.Module,
			Version: moduleDefinition.Version || undefined
		};
		
		let response = await new Promise(res => {
			hooks.send(request, this.proxyPid, (err, cmd) => {
				hooks.stop(0);
				res({ err, cmd });
			});
		});

		if (response.err) 
			throw new Error(`Module ${moduleDefinition.Module} not returned from ${this.xgrl}\n${response.err}`);

		//console.log(`${response.cmd.Name} => ${response.cmd.Module.length}`);
		return response.cmd.Module;

		// console.dir(response);
	}

	async cleanup() {
		this.hooks.stop();
		this.cache.delete();
		this.tmpCleanup();
	}
}

module.exports = {
	Broker
};
