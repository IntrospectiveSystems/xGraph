module.exports = genesis;

const Logger = require('./Logger.js');
const Log = require('./Log.js');
const fs = require('fs');
const Path = require('path');
const endOfLine = require('os').EOL;
const CacheInterface = require('./Cache.js');
const { Broker } = require('./broker.js');
const xGraphSpawner = require('./xGraphSpawner.js');

function checkFlag(__options, flag) {
	return flag in __options && __options[flag];
}

function validateXGraphConfig(config) {
	if (!config || typeof config !== 'object') {
		return false;
	}

	if (!config.Sources && !config.Modules) {
		return false;
	}

	return true;
}

function replaceMacros(str, __options) {
	str = str.substr(0);
	for (let option in __options) {
		str = str.replace(`{${option}}`, __options[option]);
	}
	return str;
}

function processSymbolPhase0(obj, __options) {
	for (let key in obj) {
		if (typeof obj[key] == 'string') obj[key] = replaceMacros(obj[key], __options);
		else if (typeof obj[key] == 'object') obj[key] = processSymbolPhase0(obj[key], __options);
	}
	return obj;
}

async function processSymbolPhase1(val, Apex, log, rejectSetup) {
	if (typeof val === 'object') {
		if (Array.isArray(val)) {
			val = await Promise.all(val.map(v => processSymbolPhase1(v, Apex, log, rejectSetup)));
		} else {
			for (let key in val) {
				val[key] = await processSymbolPhase1(val[key], Apex, log, rejectSetup);
			}
		}
		return val;
	}

	if (typeof val !== 'string')
		return val;
	let sym = val.substr(1);
	if (val.charAt(0) === '$') {
		if (sym in Apex) return Apex[sym];
		else {
			log.x(sym, Apex);
			log.e(`Symbol ${val} is not defined`);
			rejectSetup(`Symbol ${val} is not defined`);
			return;
		}
	}
	return val;
}

async function processSymbolPhase2(val, Params, CWD, __options, log, rejectSetup) {
	if (typeof val === 'object') {
		if (Array.isArray(val)) {
			val = await Promise.all(val.map(v => processSymbolPhase2(v, Params, CWD, __options, log, rejectSetup)));
		} else {
			for (let key in val) {
				val[key] = await processSymbolPhase2(val[key], Params, CWD, __options, log, rejectSetup);
			}
		}
		return val;
	}

	if (typeof val !== 'string' || (!val.startsWith('@')))
		return val;
	let [directive, path] = val.split(':');
	directive = directive.toLowerCase().trim();
	path = path ? path.trim() : '';

	if (directive == '@system') {
		log.i(`Spawning system from directive: ${val}`);
		let directiveTimer = log.time(val);

		if (!path) {
			rejectSetup('@system directive requires a path to a config file');
			return;
		}

		let systemPath = Params.config ? Path.dirname(Params.config) : CWD;
		let configPath;

		if (Path.isAbsolute(path)) {
			configPath = path;
		} else {
			configPath = Path.join(Path.resolve(systemPath), path);
		}

		log.i("System Config Path: ", configPath);

		let workingDirectory = Path.dirname(configPath);

		if (!fs.existsSync(configPath)) {
			rejectSetup(`Specified configuration file does not exist: ${configPath}`);
			return;
		}

		let config;
		try {
			config = JSON.parse(fs.readFileSync(configPath));
			log.x(`Loaded config from file: ${configPath}`);
		} catch (parseError) {
			rejectSetup('Specified configuration file is in an unparsable format.');
			return;
		}

		if (!validateXGraphConfig(config)) {
			rejectSetup('Invalid xGraph configuration format. Config must contain Sources and/or Modules.');
			return;
		}

		try {
			const spawner = new xGraphSpawner({
				silent: checkFlag(__options, 'silent'),
				verbose: checkFlag(__options, 'verbose'),
				debug: checkFlag(__options, 'debug')
			});

			const spawnConfig = {
				configPath: configPath,
				cwd: workingDirectory,
				silent: checkFlag(__options, 'silent'),
				verbose: checkFlag(__options, 'verbose'),
				debug: checkFlag(__options, 'debug')
			};

			const spawnResult = await spawner.spawn(spawnConfig);

			log.x(`Spawned xGraph system with process ID: ${spawnResult.processId}, WebSocket port: ${spawnResult.wsPort}`);
			log.timeEnd(directiveTimer);

			const apexList = {};
			if (config.Modules) {
				for (let moduleName in config.Modules) {
					if (moduleName !== 'Deferred') {
						apexList[moduleName] = null;
					}
				}
			}

			log.x('Apex List for spawned system', JSON.stringify(apexList, null, 2));

			return {
				processId: spawnResult.processId,
				wsPort: spawnResult.wsPort,
				pid: spawnResult.pid,
				modules: apexList,
				configPath: configPath,
				workingDirectory: workingDirectory
			};

		} catch (spawnError) {
			rejectSetup(`Error spawning xGraph system: ${spawnError.message}`);
			return;
		}
	}
	return val;
}

