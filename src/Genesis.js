module.exports = genesis;
function genesis(__options = {}) {
	

	function checkFlag(flag) {
		// console.dir(__options);
		return flag in __options && __options[flag];
	}

	if(!('state' in __options)) {
		__options.state = process.env.XGRAPH_ENV || "production";

		// console.error("[ERRR] No state was given to Genesis\r\n[ERRR] Exitting with code 1");
		// process.exit(1);
	}
	if(checkFlag("development") || checkFlag("debug")) {
		__options.state = 'development';
	}


	// if(!('pathOverrides' in options)) {
	// 	console.error("[ERRR] No pathOverrides was given to Genesis\r\n[ERRR] Exitting with code 1");
	// 	process.exit(1);
	// }
	return new Promise(async (resolve, reject) => {

		process.stdout.write(`Initializing the Compile Engine in ${__options.state} Mode \r\n`);

		const fs = require('fs');
		const Path = require('path');
		const endOfLine = require('os').EOL;
		const proc = require('child_process');
		const jszip = require("jszip");

		let log;
		let Uuid;
		let CacheDir;						// The location of where the Cache will be stored
		let Config = {};					// The parsed system configuration in JSON format
		let Apex = {};						// {<Name>: <pid of Apex>}
		let Modules = {};					// {<Name>: <mod desc>} - only in Genesis
		let ModCache = {};					// {<folder>: <module>}
		let args = process.argv;			// The input arguments --under consideration for deprication
		let Params = {};					// The set of Macros for defining paths
		let CWD = '';						// The current working directory

		//
		// Logging Functionality
		//
		{
			// The logging function for writing to xgraph.log to the current working directory
			const xgraphlog = (...str) => {
				fs.appendFile(`${process.cwd()}/xgraph.log`, `${str.join(" ")}${endOfLine}`, (err) => {
					if (err) {
						console.error(err); process.exit(1); reject();
					}
				});
			};
			// The defined log levels for outputting to the std.out() (ex. log. v(), log. d() ...)
			// Levels include:
			// v : verbose		Give too much information
			// d : debug		For debugging purposes not in production level releases
			// i : info			General info presented to the end user
			// w : warn			Failures that dont result in a system exit
			// e : error 		Critical failure should always follow with a system exit
			log = {
				v: (...str) => {
					process.stdout.write(`\u001b[90m[VRBS] ${log.parse(str)} \u001b[39m${endOfLine}`);
					xgraphlog(new Date().toString(), ...str);
				},
				d: (...str) => {
					process.stdout.write(`\u001b[35m[DBUG] ${log.parse(str)} \u001b[39m${endOfLine}`);
					xgraphlog(new Date().toString(), ...str);
				},
				i: (...str) => {
					process.stdout.write(`\u001b[36m[INFO] ${log.parse(str)} \u001b[39m${endOfLine}`);
					xgraphlog(new Date().toString(), ...str);
				},
				w: (...str) => {
					process.stdout.write(`\u001b[33m[WARN] ${log.parse(str)} \u001b[39m${endOfLine}`);
					xgraphlog(new Date().toString(), ...str);
				},
				e: (...str) => {
					process.stdout.write(`\u001b[31m[ERRR] ${log.parse(str)} \u001b[39m${endOfLine}`);
					xgraphlog(new Date().toString(), ...str);
				},
				parse: (str) => {
					try {
						let arr = [];
						for (let obj of str) {
							if (typeof obj == 'object') {
								if (obj.hasOwnProperty('toString')) arr.push(obj.toString())
								else {
									try {
										arr.push(JSON.stringify(obj, null, 2));
									} catch (e) {
										arr.push('Object keys: ' + JSON.stringify(Object.keys(obj), null, 2));
									}
								}
							} else if (typeof obj == 'undefined') {
								arr.push('undefined');
							} else {
								arr.push(obj.toString());
							}
						}
						return arr.join(' ');
					} catch (ex) {
						process.stdout.write('\n\n\n\u001b[31m[ERRR] An error has occurred trying to parse a log.\n\n');
						process.stdout.write(ex.toString() + '\u001b[39m');
					}

				}
			};
			console.microtime = _ => {
				let hrTime = process.hrtime();
				return (hrTime[0] * 1000000 + hrTime[1] / 1000);
			}
			console.time = _ => {
				console.timers = console.timers || {};
				console.timers[_] = console.microtime();
			}
			console.timeEnd = _ => {
				if (!(_ in (console.timers || {})))
					return;
				let elapsed = console.microtime() - console.timers[_];
				console.timers[_] = undefined;
				log.i(`${_}: ${elapsed}ms`);
			}
			process.on('unhandledRejection', event => {
				log.e('------------------ [Stack] ------------------');
				log.e(`line ${event.lineNumber}, ${event}`);
				log.e(event.stack);
				log.e('------------------ [/Stack] -----------------');
				process.exit(1);
			});
		}

		try {
			setup();
			await genesis();
		} catch (e) {
			log.e(e.toString());
			log.e((new Error().stack));
			reject(e);
		}
		////////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Only Function Definitions Beyond This Point
		//
		//


		/**
		 * The setup procedures for genesis.
		 * This includes defining macros and other parameters.
		 * Parse the configuration file
		 * and clean the cache.
		 */
		function setup() {
			log.i(`=================================================`);
			log.i(`Genesis Setup:`);

			defineMacros();

			parseConfig();

			cleanCache();

			////////////////////////////////////////////////////////////////////////////////////////////////
			//
			// Only Helper Functions Beyond This Point
			//
			//

			/**
			 * Read in macros and set parameters from process.argv
			 * these are also set in the binary in pathOverrides
			 * examples are  xGraph={path to xGraph}
			 * in binary they look like --xGraph {path to xGraph}
			 */
			function defineMacros() {
				// Process input arguments and define macro parameters
				// All macros are stored case insensitive in the Params object

				let arg, parts;
				for (var iarg = 0; iarg < args.length; iarg++) {
					arg = args[iarg];
					log.v(arg);
					parts = arg.split('=');
					if (parts.length == 2) {
						if (parts[1][0] != "/") parts[1] = Path.resolve(parts[1]);
						Params[parts[0].toLowerCase()] = parts[1];
					}
				}
				if (!(typeof __options == "undefined")) {
					for (let key in __options) {
						Params[key] = __options[key];
					}
				}

				//set CWD
				CWD = Params.cwd ? Path.resolve(Params.cwd) : Path.resolve('.');
				log.v(`CWD set to ${CWD}`);

				//set Cache location
				CacheDir = Params.cache || Path.join(CWD, 'cache');
			}

			/**
			 * Reads in the given config and fills in the Macros
			 */
			function parseConfig() {
				// Read in the provided config.json file
				// File is passed in Params.Config or defaults to "config.json" in current working directory
				let cfg = undefined;

				try {
					cfg = fs.readFileSync(Params.config || Path.join(CWD, 'config.json'));
				} catch (e) {
					log.e("Specified config.json does not exist");
					process.exit(1);
				}

				// Parse the config.json and replace Macros
				let val, sources, subval;
				if (cfg) {
					var ini = JSON.parse(cfg);
					if (typeof ini['Sources'] === 'undefined') {
						log.w('You have not defined Config.Sources.');
						log.w('this will likely break the compile process');
						log.w('')
					}
					for (let key in ini) {
						val = ini[key];
						if (key == "Sources") {
							Config.Sources = {};
							sources = ini["Sources"];
							for (let subkey in sources) {
								subval = sources[subkey];
								if (typeof subval == 'string') {
									Config.Sources[subkey] = Macro(subval);
								} else {
									Config.Sources[subkey] = subval;
								}
							}
						} else {
							Config[key] = val;
						}
					}
				} else {
					// No config was provided. Exit promptly.
					log.e(' ** No configuration file (config.json) provided');
					process.exit(1);
					reject();
				}

				// Print out the parsed config
				log.v(JSON.stringify(Config, null, 2));
			}

			/**
			 *  Remove the cache if it currently exists in the given directory
			 */
			function cleanCache() {
				// Remove the provided cache directory
				if (fs.existsSync(CacheDir)) {
					if (__options.state == 'development') {
						__options.state = 'updateOnly';
						return;
					}
					log.v(`About to remove the cacheDir: "${CacheDir}"`);
					remDir(CacheDir);
					log.v(`Removed cacheDir: "${CacheDir}"`);
				}
			}
		}

		/**
		 * Builds a cache from a config.json.
		 */
		async function genesis() {
			log.i('=================================================');
			log.i(`Genesis Compile Start:`);


			generateModuleCatalog();

			log.v(`About to load ${Object.keys(Modules)}`);

			await refreshSystem();

			await retrieveModules();

			await populate();


			////////////////////////////////////////////////////////////////////////////////////////////////
			//
			// Only Helper Functions Beyond This Point
			//
			//

			/**
			 * Create a list of all required modules and their brokers
			 */
			function generateModuleCatalog() {
				// Create new cache and install high level
				// module subdirectories. Each of these also
				// has a link to the source of that module (Module.json).
				var keys = Object.keys(Config.Modules);
				for (let i = 0; i < keys.length; i++) {
					let key = keys[i];
					if (key == 'Deferred') {
						var arr = Config.Modules[key];
						for (let idx = 0; idx < arr.length; idx++) {
							let mod = arr[idx];
							log.v(`Deferring ${mod.Module || mod}`);
							if (typeof mod == 'string') {
								log.w('Adding Module names directly to Deferred is deprecated');
								log.w(`Deferring { Module: '${mod}' } instead`);
								mod = { Module: mod };
							}
							logModule(mod);
						}
					} else {
						//log.v(`PreLoading ${Config.Modules[key].Module}`);
						if (typeof Config.Modules[key].Module != 'string') {
							log.e('Malformed Module Definition');
							log.e(JSON.stringify(Config.Modules[key], null, 2));
						}
						logModule(Config.Modules[key]);
					}

					/**
					 * Add the module to the Modules object if unique
					 * @param {object} mod 		The module object
					 * @param {string} mod.Module	The name of the module
					 * @param {object, string} mod.Source The Module broker or path reference
					 */
					function logModule(mod) {
						let folder = mod.Module.replace(/[\/\:]/g, '.');

						if (!("Source" in mod)) {
							log.e(`No Source Declared in module: ${key}: ${mod.Module}`);
							reject();
							process.exit(2);
							return;
						}

						let source = mod.Source;

						if (!(folder in Modules)) {
							Modules[folder] = source;
						} else {
							if (Modules[folder] != source) {
								log.e(`Broker Mismatch Exception: ${Modules[folder]} - ${source}`);
								process.exit(2);
								reject();
							}
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

						let modrequest = {
							"Module": folder,
							"Source": Config.Sources[Modules[folder]]
						};

						log.v(`Requesting ${modrequest.Module} from ${modrequest.Source}`);

						GetModule(modrequest, function (err, mod) {
							if (err) {
								log.w(`Failed to retreive ${folder}`);
								log.e(err);
								rej(err);
								reject(err);
							} else {
								log.v(`Successfully retrieved ${folder}`);
								res(ModCache[folder] = mod);
							}
						});
					}));
				}
				await Promise.all(modArray)
			}

			/**
			 * Write the modules and all instances to the cache
			 */
			async function populate() {
				log.v('--populate : Writing Cache to Disk');
				// Write cache to CacheDir
				let npmDependenciesArray = [];
				for (let folder in ModCache) {
					let entdir = Path.join(CacheDir, "System", folder);
					let libdir = Path.join(CacheDir, "Lib", folder);
					try { fs.mkdirSync(entdir); } catch (e) { }
					try { fs.mkdirSync(libdir); } catch (e) { }
					log.v(`Writing Module ${folder} to ${CacheDir}`);
					let path = Path.join(entdir, 'Module.zip');
					fs.writeFileSync(path, ModCache[folder]);

					const zipmod = new jszip();

					//install npm dependencies
					npmDependenciesArray.push(new Promise((resolve, reject) => {
						zipmod.loadAsync(ModCache[folder]).then(function (zip) {
							if ('package.json' in zip.files) {
								zip.file('package.json').async('string').then(function (packageString) {
									log.i(`${folder}: Installing dependencies`);
									log.v(packageString);

									//write the compiled package.json to disk
									fs.writeFileSync(Path.join(libdir, 'package.json'), packageString);
									//call npm install on a childprocess of node
									let npmCommand = (process.platform === "win32" ? "npm.cmd" : "npm");

									let npmInstallProcess = proc.spawn(npmCommand, ['install'], { cwd: Path.resolve(libdir) });
									

									npmInstallProcess.stdout.on('data', process.stdout.write);
									npmInstallProcess.stderr.on('data', process.stderr.write);

									npmInstallProcess.stdout.on('error', e => log.v('stdout/err: ' + e));
									npmInstallProcess.stderr.on('error', e => log.v('stderr/err: ' + e));

									npmInstallProcess.on('err', function (err) {
										log.e('Failed to start child process.');
										log.e('err:' + err);
										reject(err);
									});

									npmInstallProcess.on('exit', function (code) {
										process.stderr.write(`\r\n`);
										if (code == 0)
											log.i(`${folder}: dependencies installed correctly`);
										else {
											log.e(`${folder}: npm process exited with code: ${code}`);
											process.exit(1);
											reject();
										}
										fs.unlinkSync(Path.join(libdir, 'package.json'));
										resolve();
									});
								});
							} else {
								resolve();
							}
						});
					}));
				}

				
				try{
					await Promise.all(npmDependenciesArray);
				} catch(e) {
					console.dir(e);
					log.e(e.stack);
				}
				

				if (__options.state == 'updateOnly') {
					log.i(`Genesis Update Stop: ${new Date().toString()}`);
					log.i(`=================================================${endOfLine}`);
					resolve();
					return;
				}

				// Assign pids to all instance in Config.Modules
				for (let instname in Config.Modules) {
					if (instname == "Deferred")
						continue;
					Apex[instname] = genPid();
				}
				log.v('Apex List', JSON.stringify(Apex, null, 2));

				// Now populate all of the modules from config.json
				for (let instname in Config.Modules) {
					if (instname === 'Deferred')
						continue;
					var inst = Config.Modules[instname];
					log.v(instname, JSON.stringify(inst, null, 2));
					var pidinst = Apex[instname];
					var ents = await compileInstance(pidinst, inst);
					folder = inst.Module;
					// The following is for backword compatibility only
					var folder = folder.replace(/[\/\:]/g, '.');
					var dirinst = Path.join(CacheDir, 'System', folder, pidinst);
					try { fs.mkdirSync(dirinst); } catch (e) { }
					ents.forEach(function (ent) {
						let path = Path.join(dirinst, `${ent.Pid}.json`);
						fs.writeFileSync(path, JSON.stringify(ent, null, 2));
					});
				}

				log.i(`Genesis Compile Stop: ${new Date().toString()}`);
				log.i(`=================================================${endOfLine}`);
				resolve();
			}
		}




		////////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Only Helper Functions Beyond This Point
		//
		//


		/**
		 * For loading modules
		 * Modules come from a defined broker, or disk depending on the module definition
		 * @param {Object} modRequest
		 * @param {String} modRequest.Module the dot notation of the module name
		 * @param {String} modRequest.Source the source Broker or path reference for the module
		 * @param {Function} fun  the callback has form (error, module.json)
		 */
		function GetModule(modRequest, fun) {
			let modnam = modRequest.Module;
			let source = modRequest.Source;

			//get the module from memory (ModCache) if it has already been retrieved
			if (modnam in ModCache) { log.v(`${modnam} returned from ModCache`); return fun(null, ModCache[modnam]); }

			//get the module from the defined broker
			if (typeof source == "object") return loadModuleFromBroker();

			//get the module from file system
			loadModuleFromDisk()


			////////////////////////////////////////////////////////////////////////////////////////////////
			//
			// Only Helper Functions Beyond This Point
			//
			//

			/**
			 * open up a socket to the defined broker and access the module
			 */
			function loadModuleFromBroker() {
				const { Socket } = require('net');
				const sock = new Socket();
				const port = source.Port || source.port;
				const host = source.Host || source.host;
				var Buf = "";
				var State = 0;
				var tmp = new Buffer(2);
				tmp[0] = 2;
				tmp[1] = 3;
				var str = tmp.toString();
				let Read = {
					STX: tmp[0],
					ETX: tmp[1]
				};
				let Write = {
					STX: str.charAt(0),
					ETX: str.charAt(1)
				};

				sock.connect(port, host, function () { log.v("trying to connect") });
				sock.on('connect', function () {
					let cmd = {};
					cmd.Cmd = "GetModule";
					cmd.Name = modnam;

					let msg = `\u0002${JSON.stringify(cmd)}\u0003`;
					sock.write(msg);
					log.v(`Requested Module ${modnam} from Broker ${JSON.stringify(source, null, 2)}`);
				});

				sock.on('error', (err) => {
					log.w(err);
				});

				sock.on('disconnect', (err) => {
					log.v(err);
				});

				sock.on('data', function (data) {
					var Fifo = [];
					let sbstr = '';

					let regexBreak = new RegExp(Write.STX + '|' + Write.ETX);

					let str = data.toString();
					let cmds = str.split(regexBreak);

					while (cmds.length > 0) {
						sbstr = cmds.shift();
						if (sbstr.length == 0)
							continue;

						if (cmds.length > 0) {
							//then we do hit an etx before the end of the data set
							if (State == 1) {
								Buf += sbstr;
								var obj = JSON.parse(Buf);
								Fifo.push(obj);
								State = 0;
								continue;
							}

							var obj = JSON.parse(sbstr);
							Fifo.push(obj);
							continue;
						}

						if (State == 1) {
							Buf += sbstr;
							continue;
						}

						Buf = sbstr;
						State = 1;
					}

					processResponse();

					function processResponse() {
						if (Fifo.length < 1)
							return;

						let response = Fifo.shift();

						fun(null, response.Module);
					}
				});
			}

			/**
			 * load module from disk
			 */
			function loadModuleFromDisk() {
				(async () => {
					modnam = modnam.replace(/\./g, Path.sep);
					let ModPath = Path.join(source, modnam);

					//read the module from path in the local file system
					//create the Module.json and add it to ModCache
					let zipmod = new jszip();

					//recursively zip the module
					await zipDirChidren(zipmod, ModPath);

					zipmod.generateAsync({ type: "uint8array" }).then((dat, fail) => {
						if (fail) {
							log.w("Genesis failed to create zip.");
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
							err += ' \nModule \"' + containingPath + '\" not available'
							log.e(err);
							fun(err);
							return;
						}
						if (!files) {
							err += ' \nModule \"' + containingPath + '\" not available'
							log.e(err);
							fun(err);
							return;
						}
						for (let ifile = 0; ifile < files.length; ifile++) {
							var file = files[ifile];
							var path = containingPath + '/' + file;
							let stat = await new Promise(async (res, rej) => {
								fs.lstat(path, (err, stat) => {
									if (err) rej(err)
									else res(stat);
								})
							});

							if (stat) {
								if (!stat.isDirectory()) {
									try {
										var dat = fs.readFileSync(path);
									} catch (err) {
										log.e(`loadModuleFromDisk: error reading file ${path}: ${err}`);
									}
									ziproot.file(file, dat);
								} else {
									await zipDirChidren(ziproot.folder(file), path)
								}
							}
						}
					}
				})();
			}
		}

		//----------------------------------------------------CompileModule
		//

		/**
		 * Generate array of entities from module
		 * Module must be in cache
		 *
		 * @param {string} pidapx 		The first parameter is the pid assigned to the Apex
		 * @param {object} inst
		 * @param {string} inst.Module	The module definition in dot notation
		 * @param {object} inst.Par		The par object that defines the par of the instance
		 * @param {boolean} saveRoot	Add the setup and start functions to the Root.Setup and start
		 */
		async function compileInstance(pidapx, inst, saveRoot = false) {
			log.v('compileInstance', pidapx, JSON.stringify(inst, null, 2));

			function parseMacros(obj) {
				for(let key in obj) {
					if(typeof obj[key] == 'string') obj[key] = Macro(obj[key]);
					else if (typeof obj[key] == 'object') obj[key] = parseMacros(obj[key]);
				}
				return obj;
			}
			inst = parseMacros(inst);
			log.v('parseMacros', pidapx, JSON.stringify(inst, null, 2));

			var Local = {};
			var modnam = inst.Module;
			var mod;
			var ents = [];
			var modnam = modnam.replace(/[\/\:]/g, '.');
			var zipmod = new jszip();

			if (modnam in ModCache) {
				mod = await new Promise(async (res, rej) => {
					zipmod.loadAsync(ModCache[modnam]).then((zip) => {
						res(zip);
					});
				});
			} else {
				log.e('Module <' + modnam + '> not in ModCache');
				process.exit(1);
				reject();
				return;
			}

			var schema = await new Promise(async (res, rej) => {
				if ('schema.json' in mod.files) {
					mod.file('schema.json').async('string').then(function (schemaString) {
						res(JSON.parse(schemaString));
					});
				} else {
					log.e('Module <' + modnam + '> schema not in ModCache');
					process.exit(1);
					rej();
					reject();
					return;
				}
			});

			var entkeys = Object.keys(schema);
			if(!('Apex' in schema)) {
				log.v("keys in schema.json");
				log.v(Object.keys(schema).join('\r\n'));
				throw new SyntaxError("Apex key not present in schema.json.");
			}

			//set Pids for each entity in the schema
			for (j = 0; j < entkeys.length; j++) {
				let entkey = entkeys[j];
				if (entkey === 'Apex')
					Local[entkey] = pidapx;
				else
					Local[entkey] = genPid();
			}


			//unpack the par of each ent
			log.v('Phase 1');
			for (j = 0; j < entkeys.length; j++) {
				let entkey = entkeys[j];
				//start with the pars from the schema
				let ent = schema[entkey];
				ent.Pid = Local[entkey];
				ent.Module = modnam;
				ent.Apex = pidapx;

				//load the pars from the config
				//these only apply to the Apex entity
				//config takes precedence so we unpack it last
				if (entkey == 'Apex' && 'Par' in inst) {
					var pars = Object.keys(inst.Par);
					for (var ipar = 0; ipar < pars.length; ipar++) {
						var par = pars[ipar];
						ent[par] = inst.Par[par];
					}
				}

				//iterate over all the pars to pars out symbols
				var pars = Object.keys(ent);
				for (ipar = 0; ipar < pars.length; ipar++) {
					var par = pars[ipar];
					var val = ent[par];
					ent[par] = await symbolPhase1(val);
				}
				ents.push(ent);
			}

			log.v('Phase 2');
			for (j = 0; j < entkeys.length; j++) {
				let entkey = entkeys[j];
				//start with the pars from the schema
				let ent = schema[entkey];
				//iterate over all the pars to pars out symbols
				var pars = Object.keys(ent);
				for (ipar = 0; ipar < pars.length; ipar++) {
					var par = pars[ipar];
					var val = ent[par];
					ent[par] = await symbolPhase2(val);
				}
				ents.push(ent);
			}

			return ents;

			async function symbolPhase1(val) {
				//recurse if needed
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

				// if its not a string or if its a string, but not an @ directive
				// we just pass it on to the next phase by returning it unchanged
				if (typeof val !== 'string' || (!val.startsWith('@')))
					return val;
				if (val.charAt(0) === '@') {
					let directive = val.substr(0);
					val = val.split(":");
					let key = val[0].toLocaleLowerCase().trim();
					let encoding = undefined;
					if (key.split(",").length == 2) {
						key = key.split(',')[0].trim();
						let encoding = key.split(',')[1].trim();
					}
					val = val.slice(1).join(':').trim();
					switch (key) {
						case "@system": {
							let path, config;
							try {
								let systemPath = Params.config ? Path.dirname(Params.config) : CWD;

								if (Path.isAbsolute(val))
									path = val;
								else {
									path = Path.join(Path.resolve(systemPath), val);
								}

								config = fs.readFileSync(path).toString(encoding);

								let systemObject = await GenTemplate(config);

								try{fs.mkdir('Static')}catch(e){}

								await new Promise(resolve => {
									let zip = new jszip();
									zip.loadAsync(Buffer.from(systemObject.Cache, 'base64')).then(async (a) => {
										// console.dir(a);
										for(let key in a.files) {
											if(key === 'manifest.json') continue;
											let modZip = new jszip()
											let moduleZipBinary = await new Promise((res) => zip.file(key).async('base64').then(a => res(a)))
											modZip = await new Promise ((res) => {
												// log.i('HERE', key);
												modZip.loadAsync(Buffer.from(moduleZipBinary, 'base64')).then(zip => {
													// log.i('HERE', key);
													res(zip);
												});
											});
											if('bower.json' in modZip.files) {
												let bowerjson = await new Promise((res) => modZip.file('bower.json').async('string').then(a => res(a)));
												let dependencies = JSON.parse(bowerjson).dependencies;
												let packageArray = [];
												for(let bowerModuleName in dependencies) {
													if(dependencies[bowerModuleName].indexOf('/') > 0)
														packageArray.push(`${dependencies[bowerModuleName]}`);
													else
														packageArray.push(`${bowerModuleName}#${dependencies[bowerModuleName]}`);
												}
												// packageArray = ['PolymerVis/monaco-editor#1.0.0', 'jquery#^3.0.0']
												await new Promise (res => {
													proc.execSync(`bower install "--config.directory=${Path.join(__options.cwd, 'Static', 'bower_components')}" "${packageArray.join('" "')}"`);
													log.i(`[BOWER] Installed ${packageArray.join(', ')}`);
													res();

													// if we can even do programmatic bower, this.
													// bower.commands.install(packageArray, {}, {directory: 'Static'}).on('end', installed => {
													// 	let pkgs = [];
													// 	for(let _package in installed) {
													// 		let pkg = installed[_package].pkgMeta
													// 		pkgs.push(pkg.name + "#" + pkg.version);
													// 	}
													// 	if(pkgs.length == 0)
													// 		log.i('[BOWER] Nothing to install')
													// 	else
													// 		log.i(`[BOWER] Installed ${pkgs.join(', ')}`);
													// 	res();
													// });
												});
											}
										}
										resolve();
									});
								});

								return systemObject;

							} catch (err) {
								log.e("@system: (compileInstance) Error reading file ", path);
								log.w(`Module ${modnam} may not operate as expected.`);
							}
							break;
						}
						default: {
							log.v(`Passing '${directive}' to phase 2`);
							return directive;
						}
					}
				}
				return val;
			}

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
				if (typeof val !== 'string')
					return val;
				var sym = val.substr(1);
				if (val.charAt(0) === '$' && sym in Apex)
					return Apex[sym];
				if (val.charAt(0) === '#' && sym in Local)
					return Local[sym];
				if (val.charAt(0) === '\\')
					return sym;
				if (val.charAt(0) === '@') {
					let directive = val.substr(0);
					val = val.split(":");
					let key = val[0].toLocaleLowerCase().trim();
					let encoding = undefined;
					if (key.split(",").length == 2) {
						key = key.split(',')[0].trim();
						let encoding = key.split(',')[1].trim();
					}
					val = val.slice(1).join(':').trim();
					switch (key) {
						case "@filename":
						case "@file": {
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
								log.e("@file: (compileInstance) Error reading file ", path);
								log.w(`Module ${modnam} may not operate as expected.`);
							}
							break;
						}
						case "@folder":
						case "@directory": {
							log.v(`Compiling ${directive}`);
							try {
								let dir;
								let systemPath = Params.config ? Path.dirname(Params.config) : CWD;
								if (Path.isAbsolute(val))
									dir = val;
								else
									dir = Path.join(Path.resolve(systemPath), val);
								return buildDir(dir);

								function buildDir(path) {
									let dirObj = {};
									if (fs.existsSync(path)) {
										files = fs.readdirSync(path);
										files.forEach(function (file, index) {
											var curPath = path + "/" + file;
											if (fs.lstatSync(curPath).isDirectory()) {
												// recurse
												dirObj[file] = buildDir(curPath);
											} else {
												dirObj[file] = fs.readFileSync(curPath).toString(encoding);
											}
										});
										return dirObj;
									}
								}
							} catch (err) {
								log.e("Error reading directory ", path);
								log.w(`Module ${modnam} may not operate as expected.`);
							}
							break;
						}
						default: {
							log.w(`Key ${key} not defined. Module ${modnam} may not operate as expected.`);
						}
					}
				}
				return val;
			}
		}


		/**
		 * Reconstruct package.json and node_modules
		 * directory by merging package.json of the
		 * individual modules and then running npm
		 * to create node_modules directory for system
		 * @callback func what to do next
		 */
		function refreshSystem() {
			return new Promise((resolve, reject) => {
				log.i(`--refreshSystems: Installing xgraph dependencies${endOfLine}`);
				var packagejson = {};

				if (!packagejson.dependencies) packagejson.dependencies = {};

				//include Genesis/Nexus required npm modules
				// packagejson.dependencies["uuid"] = "3.1.0";
				// packagejson.dependencies["jszip"] = "3.1.3";


				var packageString = JSON.stringify(packagejson, null, 2);
				//write the compiled package.json to disk
				try { fs.mkdirSync(CacheDir); } catch (e) {}
				try { fs.mkdirSync(Path.join(Path.resolve(CacheDir), 'System')); } catch (e) {}
				try { fs.mkdirSync(Path.join(Path.resolve(CacheDir), 'Lib')); } catch (e) {}

				fs.writeFileSync(Path.join(Path.resolve(CacheDir), 'package.json'), packageString);
				fs.writeFileSync(Path.join(Path.resolve(CacheDir), '.cache'), JSON.stringify({
					version: '1.3.0'
				}, '\t', 1));

				//call npm install on a childprocess of node

				var npm = (process.platform === "win32" ? "npm.cmd" : "npm");
				var ps = proc.spawn(npm, ['install'], { cwd: Path.resolve(CacheDir) });

				// module.paths = [Path.join(Path.resolve(CacheDir), 'node_modules')];

				ps.stdout.on('data', _ => {
					// process.stdout.write(_) 
				});
				ps.stderr.on('data', _ => {
					//process.stderr.write(_)
				});


				ps.on('err', function (err) {
					log.e('Failed to start child process.');
					log.e('err:' + err);
				});

				ps.on('exit', async function (code) {
					if (code == 0)
						log.i('dependencies installed correctly');
					else {
						log.e('npm process exited with code:' + code);
						process.exit(1);
						reject();
					}
					fs.unlinkSync(Path.join(Path.resolve(CacheDir), 'package.json'));
					resolve();
				});
			});
		}

		/**
		 * replace the macros for local path info
		 * @param {string} str the string which to return the macro of
		 */
		function Macro(str) {
			let state = 1;
			let chr;
			let s = '';
			let param;
			for (let i = 0; i < str.length; i++) {
				chr = str.charAt(i);
				switch (state) {
					case 1:
						if (chr == '{') {
							param = '';
							state = 2;
						} else {
							s += chr;
						}
						break;
					case 2:
						if (chr == '}') {
							param = param.toLowerCase();
							if (param in Params)
								s += Params[param];
							else
								throw 'Required command line parameter <' + param + '> is not defined.';
							state = 1;
						} else {
							param += chr;
						}
						break;
				}
			}
			if (state != 1)
				throw 'Curley brackets not matched in __Macro';
			return s;
		}

		/**
		 * generate a 32 character hex pid
		 */
		function genPid() {
			if (!Uuid) {
				// module.paths = [Path.join(Path.resolve(CacheDir), 'node_modules')];
				Uuid = require('uuid/v4');
			}
			var str = Uuid();
			var pid = str.replace(/-/g, '').toUpperCase();
			return pid;
		}

		/**
		 * Recursive directory deletion
		 * Used for cache cleanup
		 * @param {string} path the directory to be recursively removed
		 */
		function remDir(path) {
			
			var files = [];
			if (fs.existsSync(path)) {
				files = fs.readdirSync(path);
				files.forEach(function (file, index) {
					var curPath = path + "/" + file;
					if (fs.lstatSync(curPath).isDirectory()) {
						// recurse
						remDir(curPath);
					} else {
						// delete file
						fs.unlinkSync(curPath);
					}
				});
				fs.rmdirSync(path);
			}
		}

		function GenTemplate(config) {
			return new Promise(async (resolve, reject) => {

				let Config = {};
				let Modules = {};
				let ModCache = {};

				parseConfig(config);

				await generateModuleCatalog();

				await retrieveModules();


				/////////////////////////////////////////////////////////////////////////////////////////////
				//
				// Only Helper Functions Beyond This Point
				//
				//

				/**
				 * Create a list of all required modules and their brokers
				 */
				async function generateModuleCatalog() {
					// Create new cache and install high level
					// module subdirectories. Each of these also
					// has a link to the source of that module (Module.zip).
					for(let key in Config.Modules) {
						if (key == 'Deferred') {
							var arr = Config.Modules[key];
							for (let idx = 0; idx < arr.length; idx++) {
								if (typeof arr[idx] == 'string') {
									log.w('Adding Module names directly to Deferred is deprecated');
									log.w(`Deferring { Module: '${arr[idx]}' } instead`);
									mod = { Module: arr[idx] };
								}
								await logModule(arr[idx]);
							}
						} else {
							if (typeof Config.Modules[key].Module != 'string') {
								log.e('Malformed Module Definition');
								log.e(JSON.stringify(Config.Modules[key], null, 2));
							}
							await logModule(Config.Modules[key]);
						}

						/**
						 * Add the module to the Modules object if unique
						 * @param {object} mod 		The module object
						 * @param {string} mod.Module	The name of the module
						 * @param {object, string} mod.Source The Module broker or path reference
						 */
						async function logModule(mod) {
							let folder = mod.Module.replace(/[\/\:]/g, '.');

							if (!("Source" in mod)) {
								log.e(`No Source Declared in module: ${key}: ${mod.Module}`);
								reject();
								process.exit(2);
								return;
							}

							let source = mod.Source;

							if (!(folder in Modules)) {
								Modules[folder] = source;
							} else {
								if (Modules[folder] != source) {
									log.e(`Broker Mismatch Exception: ${Modules[folder]} - ${source}`);
									process.exit(2);
									reject();
								}
							}

							for (let key in mod.Par) {
								mod.Par[key] = await symbol(mod.Par[key])
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

							let modrequest = {
								"Module": folder,
								"Source": Config.Sources[Modules[folder]]
							};

							log.v(`Requesting Module:${modrequest.Module} from Source:${modrequest.Source}`);

							GetModule(modrequest, function (err, mod) {
								if (err) {
									log.w(`Failed to retreive ${folder}`);
									log.e(err);
									rej(err);
									reject(err);
								}
								else {
									log.v(`Successfully retrieved ${folder}`);
									res(ModCache[folder] = mod);
								}
							});
						}));
					}
					await Promise.all(modArray)

					populate();

					/**
					 * Write the modules.json to a zipped cache and set as Par.System
					 */
					function populate() {
						var zip = new jszip();
						var man = [];
						for (let folder in ModCache) {
							let mod = ModCache[folder];
							// let dir = folder;
							//zip.folder(folder);
							// let path = dir;
							man.push(folder);
							zip.file(folder, mod, {
								date: new Date("April 2, 2010 00:00:01")
								//the date is required for zip consistency
							});
						}
						zip.file('manifest.json', JSON.stringify(man), {
							date: new Date("April 2, 2010 00:00:01")
							//the date is required for zip consistency
						});
						zip.generateAsync({ type: 'base64' }).then(function (data) {
							resolve({
								"Config": Config,
								"Cache": data
							});
						});
					}
				}

				/**
				* Read in the given config and fill in the Macros
				*/
				function parseConfig(cfg) {
					// Parse the config.json and replace Macros
					let val, sources, subval;
					var ini = JSON.parse(cfg);
					for (let key in ini) {
						val = ini[key];
						if (key == "Sources") {
							Config.Sources = {};
							sources = ini["Sources"];
							for (let subkey in sources) {
								subval = sources[subkey];
								if (typeof subval == 'string') {
									Config.Sources[subkey] = Macro(subval);
								} else {
									Config.Sources[subkey] = subval;
								}
							}
						} else {
							Config[key] = val;
						}
					}
				}

				async function symbol(val) {
					if (typeof val === 'object') {
						if (Array.isArray(val)) {
							val = await Promise.all(val.map(v => symbol(v)));
						} else {
							for (let key in val) {
								val[key] = await symbol(val[key]);
							}
						}
						return val;
					}
					if (typeof val !== 'string')
						return val;
					var sym = val.substr(1);
					if (val.charAt(0) === '\\')
						return sym;
					if (val.charAt(0) === '@') {
						val = val.split(":");
						let key = val[0].toLocaleLowerCase().trim();
						let encoding = undefined;
						if (key.split(",").length == 2) {
							key = key.split(',')[0].trim();
							let encoding = key.split(',')[1].trim();
						}
						val = val.slice(1).join(':').trim();
						switch (key) {
							case "@filename":
							case "@file": {
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
									log.e("@file: (generateModuleCatalog) Error reading file ", path);
									log.w(`Module ${modnam} may not operate as expected.`);
								}
								break;
							}
							case "@folder":
							case "@directory": {
								try {
									let dir;
									let systemPath = Params.config ? Path.dirname(Params.config) : CWD;
									if (Path.isAbsolute(val))
										dir = val;
									else
										dir = Path.join(Path.resolve(systemPath), val);
									return buildDir(dir);

									function buildDir(path) {
										let dirObj = {};
										if (fs.existsSync(path)) {
											files = fs.readdirSync(path);
											files.forEach(function (file, index) {
												var curPath = path + "/" + file;
												if (fs.lstatSync(curPath).isDirectory()) {
													// recurse
													dirObj[file] = buildDir(curPath);
												} else {
													dirObj[file] = fs.readFileSync(curPath).toString(encoding);
												}
											});
											return dirObj;
										}
									}
								} catch (err) {
									log.e("Error reading directory ", path);
									log.w(`Module ${modnam} may not operate as expected.`);
								}
								break;
							}
							case "@system": {
								try {
									let path, config;
									let systemPath = Params.config ? Path.dirname(Params.config) : CWD;
									if (Path.isAbsolute(val))
										path = val;
									else {
										path = Path.join(Path.resolve(systemPath), val);
									}
									config = fs.readFileSync(path).toString(encoding);
									return await GenTemplate(config);
								} catch (err) {
									log.e("@system: (generateModuleCatalog) Error reading file ", path);
									log.w(`Module ${modnam} may not operate as expected.`);
								}
								break;
							}
							default: {
								log.w(`Key ${key} not defined. Module ${modnam} may not operate as expected.`);
							}
						}
					}
					return val;
				}
			});
		}
	});
};
