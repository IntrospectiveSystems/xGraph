/* eslint no-console: 0 */  // --> OFF

const Nexus = require('../lib/Nexus.js'); 
const {createLogger} = require('../lib/Logger.js');
const CacheInterface = require('../lib/Cache.js');
const url = new URL(location.href);
const mode = url.searchParams.get('mode') || 'execute';
const idb = require('idb');
const urlOptions = {};
const jszip = require('jszip');
const _ = require('lodash');

console.dir(_);

for(let key of url.searchParams.keys()) {
	urlOptions[key] = url.searchParams.get(key);
}
const __options = {
	// defaults
	cache: 'cache',
	cwd: '/',
	// custom url params
	...urlOptions
};
const log = createLogger(__options);

(async () => {
	// for example localhost:5000/?cache=CustomCacheFolder

	// console.log(__options);

	if (mode === 'reset') {
		await idb.deleteDb(__options.cache);
		url.searchParams.set('mode', 'compile');
		location.href = url.href;
		return;
	} else if (mode === 'compile') {
		await Promise.resolve();
		url.searchParams.set('mode', 'deploy');
		location.href = url.href;
		await compileFromWebScoket();
		return;
	} else if (mode === 'deploy') {
		const system = new Nexus(__options);
		system.boot();
	} else if (mode === 'test') {
		await idb.deleteDb(__options.cache);
		await compileFromWebScoket();
		const system = new Nexus(__options);
		system.boot();
	}


})();

async function compileFromWebScoket() {

	const {Cache: modulesZip, Config: config} = await receiveConfig();

	const cache = new CacheInterface({
		path: __options.cache
	});
	await cache.startup;
	await addModules(modulesZip);
	await createInstances(config);

	// debugger;

	function receiveConfig() {
		return new Promise(resolve => {
			// const socket = new WebSocket(`ws://${location.host}`);
			const socket = new WebSocket('ws://localhost:8080');
			socket.addEventListener('open', function () {
				'wssopen' in window ? location.reload() : window.wssopen = true;
				socket.send(`\x02${JSON.stringify({
					Cmd: 'GetConfig',
					// Path: location.pathname.substr(1).toLowerCase()
					Path: 'workspace' 
				})}\x03`);
			});
			function message(msg) {
				let obj = JSON.parse(msg.data);
				let size = obj.Cache.length;
				size /= 1024;
				log.d(`b64 Module Zip: ${Math.floor(size)} KiB`);
				log.d(`binary Module Zip: ${Math.floor((size/4)*3)} KiB`);
				console.dir(obj)
				resolve(obj);
				socket.removeEventListener('message', message);
			}
			socket.addEventListener('message', message);
		});
	}
	
	async function addModules(modulesZip) {
		const modules = new jszip();
		// debugger;

		console.time('cache zip');
		await modules.loadAsync(modulesZip, {
			base64: true
		});
		console.timeEnd('cache zip');

		for(let module in modules.files) {
			// !!! WHOS IDEA WAS THIS !!!
			if(module === 'manifest.json') continue;

			console.time(module.padEnd(30));
			
			const moduleb64 = await modules.file(module).async('base64');
			cache.addModule(module, moduleb64);
				
			console.timeEnd(module.padEnd(30));
		}
	}

	function guid() {
		let str = '';
		for(let i = 0; i < 32; i ++) {
			str += 'ABCDEF1234567890'[Math.floor(Math.random()*16)];
		}
		return str;
	}

	async function createInstances(config) {
		let modules = config.Modules;
		let symbols = {};

		for(let symbol in modules) {
			//ensure a pid
			if('Pid' in modules[symbol]) '';
			else modules[symbol].Pid = guid();
			//add the pid to the table
			symbols[symbol] = modules[symbol].Pid;
		}

		for(let symbol in modules) {
			modules[symbol].Par = replaceSymbols(modules[symbol].Par);
			cache.createInstance(modules[symbol], modules[symbol].Pid);
			// console.log(modules[symbol])
		}


		function replaceSymbols(obj) {
			return _.transform(obj, recurse);

			function recurse(res, val, key) {
				if(typeof val === 'object') {
					res[key] = _.transform(val, recurse);
					return;
				} else if(typeof val === 'string') {
					if(val.startsWith('$')) {
						res[key] = symbols[val.substr(1)];
					} else res[key] = val;
				} else res[key] = val;
			}
		}
	}

}