async function processSymbolPhase3(val, inst, Params, CWD, __options, log) {
	if (typeof val === 'object') {
		if (Array.isArray(val)) {
			val = await Promise.all(val.map(v => processSymbolPhase3(v, inst, Params, CWD, __options, log)));
		} else {
			for (let key in val) {
				val[key] = await processSymbolPhase3(val[key], inst, Params, CWD, __options, log);
			}
		}
		return val;
	}
	if (typeof val !== 'string' || (!val.startsWith('@')))
		return val;
	if (val.charAt(0) === '@') {
		let directive = val.substr(0);
		val = val.split(':');
		let key = val[0].toLocaleLowerCase().trim();
		let encoding = undefined;
		if (key.split(',').length == 2) {
			key = key.split(',')[0].trim();
			let _encoding = key.split(',')[1].trim();
		}
		val = val.slice(1).join(':').trim();
		let directiveTimer = log.time(directive);
		switch (key) {
			case '@filename':
			case '@file': {
				log.x(`Compiling ${directive}`);
				let path;
				try {
					let systemPath = Params.config ? Path.dirname(Params.config) : CWD;
					if (Path.isAbsolute(val))
						path = val;
					else {
						path = Path.join(Path.resolve(systemPath), val);
					}
					log.timeEnd(directiveTimer);
					return fs.readFileSync(path).toString(encoding);
				} catch (err) {
					log.e('@file: (compileInstance) Error reading file ', path);
					log.w(`Module ${inst.Module} may not operate as expected.`);
				}
				break;
			}
			case '@config': {
				log.x(`Compiling ${directive}`);
				let path;
				try {
					let systemPath = Params.config ? Path.dirname(Params.config) : CWD;
					if (Path.isAbsolute(val))
						path = val;
					else {
						path = Path.join(Path.resolve(systemPath), val);
					}
					log.timeEnd(directiveTimer);
					let valJSON = JSON.parse(fs.readFileSync(path).toString(encoding));
					processSymbolPhase0(valJSON, __options);
					return processSymbolPhase3(valJSON, inst, Params, CWD, __options, log);
				} catch (err) {
					log.e('@file: (compileInstance) Error reading config file ', path);
					log.w(`Module ${inst.Module} may not operate as expected.`);
				}
				break;

			}
			case '@path': {
				log.x(`Compiling ${directive}`);
				let path;
				try {
					let systemPath = Params.config ? Path.dirname(Params.config) : CWD;
					if (Path.isAbsolute(val))
						path = val;
					else {
						path = Path.join(Path.resolve(systemPath), val);
					}
					log.timeEnd(directiveTimer);
					return path;
				} catch (err) {
					log.e('@path: (compileInstance) Error reading path ', path);
					log.w(`Module ${inst.Module} may not operate as expected.`);
				}
				break;
			}
			case '@folder':
			case '@directory': {
				log.x(`Compiling ${directive}`);
				let dir;
				try {
					let systemPath = Params.config ? Path.dirname(Params.config) : CWD;
					if (Path.isAbsolute(val))
						dir = val;
					else
						dir = Path.join(Path.resolve(systemPath), val);
						let _return = await buildDir(dir, log);
						log.timeEnd(directiveTimer);
					return _return;
				} catch (err) {
					log.e('Error reading directory ', dir);
					log.w(`Module ${inst.Module} may not operate as expected.`);
				}
				break;
			}
			default: {
				log.w(`Key ${key} not defined.`
					+ `Module ${inst.Module} may not operate as expected.`);
			}
		}
		log.timeEnd(directiveTimer);
	}
	return val;
}

