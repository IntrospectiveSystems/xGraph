module.exports = genesis;
function genesis(__options = {}) {
	// imports

	const createLogger = require('../lib/Logger.js');
	const log = createLogger(__options);
	const fs = require('fs');
	const Path = require('path');
	const endOfLine = require('os').EOL;
	const proc = require('child_process');
	const jszip = require('jszip');
	const appdata = Path.join((process.env.APPDATA || Path.join(process.env.HOME,
		(process.platform == 'darwin' ? 'Library/Preferences' : ''))), '.xgraph');
	try { fs.mkdirSync(appdata); } catch (e) { ''; }
	let https = require('https');
	const tmp = require('tmp');
	let nexus = require('../lib/Nexus.js');
	const CacheInterface = require('./CacheInterface.js');
	const tree = require('tree-directory');
	let cacheInterface;

	function checkFlag(flag) {
		// console.dir(__options);
		return flag in __options && __options[flag];
	}

	return new Promise(async (resolveMain, rejectMain) => {
		// Genesis globals
		let Uuid; //Uuid npm package (v4.js)
		let Params = __options; 					// The set of Macros for defining paths
		let CWD = __options.cwd; 					// The current working directory
		let CacheDir = __options.cache; 	// The location of where the Cache will be stored

		log.i(`Initializing the Compile Engine in ${__options.state} Mode`);

		try {
			log.i('=================================================');
			log.i('Genesis Build:');
			log.v(`CWD set to ${CWD}`);
			log.i('Loading the system configuration file ...');
			// Read in the main config and make sure it's a valid .json file
			// File is passed in Params.Config or defaults to "config.json" in current working directory
			
			Params.config = Path.resolve(Params.config || Path.join(CWD, 'config.json'));
			if (!(fs.existsSync(Params.config))){
				rejectMain('Specified configuration file does not exist '+ Params.config);
				return;
			}
			
			let tempConfig = undefined;
			try {
				tempConfig = JSON.parse(fs.readFileSync(Params.config));
			} catch (e) {
				rejectMain('Specified configuration file is in an unparsable format. '+ Params.config);
				return;
			}

			let systemTemplate = await setup(tempConfig, true);

			await genesis(systemTemplate);
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
				processSources(tempConfig);

				// Print out the parsed config
				log.v('Pre-Processed config\n', JSON.stringify(Config, null, 2));

				log.i('Retrieving modules ...');
				generateModuleCatalog();

				log.v(`Module List: \n\t${Object.keys(Modules).join('\n\t')}`);

				await retrieveModules();

				log.i('Processing configuration links and dependencies ...');
				await buildApexInstances(root);

				log.v('Processed config\n', JSON.stringify(Config, null, 2));

				resolveSetup({ Config, Apex, ModCache });
				return;



				//////////////////////////////////////////////////////////////
				//
				//	Only helper functions defined below in this scope
				//

				/**
				 * Reads in the given config and fills in the Sources Macros
				 */
				function processSources(cfg) {
					// Parse the sources and replace Macros

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
				 * get the modules from the prebuilt catalog
				 * from the source defined in config
				 */
				async function retrieveModules() {
					let modArray = [];
					let moduleKeys = Object.keys(Modules);

					//loop over module keys to build Promise array
					for (let ifolder = 0; ifolder < moduleKeys.length; ifolder++) {
						modArray.push(new Promise((res, rej) => {
							let folder = moduleKeys[ifolder];
							if (!(Modules[folder].Source in Config.Sources)){
								rejectSetup(`Source ${Modules[folder].Source} not defined in Config.Sources`);
								return;
							}
							let modrequest = {
								'Module': folder,
								'Source': Config.Sources[Modules[folder].Source],
								'Version': Modules[folder].Version
							};

							log.v(`Requesting ${modrequest.Module} from ${
								(typeof modrequest.Source == 'object') ?
									`\n${JSON.stringify(modrequest.Source, null, 2)}` : modrequest.Source}`);
							GetModule(modrequest, async function (err, mod) {
								if (err) {
									rej(`Failed to retreive module: ${folder}`, err);
								} else {
									log.v(`Successfully retrieved module: ${folder}`);
									res(ModCache[folder] = mod);
								}
							});
						}));
					}

					try {
						await Promise.all(modArray);
						log.v('All Modules Retrieved');
					} catch (e) {
						rejectSetup(e);
						return;
					}
				}

				/**
				 * load protocol to access modules
				 */
				function getProtocolModule(protocol) {
					return new Promise(function (resolve, reject) {
						let cacheFilepath = Path.join(appdata, protocol);
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
				async function GetModule(modRequest, fun) {
					let modnam = modRequest.Module;
					let source = modRequest.Source;

					//get the module from memory (ModCache) if it has already been retrieved
					if (modnam in ModCache) {
						log.v(`${modnam} returned from ModCache`); return fun(null, ModCache[modnam]);
					}

					//get the module from the defined broker
					if (typeof source == 'object') {
						// TODO THIS IS FOR DEFININF A
						// BROKER DIRECTLY WITHIN A MODULE DEFINITION
						let port = source.Port || source.port;
						let host = source.Host || source.host;
						return loadModuleFromBroker(host, port);
					}

					if (typeof source == 'string') {
						let protocol = source.split(/:\/\//)[0];
						let _domain = source.split(/:\/\//)[1];
						let cmd = {};
						cmd.Cmd = 'GetModule';
						cmd.Name = modnam;
						cmd.Passport = {
							Disp: 'Query',
							Pid: genPid()
						};
						if ('Version' in modRequest) {
							cmd.Version = modRequest.Version;
						}
						modRequest.Version = 'latest';

						if (protocol.length > 1 && (_domain !== undefined)) {
							try {
								// "exmaple.com:23897"
								let argumentString = source.replace(/[a-zA-Z]*:\/\//, '');
								let argsArr = argumentString.split(/:/);
								let protocolObj = await getProtocolModule(protocol);
								return loadModuleFromBroker(argsArr, protocolObj, cmd);
							} catch (e) {
								if (e.code != 0) {
									return fun(e.text);
								}
								return loadModuleFromDisk();
							}
						} else {
							return loadModuleFromDisk();
						}
					}

					/**
					 * open up a socket to the defined broker and access the module
					 */
					function loadModuleFromBroker(args, protocolObject, cmd) {
						tmp.dir(async (err, path, cleanupCallback) => {
							if (err) throw err;

							// log.i(cmd);
							let cachePath = Path.join(path, 'cache');
							// log.w(protocolObject);
							let zip = Buffer.from(protocolObject.Module, 'base64');
							let parString = JSON.stringify(protocolObject.Par, null, 2);

							// TODO DO THIS PARSE WAY DIFFERENT AND ALLOW FOR DEFAULTS
							for (let i = 0; i < Math.max(args.length, 2); i++) {
								parString = parString.replace(`%${i + 1}`, args[i] || 27000);
							}

							let par = JSON.parse(parString);
							par.Module = 'BrokerProxy';

							// create the cache on disk
							let cache = new CacheInterface({
								path: cachePath, log
							});

							// add the proxy to it
							await cache.addModule('BrokerProxy', zip);

							// create an instance of it, with a pid we can
							// reference later
							await new Promise(async (res) => {
								await cache.createInstance({
									Module: 'BrokerProxy',
									Par: par
								}, '0'.repeat(32));
								res();
							});

							// show its tree
							log.v(tree.sync(cachePath, '**/*'));

							// 
							let system = new nexus({
								cache: cachePath,
								silent: true,
								// logleveldebug: true
							});

							log.v('Booting Module Retrieval Subsystem');

							let hooks = await system.boot();

							let response = await new Promise(res => {
								hooks.send(cmd, '0'.repeat(32), (err, cmd) => {
									hooks.stop(0);
									res({ err, cmd });
								});
							});

							if (response.err) {
								log.e(`Error retrieving ${cmd.Name} from`);
								log.e(args);
								process.exit(1);
							}

							log.v('Module retrieved, shutting down Subsystem');

							// cleanup, our job here is DONE!
							cache.delete();
							// Manual cleanup
							cleanupCallback();

							// return the module from the command, in buffer form!
							fun(null, Buffer.from(response.cmd.Module, 'base64'));
						});

					}

					/**
					 * load module from disk
					 */
					function loadModuleFromDisk() {
						(async () => {
							modnam = modnam.replace(/\./g, Path.sep);
							let ModPath = Path.resolve(Path.join(source, modnam));
							//read the module from path in the local file system
							//create the Module.json and add it to ModCache
							let zipmod = new jszip();

							//recursively zip the module
							await zipDirChidren(zipmod, ModPath);

							zipmod.generateAsync({ type: 'uint8array' }).then((dat, fail) => {
								if (fail) {
									log.w('Genesis failed to create zip.');
									return;
								}

								log.v(`${modnam} returned from local file system`);
								fun(null, dat);
							});

							async function zipDirChidren(ziproot, containingPath) {
								let files;
								try {
									files = fs.readdirSync(containingPath);
								} catch (err) {
									let output = err + ' \nModule "' + containingPath + '" not available';
									log.e(output);
									return fun(output);
								}
								if (!files) {
									let output = ' \nModule "' + containingPath + '" not available';
									log.e(output);
									return fun(output);
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
							let systemPath = Params.config ? Path.dirname(Params.config) : CWD;

							if (!(Path.isAbsolute(path))) {
								path = Path.join(Path.resolve(systemPath), path);
							}

							let tempConfig;

							if (!fs.existsSync(path)){
								rejectSetup(`Specified configuration file does not exist: ${path}`);
								return; 
							}
							try {
								tempConfig = JSON.parse(fs.readFileSync(path));
							} catch (e) {
								rejectSetup('Specified configuration file is in an unparsable format.');
								return;
							}

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
										// 	let modZipBuffer = Buffer.from(moduleZipBinary, 'base64');
										modZip.loadAsync(systemObject.ModCache[moduleType]).then(zip => {
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
											log.i(`[BOWER] Installed ${packageArray.join(', ')}`);
											res();
										});
									}
									let bowerComponentsDir = Path.join(CWD, 'Static',
										'bower_components');
									proc.execSync('bower install "--config.directory='
										+ `${bowerComponentsDir}" "${packageArray.join('" "')}"`);
									log.i(`[BOWER] Installed ${packageArray.join(', ')}`);
								}
								resolve();
							});

							//zip up the ModCache for export to the browser or other subsystems
							return await new Promise(resolveZip => {
								let zip = new jszip();
								let man = [];
								for (let folder in systemObject.ModCache) {
									let mod = systemObject.ModCache[folder];
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
										log.time('buildDir');
										let _return = await buildDir(dir);
										log.timeEnd('buildDir');
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
			log.i('=================================================');
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
				let ModulePromiseArray = [];
				for (let folder in ModCache) {
					ModulePromiseArray.push(cacheInterface.addModule(folder, ModCache[folder]));
				}
				await Promise.all(ModulePromiseArray);
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
				log.i(`=================================================${endOfLine}`);
				resolveMain();
			}
		}
	});
}