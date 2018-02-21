pidInterchange = (pid) => { return { Value: pid, Format: 'is.xgraph.pid', toString: function () { return this.Value } } };
(async function () {
	if (typeof state == "undefined") state = process.env.XGRAPH_ENV || "production";
	if (process.argv.indexOf("--debug") > -1 || process.argv.indexOf("--development") > -1) {
		state = 'development';
	}

	console.log(`\nInitializing the Run Engine`);

	const fs = require('fs');
	const Path = require('path');
	const jszip = require("jszip");
	const endOfLine = require('os').EOL;
	var consoleNotification = false;
	var Uuid;
	var CacheDir;						// The location of where the Cache will be stored
	var Config = {};					// The read config.json
	var ModCache = {};					// {<folder>: <module>}
	var ApexIndex = {}; 				// {<Apex pid>:<folder>}
	var Setup = {};						// {<Apex pid>:<function>}
	var Start = {};						// {<Apex pid>:<function>}
	var EntCache = {};					// {<Entity pid>:<Entity>
	var ImpCache = {};					// {<Implementation path>: <Implementation(e.g. disp)>}
	var packagejson = {};				// The compiled package.json, built from Modules
	var args = process.argv;			// The input arguments --under consideration for deprication 
	var Params = {};					// The set of Macros for defining paths 
	var Nxs = {
		genPid,
		genModule,
		addModule,
		genEntity,
		deleteEntity,
		saveEntity,
		getFile,
		GetModule,
		loadDependency,
		sendMessage
	};

	//
	// Logging Functionality
	//
	{
		// The logging function for writing to xgraph.log to the current working directory
		const xgraphlog = (...str) => {
			fs.appendFile(`${process.cwd()}/xgraph.log`, `${log.parse(str)}${endOfLine}`, (err) => {
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
		const log = global.log = {
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
							if (obj == null) arr.push('NULL');
							else if (obj.hasOwnProperty('toString')) arr.push(obj.toString())
							else {
								try {
									arr.push(JSON.stringify(obj, null, 2));
								} catch (e) {
									arr.push('Object keys: ' + JSON.stringify(Object.keys(obj), null, 2));
								}
							}
						} else if(typeof obj == 'undefined') {
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
		console.log = function (...str) {
			if (consoleNotification) {
				process.stdout.write(`${str.join(' ')}${endOfLine}`);
			} else {
				consoleNotification = true;
				log.w('console.log does not write to xgraph.log consider using log levels\n'
					+ `       - log.i(), log.v(), log.d(), log.e(), or log.w()`);
				process.stdout.write(`${str.join(' ')}${endOfLine}`);
			}
		}
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

	log.i('=================================================');
	log.i(`Nexus Warming Up:`);

	defineMacros();

	// if called from binary quit or if called from 
	// the command line and node build cache first
	if (!fs.existsSync(CacheDir) || (state == "development")) {
					log.e(`No cache exists at ${CacheDir}. Try xgraph run`);
			process.exit(1);
			return;
				}

	initiate();



	////////////////////////////////////////////////////////////////////////////////////////////////
	//
	// Only Function Definitions Beyond This Point
	//
	//

	/**
	 * Populates Params {OBJECT} 
	 * This is populated from both the process.argv array as well as those parsed in the 
	 * binary file if it was used. 
	 * Such asignments are of the form Config=... Cache=... or paths xGraph=....
	 */
	function defineMacros() {
		// Process input arguments and define macro parameters
		// All macros are stored case insensitive in the Params object

		let arg, parts;
		for (var iarg = 0; iarg < args.length; iarg++) {
			arg = args[iarg];
			try {
				let jarg = JSON.parse(arg);
				for (let key in jarg) {
					log.v(`${key}=${jarg[key]}`);
					Params[key] = jarg[key];
				}
			} catch (e) {
				log.v(arg);
				parts = arg.split('=');
				if (parts.length == 2) {
					if (parts[1][0] != "/") parts[1] = Path.resolve(parts[1]);
					Params[parts[0].toLowerCase()] = parts[1];
				}
			}
		}

		//set CWD
		CWD = Params.cwd ? Path.resolve(Params.cwd) : Path.resolve('.');
		log.v(`CWD set to ${CWD}`);

		//set Cache location
		CacheDir = Params.cache || Path.join(CWD, 'cache');
	}

	/**
	 *  The main process of starting an xGraph System.
	 */
	async function initiate() {
		log.i(`--Nexus/Initiate`);
		ApexIndex = {};
		Setup = {};
		Start = {};

		loadCache();

		await setup();

		await start();

		run();

		////////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Only Helper Functions Beyond This Point
		//
		//

		/**
		 * Load in the cache and poulate setup Setup, Start, and ApexIndex {Objects}
		 */
		function loadCache() {
			var folders = fs.readdirSync(CacheDir);

			for (var ifold = 0; ifold < folders.length; ifold++) {
				let folder = folders[ifold];
				let path = `${CacheDir}/${folder}/Module.zip`;
				if (!fs.existsSync(path))
					continue;

				parseMod(folder)

				function parseMod(folder) {
					let dir = CacheDir + '/' + folder;
					var instancefiles = fs.readdirSync(dir);
					for (var ifile = 0; ifile < instancefiles.length; ifile++) {
						var file = instancefiles[ifile];

						//check that it's an instance of the module
						if (file.length !== 32)
							continue;

						var path = dir + '/' + file;
						if (fs.lstatSync(path).isDirectory()) {
							ApexIndex[file] = folder;
							let instJson = JSON.parse(fs.readFileSync(`${path}/${file}.json`));

							if ('$Setup' in instJson)
								Setup[file] = instJson.$Setup;
							if ('$Start' in instJson)
								Start[file] = instJson.$Start;
						}
					}
				}
			}

			log.v('ApexIndex', JSON.stringify(ApexIndex, null, 2));
			log.v('Setup', JSON.stringify(Setup, null, 2));
			log.v('Start', JSON.stringify(Start, null, 2));
		}

		/**
		 * Call setup on the required Module Apexes
		 */
		async function setup() {
			log.i(`--Nexus/Setup`);
			//build the setup promise array
			let setupArray = [];

			for (let pid in Setup) {
				setupArray.push(new Promise((resolve, reject) => {
					var com = {};
					com.Cmd = Setup[pid];
					com.Passport = {};
					com.Passport.To = pid;
					com.Passport.Pid = genPid();
					sendMessage(com, resolve);
				}));
			}

			await Promise.all(setupArray);
			log.v(`--Nexus: All Setups Complete`);
		}

		/**
		 * Call Start on the required Module Apexes
		 */
		async function start() {
			log.i(`--Nexus/Start`);
			//build the setup promise array
			let startArray = [];

			for (let pid in Start) {
				startArray.push(new Promise((resolve, reject) => {
					var com = {};
					com.Cmd = Start[pid];
					com.Passport = {};
					com.Passport.To = pid;
					com.Passport.Pid = genPid();
					sendMessage(com, resolve);
				}));
			}

			await Promise.all(startArray);
			log.v(`--Nexus: All Starts Complete`);
		}

		/**
		 * Send Finished command if the process was generated 
		 */
		function run() {
			log.i(`--Nexus/Run`);
			if ('send' in process) {
				process.send('{"Cmd":"Finished"}');
			}
		}
	}

	//
	//
	// Helper Functions as well as Entity definition
	//
	//


	

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
	 * Send a message from an entity to an Apex entity.
	 * If a callback is provided, return when finished
	 * @param {object} com 			the message object 
	 * @param {string} com.Cmd 		the command of the message
	 * @param {object} com.Passport	the information about the message
	 * @param {string} com.Passport.To the Pid of the recipient module
	 * @param {string} com.Passport.Pid the ID of the message
	 * @param {string=} com.Passport.From the Pid of the sending module
	 * @callback fun 				the callback function to return to when finished
	 */
	function sendMessage(com, fun = _ => _) {
		// log.d('NEXUS MESSAGE:', com)
		if (!('Passport' in com)) {
			log.w('Message has no Passport, ignored');
			log.w('    ' + JSON.stringify(com));
			fun('No Passport');
			return;
		}
		if (!('To' in com.Passport) || !com.Passport.To) {
			log.w('Message has no destination entity, ignored');
			log.w('    ' + JSON.stringify(com));
			console.trace();
			fun('No recipient in message', com);
			return;
		}
		if (!('Pid' in com.Passport)) {
			log.w('Message has no message id, ignored');
			log.w('    ' + JSON.stringify(com));
			fun('No message id', com);
			return;
		}

		let pid = com.Passport.To;
		let apx = com.Passport.Apex || pid;

		if (pid in EntCache) {
			done(null, EntCache[pid]);
			return;
		} else {
			getEntityContext(apx, pid, done);
		}

		function done(err, entContext) {
			if (err) {
				log.w(err);
				log.w(JSON.stringify(com, null, 2));
				fun(err, com);
				return;
			}
			
			if ((pid in ApexIndex) || (entContext.Par.Apex == apx)) {
				entContext.dispatch(com, reply);
			} else {
				let err = 'Trying to send a message to a non-Apex'
					+ 'entity outside of the sending module';
					log.w(err);
					log.w(JSON.stringify(com, null, 2));
					fun(err, com);
			}
		}
		function reply(err, q) {
			// log.i('NEXUS MESSAGE:', com)
			fun(err, q);
		}
	}



	/**
	 * The base class for all xGraph Entities
	 * @param {object} nxs 	the nxs context to give the entity acess too
	 * @param {object} imp 	the evaled Entity functionality returned by the dispatch table
	 * @param {object} par	the par of the entity 
	 */
	function Entity(nxs, imp, par) {
		var Par = par;
		var Imp = imp;
		var Vlt = {};

		return {
			Par,
			Vlt,
			dispatch,
			genModule,
			genModules,
			addModule,
			genEntity,
			deleteEntity,
			genPid,
			send,
			save,
			getFile,
			require
		};

		/**
		 * load a dependency for a module
		 * @param {string} string 	the string of the module to require/load
		 */
		function require(string) {
			return nxs.loadDependency(Par.Apex, Par.Pid, string);
		}

		/**
		 * get a file in the module.json module definition
		 * @param {string} filename  	The file to get from this module's module.json
		 * @callback fun 				return the file to caller
		 */
		function getFile(filename, fun) {
			log.v(`Entity - Getting file ${filename} from ${Par.Module}`);
			nxs.getFile(Par.Module, filename, fun);
		}

		/**
		 * Route a message to this entity with its context
		 * @param {object} com		The message to be dispatched in this entities context 
		 * @param {string} com.Cmd	The actual message we wish to send
		 * @callback fun 
		 */
		function dispatch(com, fun = _ => _) {
			var disp = Imp.dispatch;
			if (com.Cmd in disp) {
				disp[com.Cmd].call(this, com, fun);
				return;
			}
			if ('*' in disp) {
				disp['*'].call(this, com, fun);
				return;
			}
			log.e('Nada Cmd:' + com.Cmd);
			fun('Nada', com);
		}

		/**
		 * entity access to the genModule command
		 * @param {object} mod 	the description of the Module to generate
		 * @param {string} mod.Module the module to generate
		 * @param {object=} mod.Par 	the Par to merge with the modules Apex Par
		 * @callback fun 
		 */
		function genModule(mod, fun) {
			//	log.v('--Entity/genModule');
			nxs.genModule(mod, fun);
		}

	/**
	 * Add a module into the in memory Module Cache (ModCache)
	 * @param {string} modName 		the name of the module
	 * @param {string} modZip 		the zip of the module
	 * @callback fun 							the callback just returns the name of the module
	 */
	function addModule(modName, modZip, fun){
		nxs.addModule(modName, modZip, fun);
	}

		/**
		 * entity access to the genModule command
		 * @param {object} modObj 	an object containing one or more module descriptions
		 * @callback fun(err,pidofTop,objectOfAllModulesGenerated)
		 */
		function genModules(modObj, fun) {
			//	log.v('--Entity/genModule');
			nxs.genModule(mod, fun);
		}

		/**
		 * deletes the current entity
		 * @callback fun 
		 */
		function deleteEntity(fun) {
			log.v(`Deleting Entity ${Par.Pid}`);
			nxs.deleteEntity(Par.Apex, Par.Pid, fun);
		}

		/**
		 * create an entity in the same module
		 * @param {object} par the par of the entity to be generated
		 * @param {string} par.Entity The entity type that will be generated
		 * @param {string=} par.Pid	the pid to define as the pid of the entity
		 * @callback fun 
		 */
		function genEntity(par, fun) {
			nxs.genEntity(Par.Apex, par, fun);
		}

		/**
		 * create a 32 character hexidecimal pid
		 */
		function genPid() {
			return nxs.genPid();
		}

		/**
		 * Send a message to another entity, you can only send messages to Apexes of modules
		 * unless both sender and recipient are in the same module
		 * @param {object} com  		the message object to send
		 * @param {string} com.Cmd		the function to send the message to in the destination entity
		 * @param {string} pid 			the pid of the recipient (destination) entity
		 * @callback fun
		 */
		function send(com, pid, fun) {
			// log.v(com, pid);
			if (!('Passport' in com))
				com.Passport = {};
			com.Passport.To = pid;
			if ('Apex' in Par)
				com.Passport.Apex = Par.Apex;
			if (fun)
				com.Passport.From = Par.Pid;
			if (!("Pid" in com.Passport))
				com.Passport.Pid = genPid();
			nxs.sendMessage(com, fun);
		}

		/**
		 * save the current entity to cache if not an Apex send the save message to Apex
		 * if it is an Apex we save it as well as all other relevant information
		 * @callback fun 
		 */
		function save(fun) {
			nxs.saveEntity(Par.Apex, Par.Pid, fun);
		}
	}

	/**
	 * Create an Entity from the given par in the module defined by apx
	 * The entity is then stored in EntCache (the location of all "in Memory" entities)
	 * @param {string} apx 		the Pid of the module Apex in which this entity will be generated
	 * @param {object} par 		the Par of the entity that will be created
	 * @param {string} par.Entity The entity type that will be generated
	 * @param {string=} par.Pid	the pid to define as the pid of the entity
	 * @callback fun 			the callback to return the pid of the generated entity to
	 */
	async function genEntity(apx, par, fun = _ => log.e(_)) {
		if (!("Entity" in par)) {
			fun("No Entity defined in Par");
			return;
		}

		var impkey = ApexIndex[apx] + '/' + par.Entity;
		var mod = ModCache[ApexIndex[apx]];

		if (!(par.Entity in mod.files)) {
			log.e('<' + par.Entity + '> not in module <' + ApexIndex[apx] + '>');
			fun('Null entity');
			return;
		}

		if (!(impkey in ImpCache)) {
			let entString = await new Promise(async (res, rej) => {
				mod.file(par.Entity).async("string").then((string) => res(string))
			});
			ImpCache[impkey] = (1, eval)(entString);
		}

		par.Pid = par.Pid || genPid();
		par.Module = ApexIndex[apx];
		par.Apex = apx;

		EntCache[par.Pid] = new Entity(Nxs, ImpCache[impkey], par);
		fun(null, par.Pid);
	}

	/**
	 * Delete an entity file. If the entity is an Apex of a Module,
	 * then delete all the entities found in that module as well. 
	 * @param {string} apx 		the pid of the entities apex
	 * @param {string} pid 		the pid of the entity
	 * @callback fun  			the callback to return the pid of the generated entity to
	 */
	function deleteEntity(apx, pid, fun = _ => _) {
		let apxpath = `${CacheDir}/${ApexIndex[apx]}/${apx}/`;

		let rmList = [];
		//we first check to see if it's an apex
		//if so we will read the directory that is the instance of 
		//the module and then delete all of the entity files found therein.
		if (apx == pid) {
			files = fs.readdirSync(apxpath);
			for (let i = 0; i < files.length; i++) {
				rmList.push(files[i].split('.')[0]);
			}
			remDir(apxpath);
		} else {
			rmList.push(pid);
			log.v('Deleting file:' + apxpath + '/' + pid + '.json');
			fs.unlinkSync(apxpath + '/' + pid + '.json');
		}

		for (let i = 0; i < rmList.length; i++) {
			let subpid = rmList[i];
			if (subpid in EntCache) {
				delete EntCache[subpid];
			}
		}
		fun(null, pid);
	}

	/**
	 * Save an entity file. Make sure that all nested files exist in the
	 * cache prior to saving said file
	 * @param {string} apx 		the pid of the entities apex
	 * @param {string} pid 		the pid of the entity
	 * @callback fun  			the callback to return the pid of the generated entity to
	 */
	function saveEntity(apx, pid, fun = (err, pid) => { if (err) log.e(err) }) {
		let modpath = `${CacheDir}/${ApexIndex[apx]}`;
		let apxpath = `${modpath}/${apx}`;
		let entpath = `${apxpath}/${pid}.json`;

		//	this function checks to make sure the entities Module.zip 
		// 	file pre-exists or writes it if the entity is the module apex. 
		let checkModule = (() => {
			fs.lstat(modpath, function (err, stat) {
				if (stat) {
					checkApex();
				} else {
					//the following code is depricated since including deferred modules all module zip files 
					//must exist in the cache prior to starting the system

					fun(`No Directory for the requrested module: ${ApexIndex[apx]}`);
					// let mod = ModCache[ApexIndex[apx]];
					// if (pid == apx) {
					// 	fs.mkdirSync(modpath);
					// 	let path = modpath + '/Module.zip';
					// 	let str = JSON.stringify(mod, null, 2);
					// 	mod.generateAsync({ type: "uint8array" }).then((dat, fail) => {
					// 		if (fail) {
					// 			log.w("Genesis failed to create zip.");
					// 			return;
					// 		}

					// 		fs.writeFileSync(path, str);
					// 		log.v("Saved Module.zip at " + path);

					// 		checkApex();
					// 	});


					// } else {
					// 	if (!("Save" in mod)) {
					// 		fun("Save Not Implemented in Module's Apex", modpath);
					// 		return;
					// 	}
					// 	let com = {};
					// 	com.Cmd = mod["Save"];
					// 	com.Passport = {};
					// 	com.Passport.To = pidapx;
					// 	com.Passport.Pid = genPid();
					// 	sendMessage(com, checkApex);
					// }
				}
			})
		});

		//this function checks to make sure the entities Apex directory
		//pre-exists or writes it if the entity is the module apex. 
		let checkApex = (() => {
			fs.lstat(apxpath, async function (err, stat) {
				if (stat) {
					checkEntity();
				} else {
					if (pid == apx) {
						fs.mkdirSync(apxpath);
						log.v("Made directory " + apxpath);
						checkEntity();
					} else {
						var schema = await new Promise(async (res, rej) => {
							if ('schema.json' in ModCache[ApexIndex[apx]]) {
								ModCache[ApexIndex[apx]].file('schema.json').async('string').then(function (schemaString) {
									res(JSON.parse(schemaString));
								});
							} else {
								log.e('Module <' + modnam + '> schema not in ModCache');
								res();
								return;
							}
						});

						if (!("Save" in schema)) {
							fun("Apex has not been saved", apx);
							return;
						}
						let com = {};
						com.Cmd = schema["Save"];
						com.Passport = {};
						com.Passport.To = pidapx;
						com.Passport.Pid = genPid();
						sendMessage(com, checkEntity);
					}
				}
			});
		});

		let checkEntity = (() => {
			if (!(pid in EntCache)) {
				fun('pid has not been loaded to EntCache...' + pid);
				return;
			}
			ent = EntCache[pid];
			fs.writeFileSync(entpath, JSON.stringify(ent.Par, null, 2));
			log.v("Saved 'ent'.json at " + entpath);
			fun(null);
		});
		checkModule();
	}

	/**
	 * Add a module into the in memory Module Cache (ModCache)
	 * @param {string} modName 		the name of the module
	 * @param {string} modZip 		the zip of the module
	 * @callback fun 							the callback just returns the name of the module
	 */
	async function addModule(modName, modZip, fun){
		//modZip is the uint8array that can be written directly to the cache directory
		if (process.argv.indexOf('--allow-add-module') > -1){
			ModCache[modName] = await new Promise(async (res, rej) => {
				let zip = new jszip();
				zip.loadAsync(modZip).then((mod) => res(mod));
			});
			fun(null, modName)
			return;
		}
		let err =`addModule not permitted in current xGraph process \nrun xgraph with --allow-add-module to enable`;
		log.w(err);
		fun(err);
	}

	/**
	 * Access a file that exists in the module.json
	 * @param {string} module 		the module to look for the file in
	 * @param {string} filename 	the name of the file we're looking for
	 * @callback fun				the callback to return the pid of the generated entity to
	 */
	function getFile(module, filename, fun = _ => _) {
		let mod = ModCache[module];
		if (filename in mod.files) {
			mod.file(filename).async("string").then((dat) => {
				fun(null, dat)
			})
			return;
		}
		let err = `Error: File ${filename} does not exist in module ${module}`;
		log.e(err);
		fun(err);
	}

	/**
	 * load a dependency for a module
	 * @param {string} apx 		pid of the entities apex
	 * @param {string} pid 		the pid of the entity
	 * @param {string} str 			the string of the module to require
	 */
	function loadDependency(apx, pid, str) {
		//load fresh from file
		try {
			delete require.cache[require.resolve(str)];
		} catch (e) { }

		let folder = ApexIndex[apx];

		module.paths = [CacheDir + '/' + folder + '/node_modules/'];
		return require(str);
	}

	/**
	 * Spin up an entity from cache into memory and retrievd its context 
	 * otherwise just return it's context from memory
	 * @param {string} apx 		the pid of the entities apex
	 * @param {string} pid 		the pid of the entity
	 * @callback fun  			the callback to return the pid of the generated entity to
	 */
	function getEntityContext(apx, pid, fun = _ => _) {
		let imp;
		let par;
		let ent;

		// Check to see if pid is also an apex entity in this system
		// if not then we assume that the pid is an entity inside of the sending Module
		if (pid in ApexIndex) {
			apx = pid;
		}

		let folder = ApexIndex[apx];
		let path = CacheDir + '/' + folder + '/' + apx + '/' + pid + '.json';
		fs.readFile(path, function (err, data) {
			if (err) {
				log.e('<' + path + '> unavailable');
				fun('Unavailable');
				return;
			}
			let par = JSON.parse(data.toString());
			let impkey = folder + '/' + par.Entity;
			let imp;
			if (impkey in ImpCache) {
				BuildEnt();
				return;
			}

			GetModule(folder, async function (err, mod) {
				if (err) {
					log.e('Module <' + folder + '> not available');
					fun('Module not available');
					return;
				}

				if (!(par.Entity in mod.files)) {
					log.e('<' + par.Entity + '> not in module <' + folder + '>');
					fun('Null entity');
					return;
				}

				let entString = await new Promise(async (res, rej) => {
					mod.file(par.Entity).async("string").then((string) => res(string))
				});

				log.v(`Spinning up entity ${folder}-${par.Entity.split('.')[0]}`);
				ImpCache[impkey] = (1, eval)(entString);
				BuildEnt();
			});

			function BuildEnt() {
				EntCache[pid] = new Entity(Nxs, ImpCache[impkey], par);
				fun(null, EntCache[pid]);
			}
		});
	}

	/**
	 * Starts an instance of a module that exists in the cache.
	 * After generating, the instance Apex receives a setup and start command synchronously
	 * @param {Object} inst 		Definition of the instance to be spun up or an object of multiple definitions
	 * @param {string?} inst.Module 	The name of the module to spin up
	 * @param {Object=} inst.Par	The par of the to be encorporated with the Module Apex Par	
	 * @callback fun 				(err, pid of module apex)
	 */
	async function genModule(moduleDefinition, fun = _ => _) {
		moduleDefinition = JSON.parse(JSON.stringify(moduleDefinition));
		let moduleDefinitions = moduleDefinition;
		if ("Module" in moduleDefinition && (typeof moduleDefinition.Module == "string")) {
			moduleDefinitions = { "Top": moduleDefinition };
		}

		let Setup = {};
		let Start = {};
		let symbols = {};

		// loop over the keys to assign pids to the local dictionary and the 
		// module definitions (moduleDefinitions)
		for (let key in moduleDefinitions) {
			symbols[key] = genPid();
		}

		//compile each module
		for (let moduleKey in moduleDefinitions) {
			let inst = moduleDefinitions[moduleKey];
			await (new Promise((res, rej) => {
				GetModule(inst.Module, async function (err, mod) {
					if (err) {
						log.e('GenModule err -', err);
						fun(err);
						return;
					}
					let pidapx = symbols[moduleKey];
					ApexIndex[pidapx] = inst.Module;

					
					for (let key in inst.Par) {
						let val = inst.Par[key];
						log.d(val)
						
						if(typeof val == 'string') {
							if (val.startsWith('$')) {
								let symbol = val.substr(1);
								if (symbol in symbols) {
									inst.Par[key] = symbols[symbol];
								} else {
									log.e(`${symbol} not in Module key list`);
									log.v(`${Object.keys(symbols)}`)
								}
							}

							if (val.startsWith('\\')) {
								let escaping = val.charAt(1)
								if (escaping == '$' || escaping == '\\') {
									//these are valid escape character
									inst.Par[key] = val.substr(1);
								} else {
									//invalid
									log.w(`\\${escaping} is not a valid escape sequence, ignoring.`);
								}
							}
						}else {
							inst.Par[key] = val;
						}
					}

					await compileInstance(pidapx, inst);

					var schema = await new Promise(async (res, rej) => {
						if ('schema.json' in mod.files) {
							mod.file('schema.json').async('string').then(function (schemaString) {
								res(JSON.parse(schemaString));
							});
						} else {
							log.e('Module <' + modnam + '> schema not in ModCache');
							res()
							return;
						}
					});

					if ("$Setup" in schema.Apex)
						Setup[pidapx] = schema.Apex["$Setup"];
					if ("$Start" in schema.Apex)
						Setup[pidapx] = schema.Apex["$Start"];
					res();
				});
			}));
		}

		log.v('Modules', JSON.stringify(symbols, null, 2));
		log.v('Setup', JSON.stringify(Setup, null, 2));
		log.v('Start', JSON.stringify(Start, null, 2));

		await setup();

		await start();

		fun(null, ("Top" in symbols) ? symbols["Top"] : null, symbols);


		/**
	 * Call setup on the required Module Apexes
	 */
		async function setup() {
			//build the setup promise array
			let setupArray = [];

			for (let pid in Setup) {
				setupArray.push(new Promise((resolve, reject) => {
					var com = {};
					com.Cmd = Setup[pid];
					com.Passport = {};
					com.Passport.To = pid;
					com.Passport.Pid = genPid();
					sendMessage(com, resolve);
				}));
			}

			await Promise.all(setupArray);
		}

		/**
		 * Call Start on the required Module Apexes
		 */
		async function start() {
			//build the setup promise array
			let startArray = [];

			for (let pid in Start) {
				startArray.push(new Promise((resolve, reject) => {
					var com = {};
					com.Cmd = Start[pid];
					com.Passport = {};
					com.Passport.To = pid;
					com.Passport.Pid = genPid();
					sendMessage(com, resolve);
				}));
			}

			await Promise.all(startArray);
		}
	}

	/**
	 * Generate array of entities from module
	 * Module must be in cache 
	 * 
	 * @param {string} pidapx 		The first parameter is the pid assigned to the Apex
	 * @param {object} inst 
	 * @param {string} inst.Module	The module definition in dot notation
	 * @param {object} inst.Par		The par object that defines the par of the instance
	 * @param {boolean} saveRoot	Add the setup and start functions of the apex to the Root.Setup and start
	 */
	async function compileInstance(pidapx, inst, saveRoot = false) {
		log.v('compileInstance', pidapx, JSON.stringify(inst, null, 2));
		var Local = {};
		var modnam = (typeof inst.Module == "object") ? inst.Module.Module : inst.Module;
		var mod;
		var ents = [];
		var modnam = modnam.replace(/\:\//g, '.');

		if (modnam in ModCache) {
			mod = ModCache[modnam];
		} else {
			log.e('Module <' + modnam + '> not in ModCache');
			process.exit(1);
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

		//set Pids for each entity in the schema
		for (j = 0; j < entkeys.length; j++) {
			let entkey = entkeys[j];
			if (entkey === 'Apex') {
				Local[entkey] = pidapx;
			} else {
				Local[entkey] = genPid();
			}
		}

		//unpack the par of each ent
		for (j = 0; j < entkeys.length; j++) {
			let entkey = entkeys[j];
			//start with the pars from the schema
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

			//pars all values for symbols 
			var pars = Object.keys(ent);
			for (ipar = 0; ipar < pars.length; ipar++) {
				var par = pars[ipar];
				var val = ent[par];
				if (entkey == "Apex" && saveRoot) {
					if (par == "$Setup") { Setup[ent.Pid] = val; }
					if (par == "$Start") { Start[ent.Pid] = val; }
				}
				ent[par] = await symbol(val);
			}
			ents.push(ent);
		}

		ents.forEach(async function (par) {
			let impkey = modnam + par.Entity;
			if (!(impkey in ImpCache)) {
				let entString = await new Promise(async (res, rej) => {
					mod.file(par.Entity).async("string").then((string) => res(string))
				});
				ImpCache[impkey] = (1, eval)(entString);
			}
			EntCache[par.Pid] = new Entity(Nxs, ImpCache[impkey], par);
		});

		async function symbol(val) {
			if (typeof val === 'object') {
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
			if (val.charAt(0) === '#' && sym in Local)
				return Local[sym];
			if (val.charAt(0) === '\\')
				return sym;
			return val;
		}
	}

	/**
	 * For retrieving modules
	 * Modules come from the cache directory on the harddrive or the ModCache if its already been read to RAM.
	 * @param {Object} modRequest 
	 * @param {String} modRequest.Module
	 * @param {String=} modRequest.Source
	 * @param {Function} fun 
	 * @returns mod
	 */
	function GetModule(ModName, fun = _ => _) {
		ModName = ModName.replace(/\:\//g, '.');

		//get the module from memory (ModCache) if it has already been retrieved
		if (ModName in ModCache) return fun(null, ModCache[ModName]);

		//get the module from cache
		var cachedMod = `${CacheDir}/${ModName}/Module.zip`;
		fs.lstat(cachedMod, function (err, stat) {
			if (err) {
				log.e(`Error retreiving ${cachedMod} from cache`);
				fun(err);
			}
			if (stat) {
				if (!stat.isDirectory()) {
					fs.readFile(cachedMod, async function (err, data) {
						if (err) {
							fun(err);
							return;
						}
						ModCache[ModName] = await new Promise(async (res, rej) => {
							let zip = new jszip();
							zip.loadAsync(data).then((mod) => res(mod));
						});
						fun(null, ModCache[ModName]);
						return;
					});
				}
			} else {
				err = `Module ${cachedMod} does not exist in the cache`
				log.e(err);
				fun(err);
				return;
			}
		});
	}
})();