async function buildDir(path, log) {
	let dirObj = {};
	if (fs.existsSync(path)) {
		let files = fs.readdirSync(path);
		let itemPromises = [];
		for (let file of files) {
			itemPromises.push(new Promise(async (resolve) => {
				let curPath = path + '/' + file;
				if (fs.lstatSync(curPath).isDirectory()) {
					dirObj[file] = await buildDir(curPath, log);
					resolve();
				} else {
					fs.readFile(curPath, function (err, data) {
						dirObj[file] = data.toString();
						resolve();
					});
				}
			}));
		}
		await Promise.all(itemPromises);
		return dirObj;
	}
}

function genPid(CacheDir, Uuid) {
	if (!Uuid) {
		Uuid = require('uuid/v4');
	}
	let str = Uuid();
	let pid = str.replace(/-/g, '').toUpperCase();
	return pid;
}

function processSources(cfg, Config, Params, __options, log, rejectSetup) {
	if (typeof cfg['Sources'] === 'undefined') {
		log.e('You must defined a Sources object.\n');
		rejectSetup('You must defined a Sources object.');
		return;
	}
	let val, sources, subval;
	for (let key in cfg) {
		val = cfg[key];
		if (key == 'Sources') {
			Config.Sources = {};
			sources = cfg['Sources'];
			for (let subkey in sources) {
				subval = sources[subkey];
				switch (typeof subval) {
					case 'string': {
						Config.Sources[subkey] = replaceMacros(subval, __options);
						break;
					}
					case 'object': {
						Config.Sources[subkey] = {};
						for (let id in subval) {
							Config.Sources[subkey][id.toLowerCase()] =
								(typeof subval[id] == 'string') ?
									replaceMacros(subval[id], __options) : subval[id];
						}
						if (!('port' in Config.Sources[subkey])) {
							Config.Sources[subkey]['port'] = 27000;
						}
						break;
					}
					default: {
						log.e(`Invalid Source ${subkey} of type ${typeof subval}.` +
							'Must be of type string or object');
					}
				}
			}
		} else {
			Config[key] = val;
		}
	}
}

function logModule(key, mod, Modules, log, rejectSetup) {
	let folder = mod.Module.replace(/[/:]/g, '.');

	if (!('Source' in mod)) {
		log.e(`No Source Declared in module: ${key}: ${mod.Module}`);
		rejectSetup(`No Source Declared in module: ${key}`);
		return;
	}

	let source = {
		Source: mod.Source,
		Version: mod.Version
	};

	if (!(folder in Modules)) {
		Modules[folder] = source;
	} else {
		if (Modules[folder].Source != source.Source
			|| (Modules[folder].Version != source.Version)) {
			log.e(`Broker Mismatch Exception: ${key}\n`
				+ `${JSON.stringify(Modules[folder], null, 2)} - `
				+ `\n${JSON.stringify(source, null, 2)}`);
			rejectSetup('Broker Mismatch Exception');
			return;
		}
	}
}

function generateModuleCatalog(Config, Modules, log, rejectSetup) {
	let keys = Object.keys(Config.Modules);
	for (let i = 0; i < keys.length; i++) {
		let key = keys[i];
		if (key == 'Deferred') {
			let arr = Config.Modules['Deferred'];
			for (let idx = 0; idx < arr.length; idx++) {
				let mod = arr[idx];
				log.x(`Deferring ${mod.Module || mod}`);
				if (typeof mod == 'string') {
					log.w('Adding Module names directly to Deferred is deprecated');
					log.w(`Deferring { Module: '${mod}' } instead`);
					mod = { Module: mod };
				}
				if (!('Module' in mod)) {
					log.e('Malformed Deferred Module listing', mod);
					rejectSetup('Malformed Deferred Module listing');
					return;
				}
				logModule(key, mod, Modules, log, rejectSetup);
			}
		} else {
			if (typeof Config.Modules[key].Module != 'string') {
				log.e('Malformed Module Definition');
				log.e(JSON.stringify(Config.Modules[key], null, 2));
			}
			logModule(key, Config.Modules[key], Modules, log, rejectSetup);
		}
	}
}

