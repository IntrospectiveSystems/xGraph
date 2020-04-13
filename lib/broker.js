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
const tmp = require('tmp-promise');
const path = require('path');
const { getProtocolObject } = require('./xgrl.js');
let configOptions;


class Broker {
	constructor(xgrl, __options = {}) {
		log.d(`Construct Broker instance for ${xgrl}`);
		this.configOptions = __options;
		this.xgrl = xgrl;
		this.debug = __options.debug || false;
		this.startup = this.boot(xgrl);
	}

	async boot(xgrl) {
		
		const tmpDir = await tmp.dir();
		const dir = tmpDir.path;
		this.tmpCleanup = tmpDir.cleanup;
		const protocolObject = await getProtocolObject(xgrl);

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

		log.d(`Start Broker xgraph for ${xgrl}`);
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
			throw new Error(`Module ${moduleDefinition.Module} not returned ${
				}from ${this.xgrl}\n${response.err}`);

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
