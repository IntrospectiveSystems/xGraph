(function () {
	return new Promise(async (resolve, reject) => {
		if (typeof state == "undefined") state = process.env.XGRAPH_ENV || "production";
		if (process.argv.indexOf("--debug") > -1 || process.argv.indexOf("--develop") > -1) state = 'develop';

		console.log(`\nInitializing the Compile Engine in ${state} Mode`);
		console.time('Genesis Runtime');

		const fs = require('fs');
		const date = new Date();
		const Path = require('path');
		let Uuid;
		let CacheDir;						// The location of where the Cache will be stored
		let Config = {};					// The read config.json
		let Apex = {};						// {<Name>: <pid of Apex>}
		let Modules = {};					// {<Name>: <mod desc>} - only in Genesis
		let ModCache = {};					// {<folder>: <module>}
		let packagejson = {};				// The compiled package.json, built from Modules
		let args = process.argv;			// The input argutments ----- should be removed ??
		let Params = {};					// The set of Macros for defining paths ---- should be removed??
		let CWD = '';						// The current working directory 

		//
		// Logging Functionality
		//
		{
			// The logging function for writing to xgraph.log to the current working directory
			const xgraphlog = (...str) => {
				fs.appendFile(process.cwd() + "/xgraph.log", str.join(" ") + "\n", (err) => {
					if (err) {
						console.error(err); process.exit(1); reject();
					}
				});
			};
			// The defined log levels for outputting to the std.out() (ex. log.v(), log.d() ...)
			// Levels include:
			// v : verbose
			// d : debug
			// i : info
			// w : warn
			// e : error
			const log = global.log = {
				v: (...str) => {
					console.log('\u001b[90m[VRBS]', ...str, '\u001b[39m');
					xgraphlog(...str);
				},
				d: (...str) => {
					console.log('\u001b[35m[DBUG]', ...str, '\u001b[39m');
					xgraphlog(...str);
				},
				i: (...str) => {
					console.log('\u001b[36m[INFO]', ...str, '\u001b[39m');
					xgraphlog(...str);
				},
				w: (...str) => {
					console.log('\u001b[33m[WARN]', ...str, '\u001b[39m');
					xgraphlog(...str);
				},
				e: (...str) => {
					console.log('\u001b[31m[ERRR]', ...str, '\u001b[39m');
					xgraphlog(...str);
				}
			};
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
		 * This includes defining macros and othre Params.
		 * Parse the config
		 * and Clean the cache if it currently exists
		 */
		function setup() {
			log.i('=================================================');
			log.i(`Genesis Setup:`);

			defineMacros();

			parseConfig();

			if (state == 'production') cleanCache();

			////////////////////////////////////////////////////////////////////////////////////////////////
			//
			// Only Function Definitions Beyond This Point
			//
			//

			/**
			 * Read in macros and set Params from process.argv
			 * these are also set in the birany in pathOverrides
			 * examples are  xGraph={path to xGraph} 
			 * in binary they look like --xGraph {path to xGraph}
			 */
			function defineMacros() {
				// Process input arguments and define macro parameters
				// All macros are stored case insensitive in the Params array

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
				if (!(typeof pathOverrides == "undefined")) {
					for (let key in pathOverrides) {
						Params[key] = pathOverrides[key];
					}
				}
			}
			
			/**
			 * Reads in the given config and fills in the Macros
			 */
			function parseConfig() {
				// Read in the provided config.json file
				// File is passed in Params.Config or defaults to "config.json" in current working directory
				let cfg = undefined;
				
				//set CWD
				CWD = Params.cwd ? Path.resolve(Params.cwd) : Path.resolve('.');
				log.v(`CWD set to ${CWD}`);
				// Directory is passed in Params.Cache or defaults to "cache" in the current working directory.
				CacheDir = Params.cache || Path.join(CWD, "cache");
				
				try {
					cfg = fs.readFileSync(Params.config || Path.join(CWD, 'config.json'));
				} catch (e) {
					log.e("Specified config.json does not exist");
					process.exit(1);
				}

				// Parse the config.json and replace Macros
				// Store all Macros in Params --- should be removed?
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
									//Params[subkey] = Config[subkey];
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
					log.v(`About to remove the cacheDir: "${CacheDir}"`);
					remDir(CacheDir);
					log.v(`Removed cacheDir: "{CacheDir}"`);
				}
			}
		}


		/**
		 * Builds a cache from a config.json. 
		 */
		async function genesis() {
			log.i('=================================================');
			log.i(`Genesis Compile Start:`);

			let ifolder, moduleKeys, nfolders;

			generateModuleCatalog();

			await recursiveBuild();


			////////////////////////////////////////////////////////////////////////////////////////////////
			//
			// Only Function Definitions Beyond This Point
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
						arr.forEach(function (mod) {
							log.v(`Defferring ${mod.Module || mod}`);
							if (typeof mod == 'string') {
								log.w('Adding Module names directly to Defferred is deprecated');
								log.w(`Defferring { Module: '${mod}' } instead`);
								mod = { Module: mod };
							}
							let folder = mod.Module.replace(/\//g, '.').replace(/:/g, '.');
							let source = mod.Source;
							if (!(folder in Modules)) {
								Modules[folder] = source;
							} else {
								if (Modules[folder] != source) {
									log.e("Broker Mismatch Exception");
									process.exit(2);
									reject();
								}
							}
						});
					} else {
						log.v(`Compiling ${Config.Modules[key].Module}`);
						if (typeof Config.Modules[key].Module != 'string') {
							log.e('Malformed Module Definition');
							log.e(JSON.stringify(Config.Modules[key], null, 2))
						}
						let folder = Config.Modules[key].Module.replace(/\//g, '.').replace(/:/g, '.');
						let source = Config.Modules[key].Source;
						if (!(folder in Modules)) {
							Modules[folder] = source;
						} else {
							if (Modules[folder] != source) {
								log.e("Broker Mismatch Exception");
								process.exit(2);
								reject();
							}
						}
					}
				}
				//prepare for looping over the module catalog
				ifolder = -1;
				moduleKeys = Object.keys(Modules);
				nfolders = moduleKeys.length;
			}

			/**
			 * get the modules from the prebuilt catalog
			 * from the source defined in config
			 */
			function recursiveBuild() {
				return new Promise(async (resolve, reject) => {
					ifolder++;

					if (ifolder >= nfolders) {
						await refreshSystem();
						await populate();
						return;
					}

					let folder = moduleKeys[ifolder];
					let modrequest = {
						"Module": folder,
						"Source": Modules[folder]
					};

					GetModule(modrequest, async function (err, mod) {
						ModCache[folder] = mod;
						await recursiveBuild();
						resolve();
					});
				});
			}

			/**
			 * Write the modules and all instances to the cache
			 */
			async function populate() {
				log.v('--populate : Writing Cache to Disk');
				// Write cache to CacheDir

				let npmDependenciesArray = [];
				for (let folder in ModCache) {
					let mod = ModCache[folder];
					let dir = CacheDir + '/' + folder;
					fs.mkdirSync(dir);
					log.v(`Writing Module ${folder} to ${CacheDir}`);
					let path = dir + '/Module.json';
					fs.writeFileSync(path, JSON.stringify(mod, null, 2));

					//install npm dependencies
					npmDependenciesArray.push(new Promise((resolve, reject) => {
						let packagejson;
						let mod = ModCache[folder];
						if ('package.json' in mod) {
							packagejson = JSON.parse(mod['package.json']);
						} else {
							resolve();
							return;
						}

						log.i(`${folder}: Updating and installing dependencies`);
						let strout = JSON.stringify(packagejson, null, 2);
						console.log(strout);
						//write the compiled package.json to disk

						fs.writeFileSync(Path.join(dir, 'package.json'), strout);

						//call npm install on a childprocess of node
						const proc = require('child_process');

						let npm = (process.platform === "win32" ? "npm.cmd" : "npm");
						let ps = proc.spawn(npm, ['install'], { cwd: Path.resolve(dir) });

						ps.stdout.on('data', _ => { process.stdout.write(`${folder}: ${_} `) });
						ps.stderr.on('data', _ => process.stderr.write(`${folder}: ${_} `));

						ps.on('err', function (err) {
							log.e('Failed to start child process.');
							log.e('err:' + err);
							reject(err);
						});

						ps.on('exit', function (code) {
							if (code == 0)
								log.i(`${folder}: dependencies installed correctly`);
							else {
								log.e(`${folder}: npm process exited with code: ${code}`);
								process.exit(1);
								reject();
							}
							fs.unlinkSync(Path.join(dir, 'package.json'));
							resolve();
						});
					}));
				}

				await Promise.all(npmDependenciesArray);

				// Assign pids to all instance in Config.Modules
				for (let instname in Config.Modules) {
					Apex[instname] = genPid();
				}
				log.v('Apex', JSON.stringify(Apex, null, 2));

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
					var folder = folder.replace(/\:/, '.').replace(/\//g, '.');
					var dirinst = CacheDir + '/' + folder + '/' + pidinst;
					fs.mkdirSync(dirinst);
					ents.forEach(function (ent) {
						let path = dirinst + '/' + ent.Pid + '.json';
						fs.writeFileSync(path, JSON.stringify(ent, null, 2));
					});
				}

				log.i(`Genesis Compile Stop: ${date.toString()}`);
				log.i('=================================================\n');
				console.timeEnd("Genesis Runtime");
				resolve();
			}
		}




		////////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Only Function Definitions Beyond This Point
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
			let mod = {};
			let ModName = modnam.replace(/\:/, '.').replace(/\//g, '.');


			//get the module from memory (ModCache) if it has already been retrieved
			if (ModName in ModCache) return fun(null, ModCache[ModName]);


			//get the module from the defined broker
			if (typeof source == "object") return loadModuleFromBroker();

			//get the module from file system
			loadModuleFromDisk()


			////////////////////////////////////////////////////////////////////////////////////////////////
			//
			// Only Function Definitions Beyond This Point
			//
			//

			/**
			 * open up a socket to the defined broker and access the module
			 */
			function loadModuleFromBroker() {
				const { Socket } = require('net');
				const sock = new Socket();
				const port = source.Port;
				const host = source.Host;
				let State;
				let Buf;
				sock.connect(port, host, function () { console.log("trying to connect") });
				sock.on('connect', function () {
					let cmd = {};
					cmd.Cmd = "GetModule";
					cmd.Module = modnam;
					let msg = `\u0002${JSON.stringify(cmd)}\u0003`;
					sock.write(msg);
					log.v(`Requested Module ${modnam} from Broker \n${JSON.stringify(source, null, 2)}`);
				});

				sock.on('error', (err) => {
					log.w(' ** Socket error:' + err);
				});

				sock.on('disconnect', (err) => {
					log.v(' ** Socket disconnected:' + err);
				});

				sock.on('data', function (data) {
					let nd = data.length;
					let i1 = 0;
					let i2;
					let STX = 2;
					let ETX = 3;
					if (State == 0)
						Buf = '';
					for (let i = 0; i < nd; i++) {
						switch (State) {
							case 0:
								if (data[i] == STX) {
									Buf = '';
									State = 1;
									i1 = i + 1;
								}
								break;
							case 1:
								i2 = i;
								if (data[i] == ETX)
									State = 2;
								break;
						}
					}
					switch (State) {
						case 0:
							break;
						case 1: {
							Buf += data.toString('utf8', i1, i2 + 1);
							break;
						}
						default: {
							Buf += data.toString('utf8', i1, i2);
							State = 0;
							let response = JSON.parse(Buf);
							module.paths = [Path.join(Path.resolve(CacheDir), 'node_modules')];
							const jszip = require("jszip");
							const zipmod = new jszip();

							zipmod.loadAsync(response.Module, { base64: true }).then(function (zip) {
								var dir = zipmod.file(/.*./);

								zip.file('module.json').async('string').then(function (str) {
									mod = JSON.parse(str);
									ModCache[ModName] = mod;
									fun(null, ModCache[ModName]);
								});
							});
						}
					}
				});
			}

			/**
			 * load module from disk
			 */
			function loadModuleFromDisk() {
				let dir = ModName.replace('.', ':').replace(/\./g, '/');
				let ModPath = genPath(dir);
				//read the module from path in the local file system
				//create the Module.json and add it to ModCache
				fs.readdir(ModPath, function (err, files) {
					if (err) {
						err += ' ** ERR:Module <' + ModPath + '? not available'
						log.e(err);
						fun(err);
						return;
					}
					var nfile = files.length;
					var ifile = -1;
					scan();

					function scan() {
						ifile++;

						if (ifile >= nfile) {
							mod.ModName = ModName;
							if ('schema.json' in mod) {
								var schema = JSON.parse(mod['schema.json']);
								if ('Apex' in schema) {
									var apx = schema.Apex;
									if ('$Setup' in apx)
										mod.Setup = apx['$Setup'];
									if ('$Start' in apx)
										mod.Start = apx['$Start'];
									if ('$Save' in apx)
										mod.Save = apx['$Save'];
								}
							}
							ModCache[ModName] = mod;
							fun(null, ModCache[ModName]);
							return;
						}
						var file = files[ifile];
						var path = ModPath + '/' + file;
						fs.lstat(path, function (err, stat) {
							if (stat) {
								if (!stat.isDirectory()) {
									fs.readFile(path, function (err, data) {
										if (err) {
											log.e(err);
											fun(err);
											return;
										}
										mod[file] = data.toString();
										scan();
										return;
									});
									return;
								}
							}
							scan();
						});
					}
				});
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
		 */
		async function compileInstance(pidapx, inst) {
			log.v('compileInstance', pidapx, inst);
			var Local = {};
			var modnam = inst.Module;
			var mod;
			var ents = [];
			var modnam = modnam.replace(/\:/, '.').replace(/\//g, '.');

			if (modnam in ModCache) {
				mod = ModCache[modnam];
			} else {
				log.e(' ** ERR:' + 'Module <' + modnam + '> not in ModCache');
				process.exit(1);
				reject();
				return;
			}
			var schema = JSON.parse(mod['schema.json']);
			var entkeys = Object.keys(schema);

			//set Pids for each entity in the schema
			for (j = 0; j < entkeys.length; j++) {
				let entkey = entkeys[j];
				if (entkey === 'Apex')
					Local[entkey] = pidapx;
				else
					Local[entkey] = genPid();
			}

			//unpack the par of each ent
			for (j = 0; j < entkeys.length; j++) {
				let entkey = entkeys[j];
				let ent = schema[entkey];
				ent.Pid = Local[entkey];
				ent.Module = modnam;
				ent.Apex = pidapx;

				//unpack the config pars to the par of the apex of the instance
				if (entkey == 'Apex' && 'Par' in inst) {
					var pars = Object.keys(inst.Par);
					for (var ipar = 0; ipar < pars.length; ipar++) {
						var par = pars[ipar];
						ent[par] = inst.Par[par];
					}
				}

				//load pars from schema
				var pars = Object.keys(ent);
				for (ipar = 0; ipar < pars.length; ipar++) {
					var par = pars[ipar];
					var val = ent[par];
					let asdf = symbol(val);
					ent[par] = await asdf;
				}
				ents.push(ent);
			}
			return ents;

			async function symbol(val) {
				// debugger;
				if (typeof val === 'object') {
					// log.d('object');
					if (Array.isArray(val)) {
						val.map(v => symbol(v));
						val = await Promise.all(val);
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
				if (val.charAt(0) === '$' && sym in Apex)
					return Apex[sym];
				if (val.charAt(0) === '#' && sym in Local)
					return Local[sym];
				if (val.charAt(0) === '\\')
					return sym;
				if (val.charAt(0) === '@') {
					// log.d(val)
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
							try {
								let path;
								let systemPath = Params.config ? Path.dirname(Params.config) : CWD;
								if (val[0] == '/')
									path = val;
								else
									path = Path.join(Path.resolve(systemPath), val);
								return fs.readFileSync(path).toString(encoding);
							} catch (err) {
								log.e("Error reading file ", path);
								log.w(`Module ${modnam} may not operate as expected.`);
							}
							break;
						}
						case "@folder":
						case "@directory": {
							try {
								let dir;
								let systemPath = Params.config ? Path.dirname(Params.config) : CWD;
								if (val[0] == '/')
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
								if (val[0] == '/')
									path = val;
								else
									path = Path.join(Path.resolve(systemPath), val);
								config = fs.readFileSync(path).toString(encoding);

								return await GenTemplate(config);

							} catch (err) {
								log.e("Error reading file ", path);
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
				log.i('--refreshSystems: Updating and installing dependencies\n');
				var packagejson = {};

				if (!packagejson.dependencies) packagejson.dependencies = {};

				//include Genesis/Nexus required npm modules
				packagejson.dependencies["uuid"] = "3.1.0";
				packagejson.dependencies["jszip"] = "~3.1.3";


				var strout = JSON.stringify(packagejson, null, 2);
				//write the compiled package.json to disk
				fs.mkdirSync(CacheDir);
				fs.writeFileSync(Path.join(Path.resolve(CacheDir), 'package.json'), strout);

				//call npm install on a childprocess of node
				const proc = require('child_process');

				var npm = (process.platform === "win32" ? "npm.cmd" : "npm");
				var ps = proc.spawn(npm, ['install'], { cwd: Path.resolve(CacheDir) });

				module.paths = [];
				module.paths.push([Path.resolve(CacheDir)]);

				ps.stdout.on('data', _ => { process.stdout.write(_) });
				ps.stderr.on('data', _ => process.stderr.write(_));

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
								throw 'Parameter <' + param + '> not defined';
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
				module.paths = [Path.join(Path.resolve(CacheDir), 'node_modules')];
				Uuid = require('uuid/v4');
			}
			var str = Uuid();
			var pid = str.replace(/-/g, '').toUpperCase();
			return pid;
		}

		/**
		 * build a path from the file system using defined Macros and Params
		 * @param {string} filein 
		 */
		function genPath(filein) {
			if (!filein) {
				log.e(' ** ERR:Invalid file name');
				return '';
			}
			var cfg = Params;
			var path;
			var parts;
			var file = filein;

			if (file.charAt(0) == '/')
				return file;

			if (file.charAt(0) == '{') { // Macro
				parts = file.split('}');
				if (parts.length != 2) {
					return;
				}
				var name = parts[0].substr(1).toLowerCase();
				if (name in Params) {
					path = Path.join(Params[name], parts[1]);
					return path;
				} else {
					log.e(' ** ERR:File <' + file + '> {' + name + '} not found');
					return;
				}
			}
			parts = file.split(':');
			if (parts.length == 2) {
				let key = parts[0].toLowerCase();
				if (key in Params) {
					path = Path.join(Params[key], parts[1]);
				} else {
					log.e(' ** ERR:File <' + file + '> prefix not defined');
					return;
				}
			} else {
				path = file;
			}
			return path;
		}



		/**
		 * Recursive directory deletion
		 * Used for cache cleanup
		 * @param {*} path the directory to be recursively removed 
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
			return new Promise((resolve, reject) => {

				let Config = {};
				let Modules = {};
				let ModCache = {};

				parseConfig(config);

				generateModuleCatalog();

				recursiveBuild();


				////////////////////////////////////////////////////////////////////////////////////////////////
				//
				// Only Function Definitions Beyond This Point
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
							arr.forEach(function (mod) {
								logModule(mod);
							});
						} else {
							logModule(Config.Modules[key]);
						}

						function logModule(mod) {
							let folder = mod.Module.replace(/\//g, '.').replace(/:/g, '.');
							let source = mod.Source;
							if (!(folder in Modules)) {
								Modules[folder] = source;
							} else {
								if (Modules[folder] != source) {
									log.e("Broker Mismatch Exception");
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
				async function recursiveBuild() {
					let modArray = [];
					let moduleKeys = Object.keys(Modules);

					//loop over module keys to build Promise array 
					for (let ifolder = 0; ifolder < moduleKeys.length; ifolder++) {
						modArray.push(new Promise((res, rej) => {
							let folder = moduleKeys[ifolder];

							let modrequest = {
								"Module": folder,
								"Source": Modules[folder]
							};

							GetModule(modrequest, function (err, mod) {
								if (err) { rej(err); reject(err); }
								else res(ModCache[folder] = mod);
							});
						}));
					}
					await Promise.all(modArray)

					populate();

					/**
					 * Write the modules.json to a zipped cache and set as Par.System 
					 */
					function populate() {
						const jszip = require("jszip");
						var zip = new jszip();
						var man = [];
						zip.folder("cache");
						for (let folder in ModCache) {
							let mod = ModCache[folder];
							if (typeof mod == "object")
								mod = JSON.stringify(mod);
							let dir = "cache/" + folder;
							zip.folder(dir);
							let path = dir + '/Module.json';
							man.push(path);
							zip.file(path, mod, {
								date: new Date("December 25, 2007 00:00:01")
								//the date is required for zip consistency
							});
						}
						zip.file('manifest.json', JSON.stringify(man), {
							date: new Date("December 25, 2007 00:00:01")
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
					// Store all Macros in Params --- should be removed?
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
			});
		}
	});

})();