async function retrieveModules(modules, Config, ModCache, BrokerCache, __options, log) {
	modules = JSON.parse(JSON.stringify(modules));
	const xgrls = [];
	const modulesByxgrl = {};

	for (const moduleName in modules) {
		const xgrl = Config.Sources[modules[moduleName].Source];
		if (xgrls.indexOf(xgrl) === -1) xgrls.push(xgrl);
		modules[moduleName].Source = xgrl
		if (!(xgrl in modulesByxgrl)) modulesByxgrl[xgrl]=[moduleName];
		else modulesByxgrl[xgrl].push(moduleName);
	}

	let promises = [];

	for (const xgrl of xgrls) {
		promises.push(new Promise(async (res) => {
			let broker;
			if (xgrl in BrokerCache) {
				broker = BrokerCache[xgrl];
			} else {
				const timer = log.time('Booting Broker');
				broker = new Broker(xgrl, {
					...__options
				});
				BrokerCache[xgrl] = broker;
				await broker.startup;
				log.timeEnd(timer);
			}

			const modulePromises = [];

			for (const moduleName of modulesByxgrl[xgrl]){
				modulePromises.push(new Promise(async (res) => {
					ModCache[moduleName] = await broker.getModule({
						Module: moduleName,
						Version: modules[moduleName].Version || undefined
					});
					res();
				}));
			}
			await Promise.all(modulePromises);

			res();
		}))
	}

	await Promise.all(promises);

	return;
}

async function buildApexInstances(Config, Apex, processPidReferences, CacheDir, Params, __options, log, rejectSetup) {
	let Uuid;

	if (processPidReferences) {
		for (let instname in Config.Modules) {
			if (instname == 'Deferred')
				continue;
			Apex[instname] = genPid(CacheDir, Uuid);
		}
		log.x('Apex List', JSON.stringify(Apex, null, 2));
	}

	for (let instname in Config.Modules) {
		if (instname === 'Deferred')
			continue;
		await processApexPar(Apex[instname], Config.Modules[instname], processPidReferences, Apex, Params, __options.cwd, __options, log, rejectSetup);
	}
}

async function processApexPar(apx, inst, processPidReferences, Apex, Params, CWD, __options, log, rejectSetup) {
	inst = processSymbolPhase0(inst, __options);
	if (processPidReferences) inst.Par = await processSymbolPhase1(inst.Par, Apex, log, rejectSetup);
	inst.Par = await processSymbolPhase2(inst.Par, Params, CWD, __options, log, rejectSetup);
	inst.Par = await processSymbolPhase3(inst.Par, inst, Params, CWD, __options, log);
	return;
}

function cleanCache(cacheInterface, __options, cacheState, log) {
	if (__options.state == 'development' && cacheState) {
		__options.state = 'updateOnly';
		return;
	}
	log.x('Removing the old cache.');
	cacheInterface.clean();
}

async function cacheModules(ModCache, cacheInterface, CacheDir, log) {
	let timer = log.time('cacheModules');
	let ModulePromiseArray = [];
	for (let folder in ModCache) {
		ModulePromiseArray.push(new Promise(async (res) => {
			await cacheInterface.addModule(folder, ModCache[folder]).catch((error) => {
				log.e(`Failed to find module ${ModCache[folder]} at ${CacheDir}`);
			});
			log.x(`Finished installing dependencies for ${folder}`);
			res();
		}));

	}
	await Promise.all(ModulePromiseArray);

	log.timeEnd(timer);
}

async function cacheApexes(Apexes, ModuleDefinitions, cacheInterface, log) {
	let ModulePromiseArray = [];
	for (let moduleId in Apexes) {
		ModuleDefinitions[moduleId].Name = moduleId;
		ModulePromiseArray.push(
			await cacheInterface.createInstance(ModuleDefinitions[moduleId], Apexes[moduleId])
		);
	}
	await Promise.all(ModulePromiseArray);
	let moduleArr = [];
	log.i("=================================================================== Module Index");
	for (let Modules of ModulePromiseArray) {
		for (let module of Modules) {
			log.i(module.Name, ":", module.Pid);
			moduleArr.push({name: module.Name, pid: module.Pid});
		}
	}
	log.i("==================================================================================");

}

