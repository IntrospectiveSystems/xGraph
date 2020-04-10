module.exports = genesis;
function genesis(__options = {}) {
	// imports

	const createLogger = require('./Logger.js');
	const log = checkFlag('logger') ? __options.logger : createLogger(__options);
	const fs = require('fs');
	const Path = require('path');
	const endOfLine = require('os').EOL;
	const proc = require('child_process');
	const jszip = require('jszip');
	const CacheInterface = require('./Cache.js');
	const { Broker } = require('./broker.js');
	const BrokerCache = {};
	let cacheInterface;

	function checkFlag(flag) {
		// console.dir(__options);
		return flag in __options && __options[flag];
	}

	return new Promise(async (resolveMain, rejectMain) => {
		// log.time('genesis');
		// Genesis globals
		let Uuid; //Uuid npm package (v4.js)
		let Params = __options; 					// The set of Macros for defining paths
		let CWD = __options.cwd; 					// The current working directory
		let CacheDir = __options.cache; 	// The location of where the Cache will be stored

		log.i(`Initializing the Compile Engine in ${__options.state} Mode`);
		let compileTimer = log.time('Compile');

		try {
			log.i(' [Process Config]'.padStart(80, '='));
			log.v(`State: ${__options.state} mode`);
			log.i('Genesis Starting');
			log.v(`CWD set to ${CWD}`);
			log.i('Loading the system configuration file ...');
			// conifg, or path to it, is in Params.Config. Defaults to "config.json" in CWD
			let tempConfig = undefined;

			if (typeof Params.config == 'object') tempConfig = Params.config;
			else {
				Params.config = Path.resolve(Params.config || Path.join(CWD, 'config.json'));
				if (!(fs.existsSync(Params.config))) {
					rejectMain('Specified configuration file does not exist ' + Params.config);
					return;
				}

				try {
					// Read in the main config and make sure it's a valid .json file
					tempConfig = JSON.parse(fs.readFileSync(Params.config));
				} catch (e) {
					rejectMain('Specified configuration file is in an unparsable format. ' + Params.config);
					return;
				}
			}

			const setupTimer = log.time('Setup');
			let systemTemplate = await setup(tempConfig, true);
			log.timeEnd(setupTimer);

			const genesisTimer = log.time('Genesis');
			await genesis(systemTemplate);
			log.timeEnd(genesisTimer);

		} catch (e) {
			rejectMain(e);
			return;
		}


		/**
		 * Bulds the system 
		 */
		function setup(tempConfig, root = true) {
			let Config = {}; 				// The parsed system configuration in JSON format
			let Apex = {}; 					// {<Name>: <pid of Apex>}
			let Modules = {};				// {<Name>: <mod desc>}
			let ModCache = {}; 			// {<folder>: <module>}

			return new Promise(async (resolveSetup, rejectSetup) => {

				//stores the processed config in the Config object inside of setup
				let timer = log.time('processSources');
				processSources(tempConfig);
				log.timeEnd(timer);

				// Print out the parsed config
				log.v(`Pre-Processed config: \n${JSON.stringify(Config, null, 2)}`);

				log.i('Retrieving modules ...');

				timer = log.time('generateModuleCatalog');
				generateModuleCatalog();
				log.timeEnd(timer);

				log.v(`Module List:\n\t${Object.keys(Modules).join('\n\t')}`);

				timer = log.time('retrieveModules');
				log.v(Modules);
				await retrieveModules(Modules);
				log.timeEnd(timer);

				log.i('Processing configuration links and dependencies ...');

				timer = log.time('buildApexInstances');
				await buildApexInstances(root);
				log.timeEnd(timer);

				log.v(`Processed config: \n${JSON.stringify(Config, null, 2)}`);

				resolveSetup({ Config, Apex, ModCache });

				return;



				//////////////////////////////////////////////////////////////
				//
				//	Only helper functions defined below in this scope
				//

				async function retrieveModules(modules) {
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
					// console.dir(xgrls);

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
							//for (const moduleName in modules) {
							//	if (modules[moduleName].Source === xgrl) {
							for (const moduleName of modulesByxgrl[xgrl]){
									// console.log(`${moduleName} => ${xgrl}`);
								modulePromises.push(new Promise(async (res) => {
									ModCache[moduleName] = await broker.getModule({
										Module: moduleName,
										Version: modules[moduleName].Version || undefined
									});
									res();
								}));
							//	}
							}
							await Promise.all(modulePromises);
							res();
						}))
					}

					await Promise.all(promises);

					return;
				}

				/**
				 * Reads in the given config and fills in the Sources Macros
				 */
				function processSources(cfg) {

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
										Config.Sources[subkey] = Macro(subval);
										break;
									}
									case 'object': {
										Config.Sources[subkey] = {};
										for (let id in subval) {
											Config.Sources[subkey][id.toLowerCase()] =
												(typeof subval[id] == 'string') ?
													Macro(subval[id]) : subval[id];
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

				/**
				 * Create a list of all required modules and their brokers
				 */
				function generateModuleCatalog() {
					// Create new cache and install high level
					// module subdirectories. Each of these also
					// has a link to the source of that module (Module.json).
					let keys = Object.keys(Config.Modules);
					for (let i = 0; i < keys.length; i++) {
						let key = keys[i];
						if (key == 'Deferred') {
							let arr = Config.Modules['Deferred'];
							for (let idx = 0; idx < arr.length; idx++) {
								let mod = arr[idx];
								log.v(`Deferring ${mod.Module || mod}`);
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
								logModule(key, mod);
							}
						} else {
							if (typeof Config.Modules[key].Module != 'string') {
								log.e('Malformed Module Definition');
								log.e(JSON.stringify(Config.Modules[key], null, 2));
							}
							logModule(key, Config.Modules[key]);
						}
					}

					/**
					 * Add the module to the Modules object if unique
					 * @param {object} mod 		The module object
					 * @param {string} mod.Module	The name of the module
					 * @param {object, string} mod.Source The Module broker or path reference
					 */
					function logModule(key, mod) {
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
				}

				/**
				 * Write the modules and all instances to the cache
				 */
				async function buildApexInstances(processPidReferences) {
					if (processPidReferences) {
						// Assign pids to all instance in Config.Modules
						for (let instname in Config.Modules) {
							if (instname == 'Deferred')
								continue;
							Apex[instname] = genPid();
						}
						log.v('Apex List', JSON.stringify(Apex, null, 2));
					}

					// Now populate all of the modules from config.json
					for (let instname in Config.Modules) {
						if (instname === 'Deferred')
							continue;
						await processApexPar(Apex[instname], Config.Modules[instname], processPidReferences);
					}
				}

				/**
				 * ----------------------------------------------------CompileModule
				 * @param {String} apx 						The Pid of the Apex
				 * @param {Object} inst 					the par of the Apex
				 * @param {Boolean} processPidReferences 	Process the $ references or not
				 */
				async function processApexPar(apx, inst, processPidReferences) {
					inst = symbolPhase0(inst);
					if (processPidReferences) inst.Par = await symbolPhase1(inst.Par);
					inst.Par = await symbolPhase2(inst.Par);
					inst.Par = await symbolPhase3(inst.Par);
					return;

					//process {} references
					function symbolPhase0(obj) {
						for (let key in obj) {
							if (typeof obj[key] == 'string') obj[key] = Macro(obj[key]);
							else if (typeof obj[key] == 'object') obj[key] = symbolPhase0(obj[key]);
						}
						return obj;
					}

					//process $ references 
					async function symbolPhase1(val) {
						if (typeof val === 'object') {
							if (Array.isArray(val)) {
								val = await Promise.all(val.map(v => symbolPhase1(v)));
							} else {
								for (let key in val) {
									val[key] = await symbolPhase1(val[key]);
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
								log.v(sym, Apex);
								log.e(`Symbol ${val} is not defined`);
								rejectSetup(`Symbol ${val} is not defined`);
								return;
							}
						}
						return val;
					}

					//process @ system directives
					async function symbolPhase2(val) {
						if (typeof val === 'object') {
							if (Array.isArray(val)) {
								val = await Promise.all(val.map(v => symbolPhase2(v)));
							} else {
								for (let key in val) {
									val[key] = await symbolPhase2(val[key]);
								}
							}
							return val;
						}

						if (typeof val !== 'string' || (!val.startsWith('@')))
							return val;
						let [directive, path] = val.split(':').map(v => v.toLocaleLowerCase().trim());

						if (directive == '@system') {
							let directiveTimer = log.time(val);
							let stepTimer = log.time('fs');
							let systemPath = Params.config ? Path.dirname(Params.config) : CWD;

							if (!(Path.isAbsolute(path))) {
								path = Path.join(Path.resolve(systemPath), path);
							}

							let tempConfig;

							if (!fs.existsSync(path)) {
								rejectSetup(`Specified configuration file does not exist: ${path}`);
								return;
							}
							try {
								tempConfig = JSON.parse(fs.readFileSync(path));
							} catch (e) {
								rejectSetup('Specified configuration file is in an unparsable format.');
								return;
							}
							log.timeEnd(stepTimer);

							//TODO parse out all $'s, replace with \\$
							let systemObject;
							try {
								systemObject = await setup(tempConfig, false);
							} catch (e) {
								rejectSetup(`Error processing subsystem at: ${path}`);
								return;
							}

							try { fs.mkdirSync(Path.join(CWD, 'Static')); } catch (e) {
								log.v(e);
							}

							stepTimer = log.time('bower');
							await new Promise(async resolve => {
								// let zip = new jszip();
								// let cacheBuffer = Buffer.from(systemObject.Cache, 'base64');
								// zip.loadAsync(cacheBuffer).then(async (a) => {
								// 	for (let key in a.files) {
								// 		if (key === 'manifest.json') continue;
								for (let moduleType in systemObject.ModCache) {
									let modZip = new jszip();
									// let moduleZipBinary = await zip.file(key).async('base64');
									modZip = await new Promise((res) => {
										let modZipBuffer = Buffer.from(systemObject.ModCache[moduleType], 'base64');
										modZip.loadAsync(modZipBuffer).then(zip => {
											res(zip);
										});
									});
									if (!('bower.json' in modZip.files)) continue;

									let bowerjson = await modZip.file('bower.json').async('string');
									let dependencies = JSON.parse(bowerjson).dependencies;
									let packageArray = [];
									for (let bowerModuleName in dependencies) {
										if (dependencies[bowerModuleName].indexOf('/') > 0) {
											packageArray.push(`${dependencies[bowerModuleName]}`);
										}
										else {
											packageArray.push(`${bowerModuleName}#`
												+ `${dependencies[bowerModuleName]}`);
										}
										await new Promise(res => {
											proc.execSync('bower install "--config.directory='
												+ `${Path.join(CWD, 'Static',
													'bower_components')}" "${packageArray.join('" "')}"`);
											log.v(`[BOWER] Installed ${packageArray.join(', ')}`);
											res();
										});
									}
									let bowerComponentsDir = Path.join(CWD, 'Static',
										'bower_components');
									proc.execSync('bower install "--config.directory='
										+ `${bowerComponentsDir}" "${packageArray.join('" "')}"`);
									log.v(`[BOWER] Installed ${packageArray.join(', ')}`);
								}
								resolve();
							});
							log.timeEnd(stepTimer);

							stepTimer = log.time('zip it');
							//zip up the ModCache for export to the browser or other subsystems
							let zip = await new Promise(resolveZip => {
								let zip = new jszip();
								let man = [];
								for (let folder in systemObject.ModCache) {
									let mod = Buffer.from(systemObject.ModCache[folder], 'base64');
									man.push(folder);
									zip.file(folder, mod, {
										date: new Date('April 2, 2010 00:00:01')
										//the date is required for zip consistency
									});
								}
								zip.file('manifest.json', JSON.stringify(man), {
									date: new Date('April 2, 2010 00:00:01')
									//the date is required for zip consistency
								});
								zip.generateAsync({ type: 'base64' }).then(function (data) {
									resolveZip({
										'Config': systemObject.Config,
										'Cache': data
									});
								});
							});
							log.timeEnd(stepTimer);
							log.timeEnd(directiveTimer);

							return zip;

						}
						return val;
					}

					//process @ files and directories 
					async function symbolPhase3(val) {
						if (typeof val === 'object') {
							if (Array.isArray(val)) {
								val = await Promise.all(val.map(v => symbolPhase3(v)));
							} else {
								for (let key in val) {
									val[key] = await symbolPhase3(val[key]);
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
									log.v(`Compiling ${directive}`);
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
								case '@folder':
								case '@directory': {
									log.v(`Compiling ${directive}`);
									let dir;
									try {
										let systemPath = Params.config ? Path.dirname(Params.config) : CWD;
										if (Path.isAbsolute(val))
											dir = val;
										else
											dir = Path.join(Path.resolve(systemPath), val);
											let _return = await buildDir(dir);
											log.timeEnd(directiveTimer);
										return _return;
									} catch (err) {
										og.e('Error reading directory ', dir);
										og.w(`Module ${inst.Module} may not operate as expected.`);
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
				}

				/**
				 * Build an object to represent a directory
				 * @param {String} path 
				 */
				async function buildDir(path) {
					let dirObj = {};
					if (fs.existsSync(path)) {
						let files = fs.readdirSync(path);
						let itemPromises = [];
						for (let file of files) {
							itemPromises.push(new Promise(async (resolve) => {
								let curPath = path + '/' + file;
								if (fs.lstatSync(curPath).isDirectory()) {
									// recurse
									dirObj[file] = await buildDir(curPath);
									resolve();
								} else {
									fs.readFile(curPath, function (err, data) {
										// log.v(curPath.length > 80 ? curPath.substr(0, 35) 
										// + ' ... ' + curPath.substr(-40, 40) : curPath);
										dirObj[file] = data.toString();
										resolve();
									});
									// dirObj[file] = fs.readFileSync(curPath).toString(encoding);
								}
							}));
						}
						await Promise.all(itemPromises);
						return dirObj;
					}
				}

				/**
				 * generate a 32 character hexidecimal pid
				 */
				function genPid() {
					if (!Uuid) {
						// module.paths = [Path.join(Path.resolve(CacheDir), 'node_modules')];
						Uuid = require('uuid/v4');
					}
					let str = Uuid();
					let pid = str.replace(/-/g, '').toUpperCase();
					return pid;
				}

				/**
				 * replace the {} macros passed throught the xgraph cli or __options object
				 * @param {string} str the string to look up
				*/
				function Macro(str) {
					str = str.substr(0); // copy
					for (let option in __options) {
						str = str.replace(`{${option}}`, __options[option]);
					}
					return str;
				}
			});
		}

		/**
		 * Writes the system to the cache
		 */
		async function genesis(system) {
			log.i(' [Save Cache]'.padStart(80, '='));
			log.i('Genesis Compile Start:');

			let cacheState = null;
			if (fs.existsSync(CacheDir)) cacheState = 'exists';

			cacheInterface = new CacheInterface({
				path: CacheDir, log
			});

			cleanCache();

			log.i('Saving modules and updating dependencies ...');
			await cacheModules(system.ModCache);

			if (!(__options.state == 'updateOnly')) {
				log.i('Saving entities ...');
				await cacheApexes(system.Apex, system.Config.Modules);
			}

			Stop();

			/////////////////////////////////////////////////////////////
			//
			//	Only helper functions beyond this point of this scope
			//

			/**
			*  Remove the cache if it currently exists in the given directory	
			*/
			function cleanCache() {
				// Remove the provided cache directory
				if (__options.state == 'development' && cacheState) {
					__options.state = 'updateOnly';
					return;
				}
				log.v('Removing the old cache.');
				cacheInterface.clean();
			}

			/**
			 * Write the modules to the cache
			 * @param {Object} ModCache 	//the set of module zips required for this system
			 */
			async function cacheModules(ModCache) {
				let timer = log.time('cacheModules');
				let ModulePromiseArray = [];
				for (let folder in ModCache) {
					ModulePromiseArray.push(new Promise(async (res) => {
						await cacheInterface.addModule(folder, ModCache[folder]).catch((error) => {
							log.e(`Failed to find module ${ModCache[folder]} at `)
						});
						log.v(`Finished installing dependencies for ${folder}`);
						res();
					}));

				}
				await Promise.all(ModulePromiseArray);

				log.timeEnd(timer);
			}

			/**
			 * Write the module Apexes to the cache
			 * @param {Object} Apexes 						//The id:Pid of each apex
			 * @param {Object} ModuleDefinitions 	//the id:ModuleDefinition from Config
			 */
			async function cacheApexes(Apexes, ModuleDefinitions) {
				let ModulePromiseArray = [];
				for (let moduleId in Apexes) {
					ModulePromiseArray.push(
						await cacheInterface.createInstance(ModuleDefinitions[moduleId], Apexes[moduleId])
					);
				}
				await Promise.all(ModulePromiseArray);
			}

			/**
			 * Resolves the main promise created during genesis call
			 */
			async function Stop() {
				log.i(`Genesis Compile Stop: ${new Date().toString()}`);
				log.i(' [Finished]'.padStart(80, '='));
				for(const xgrl in BrokerCache) {
					const broker = BrokerCache[xgrl];
					broker.cleanup();
				}
				log.timeEnd(compileTimer);
				resolveMain();
			}
		}
	});
}