async function setup(tempConfig, root, Config, Apex, Modules, ModCache, BrokerCache, Params, __options, log, rejectSetup) {
	let timer = log.time('processSources');
	processSources(tempConfig, Config, Params, __options, log, rejectSetup);
	log.timeEnd(timer);

	log.x(`Pre-Processed config: \n${JSON.stringify(Config, null, 2)}`);

	log.i('Retrieving modules ...');

	timer = log.time('generateModuleCatalog');
	generateModuleCatalog(Config, Modules, log, rejectSetup);
	log.timeEnd(timer);

	log.x(`Module List:\n\t${Object.keys(Modules).join('\n\t')}`);

	timer = log.time('retrieveModules');
	log.x(Modules);
	await retrieveModules(Modules, Config, ModCache, BrokerCache, __options, log);
	log.timeEnd(timer);

	log.i('Processing configuration links and dependencies ...');

	timer = log.time('buildApexInstances');
	await buildApexInstances(Config, Apex, root, Params.cache, Params, __options, log, rejectSetup);
	log.timeEnd(timer);

	log.x(`Processed config: \n${JSON.stringify(Config, null, 2)}`);

	return { Config, Apex, ModCache };
}

async function genesisCompile(system, CacheDir, BrokerCache, __options, compileTimer, log, resolveMain) {
	log.i(' [Save Cache]'.padStart(80, '='));
	log.i('Genesis Compile Start:');

	let cacheState = null;
	if (fs.existsSync(CacheDir)) cacheState = 'exists';

	let cacheOptions = {
		path: CacheDir, log
	};

	if(checkFlag(__options, 'node_modules')) {
		let nodeModulesPath = checkFlag(__options, 'node_modules');
		log.w(`Node Modules set to manual mode. Node Modules root: ${nodeModulesPath}`);
		cacheOptions.node_modules = nodeModulesPath
	}
	let cacheInterface = new CacheInterface(cacheOptions);

	cleanCache(cacheInterface, __options, cacheState, log);

	log.i('Saving modules and updating dependencies ...');
	await cacheModules(system.ModCache, cacheInterface, CacheDir, log);

	if (!(__options.state == 'updateOnly')) {
		log.i('Saving entities ...');
		await cacheApexes(system.Apex, system.Config.Modules, cacheInterface, log);
	}

	log.i(`Genesis Compile Stop: ${new Date().toString()}`);
	log.i(' [Finished]'.padStart(80, '='));
	for(const xgrl in BrokerCache) {
		const broker = BrokerCache[xgrl];
		broker.cleanup();
	}
	log.timeEnd(compileTimer);
	resolveMain();
}

function genesis(__options = {}) {
	const logger = checkFlag(__options, 'logger') ? __options.logger : new Logger(__options);
	const log = new Log(logger, 'Genesis');
	const BrokerCache = {};

	return new Promise(async (resolveMain, rejectMain) => {
		let Params = __options;
		let CWD = __options.cwd;
		let CacheDir = __options.cache;

		log.i(`Initializing the Compile Engine in ${__options.state} Mode`);
		let compileTimer = log.time('Compile');

		try {
			log.i(' [Process Config]'.padStart(80, '='));
			log.x(`State: ${__options.state} mode`);
			log.i('Genesis Starting');
			log.x(`CWD set to ${CWD}`);
			log.i('Loading the system configuration file ...');

			let tempConfig = undefined;

			if (typeof Params.config == 'object') tempConfig = Params.config;
			else {
				Params.config = Path.resolve(Params.config || Path.join(CWD, 'config.json'));
				if (!(fs.existsSync(Params.config))) {
					rejectMain('Specified configuration file does not exist ' + Params.config);
					return;
				}

				try {
					tempConfig = JSON.parse(fs.readFileSync(Params.config));
				} catch (e) {
					rejectMain('Specified configuration file is in an unparsable format. ' + Params.config);
					return;
				}
			}

			let Config = {};
			let Apex = {};
			let Modules = {};
			let ModCache = {};

			const setupTimer = log.time('Setup');
			let systemTemplate = await setup(tempConfig, true, Config, Apex, Modules, ModCache, BrokerCache, Params, __options, log, rejectMain);
			log.timeEnd(setupTimer);

			const genesisTimer = log.time('Genesis');
			await genesisCompile(systemTemplate, CacheDir, BrokerCache, __options, compileTimer, log, resolveMain);
			log.timeEnd(genesisTimer);

		} catch (e) {
			rejectMain(e);
			return;
		}
	});
}