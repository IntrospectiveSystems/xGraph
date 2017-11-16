(async function () {
	console.log(`\nInitializing the Run Engine`);

	const fs = require('fs');
	const Path = require('path');
	const date = new Date();
	var Uuid;
	var CacheDir;						// The location of where the Cache will be stored
	var Config = {};					// The read config.json
	var ModCache = {};					// {<folder>: <module>}
	var ApexIndex = {}; 				// {<Apex pid>:<folder>}
	var SourceIndex = {};				// {<Apex pid>:<Broker obj or string>}
	var EntCache = {};					// {<Entity pid>:<Entity>
	var ImpCache = {};					// {<Implementation path>: <Implementation(e.g. disp)>}
	var packagejson = {};				// The compiled package.json, built from Modules
	var args = process.argv;			// The input argutments ----- should be removed ??
	var Params = {};					// The set of Macros for defining paths ---- should be removed??
	var Nxs = {
		genPid,
		GetModule,
		genModule,
		genEntity,
		deleteEntity,
		saveEntity,
		getFile,
		loadDependency,
		sendMessage
	};


	//
	// Logging Functionality
	//
	{
		// The logging function for writing to xgraph.log to the current working directory
		const xgraphlog = (...str) => {
			fs.appendFile(process.cwd() + "/xgraph.log", str.join(" ") + "\n", (err) => { if (err) { console.error(err); process.exit(1) } });
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

	log.i('=================================================');
	log.i(`Nexus Warming Up:`);

	defineMacros();

	// if called from binary quit or if called from 
	// the command line and node build cache first
	if (!fs.existsSync(CacheDir)) {
		// #ifndef BUILT
		if (isBinary()) {
			// #endif
			log.e(`No cache exists at ${CacheDir}. Try xgraph run`);
			process.exit(1);
			// #ifndef BUILT
		}
		else
			log.i("Building the Cache");
		let genesisString = fs.readFileSync(`${Params.xgraph}/Nexus/Nexus/Genesis.js`).toString();
		await eval(genesisString);
		// #endif
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

		// Define where the cache is located
		//set CWD
		CWD = Params.cwd ? Path.resolve(Params.cwd) : Path.resolve('.');
		log.v(`CWD set to ${CWD}`);

		//set Cache location
		CacheDir = Params.cache || Path.join(CWD, 'cache');
	}

	/**
	 *  The main process of starting an xGraph System.
	 */
	function initiate() {
		log.i('\n--Nexus/Initiate');
		ApexIndex = {};
		var Setup = {};
		var Start = {};

		loadCache();

		var ipid = -1;
		var pids = Object.keys(Setup);

		setup(start);


		////////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Only Function Definitions Beyond This Point
		//
		//


		/**
		 * Load in the cache and poulate setup Setup, Start, and ApexIndex {Objects}
		 */
		function loadCache() {
			var folders = fs.readdirSync(CacheDir);

			for (var ifold = 0; ifold < folders.length; ifold++) {
				let folder = folders[ifold];
				if (folder == 'node_modules')
					continue;
				let dir = CacheDir + '/' + folder;
				if (!fs.lstatSync(dir).isDirectory())
					continue;
				let path = dir + '/Module.json';
				let data = fs.readFileSync(path).toString();
				let mod = JSON.parse(data);
				parseMod(mod, dir, folder);

				function parseMod(mod, dir, folder) {
					//Modules[folder] = mod;
					var files = fs.readdirSync(dir);
					for (var ifile = 0; ifile < files.length; ifile++) {
						var file = files[ifile];
						if (file.length !== 32)
							continue;
						var path = dir + '/' + file;
						if (fs.lstatSync(path).isDirectory()) {
							ApexIndex[file] = folder;
							if ('Setup' in mod)
								Setup[file] = mod.Setup;
							if ('Start' in mod)
								Start[file] = mod.Start;
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
		function setup() {
			ipid++;
			if (ipid >= pids.length) {
				pids = Object.keys(Start);
				ipid = -1;
				start();
				return;
			}
			var pid = pids[ipid];
			var com = {};
			com.Cmd = Setup[pid];
			com.Passport = {};
			com.Passport.To = pids[ipid];
			com.Passport.Pid = genPid();
			sendMessage(com, setup);
		}

		/**
		 * Call Start on the required Module Apexes
		 */
		function start() {
			ipid++;
			if (ipid >= pids.length) {
				run();
				return;
			}
			var pid = pids[ipid];
			var com = {};
			com.Cmd = Start[pid];
			com.Passport = {};
			com.Passport.To = pids[ipid];
			com.Passport.Pid = genPid();
			sendMessage(com, start);
		}

		/**
		 * Send Finished command if the process was generated 
		 */
		function run() {
			log.i('\n--Nexus/Run');
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


	// #ifndef BUILT
	/**
	 * Check if the system is running from binary
	 */
	function isBinary() {
		return (typeof tar == 'undefined');
	}
	// #endif


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
		if (!('Passport' in com)) {
			log.w(' ** ERR:Message has no Passport, ignored');
			log.w('    ' + JSON.stringify(com));
			fun('No Passport');
			return;
		}
		if (!('To' in com.Passport) || !com.Passport.To) {
			log.w(' ** ERR:Message has no destination entity, ignored');
			log.w('    ' + JSON.stringify(com));
			console.trace();
			fun('No recipient in message', com);
			return;
		}
		if (!('Pid' in com.Passport)) {
			log.w(' ** ERR:Message has no message id, ignored');
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
				log.w(' ** ERR:' + err);
				log.w(JSON.stringify(com, null, 2));
				fun(err, com);
				return;
			}
			
			if ((pid in ApexIndex) || (entContext.Par.Apex == apx)) {
				entContext.dispatch(com, reply);
				return;
			} else {
				let err = ' ** ERR: Trying to send a message to a non-Apex'
					+ 'entity outside of the sending module';
				log.w(err);
				log.w(JSON.stringify(com, null, 2));
				fun(err, com);
				return;
			}
		}
		function reply(err, q) {
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
			genEntity,
			deleteEntity,
			genPid,
			send,
			save,
			getFile,
			require
		};

		/**
		 * load a dependency for a moduel
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
			log.e(' ** ERR:Nada Cmd:' + com.Cmd);
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
	 * The entity is then stored in EntCache
	 * @param {string} apx 		the Pid of the module Apex in which this entity will be generated
	 * @param {object} par 		the Par of the entity that will be created
	 * @param {string} par.Entity The entity type that will be generated
	 * @param {string=} par.Pid	the pid to define as the pid of the entity
	 * @callback fun 			the callback to return te pid of the generated entity to
	 */
	function genEntity(apx, par, fun = _ => log.e(_)) {
		if (!("Entity" in par)) {
			fun("No Entity defined in Par");
			return;
		}

		var impkey = ApexIndex[apx] + '/' + par.Entity;
		var mod = ModCache[ApexIndex[apx]];

		if (!(par.Entity in mod)) {
			log.e(' ** ERR:<' + par.Entity + '> not in module <' + ApexIndex[apx] + '>');
			fun('Null entity');
			return;
		}

		par.Pid = par.Pid || genPid();
		par.Module = mod.ModName;
		par.Apex = apx;

		let imp;
		if (impkey in ImpCache) {
			imp = ImpCache[impkey];
		} else {
			imp = (1, eval)(mod[par.Entity]);
			ImpCache[impkey] = imp;
		}

		EntCache[par.Pid] = new Entity(Nxs, imp, par);
		fun(null, par.Pid);
	}

	/**
	 * Delete an entity file. If the entity is an Apex of a Module,
	 * then delete all the entities found in that module as well. 
	 * @param {string} apx 		the pid of the entities apex
	 * @param {string} pid 		the pid of the entity
	 * @callback fun  			the callback to return te pid of the generated entity to
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
	 * @callback fun  			the callback to return te pid of the generated entity to
	 */
	function saveEntity(apx, pid, fun = _ => _) {
		let modpath = `${CacheDir}/${ApexIndex[apx]}`;
		let apxpath = `${modpath}/${apx}`;
		let entpath = `${apxpath}/${pid}.json`;

		//	this function checks to make sure the entities Module.json 
		// 	file pre-exists or writes it if the entity is the module apex. 
		let checkModule = (() => {
			fs.lstat(modpath, function (err, stat) {
				if (stat) {
					checkApex();
				} else {
					let mod = ModCache[ApexIndex[apx]];
					if (pid == apx) {
						fs.mkdirSync(modpath);
						let path = modpath + '/Module.json';
						log.v("Saved Module.json at " + path);
						let str = JSON.stringify(mod, null, 2);
						fs.writeFileSync(path, str);
						checkApex();
					} else {
						if (!("Save" in mod)) {
							fun("Save Not Implemented in Module's Apex", modpath);
							return;
						}
						let com = {};
						com.Cmd = mod["Save"];
						com.Passport = {};
						com.Passport.To = pidapx;
						com.Passport.Pid = genPid();
						sendMessage(com, checkApex);
					}
				}
			})
		});

		//this function checks to make sure the entities Apex directory
		//pre-exists or writes it if the entity is the module apex. 
		let checkApex = (() => {
			fs.lstat(apxpath, function (err, stat) {
				if (stat) {
					checkEntity();
				} else {
					if (pid == apx) {
						fs.mkdirSync(apxpath);
						log.v("Made directory " + apxpath);
						checkEntity();
					} else {
						if (!("Save" in mod)) {
							fun("Apex has not been saved", apx);
							return;
						}
						let com = {};
						com.Cmd = mod["Save"];
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
	 * Access a file that exists in the module.json
	 * @param {string} module 		the module to look for the file in
	 * @param {string} filename 	the name of the file we're looking for
	 * @callback fun				the callback to return te pid of the generated entity to
	 */
	function getFile(module, filename, fun = _ => _) {
		let mod = ModCache[module];
		if (filename in mod) {
			fun(null, mod[filename])
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
		let path = CacheDir + '/' + folder + '/node_modules/';

		module.paths = [path];
		return require(str);
	}


	/**
	 * Spin up an entity from cache into memory and retrievd its context 
	 * otherwise just return it's context from memory
	 * @param {string} apx 		the pid of the entities apex
	 * @param {string} pid 		the pid of the entity
	 * @callback fun  			the callback to return te pid of the generated entity to
	 */
	function getEntityContext(apx, pid, fun = _ => _) {
		let imp;
		let par;
		let ent;

		// Check to see if Apex entity in this system
		if (!(apx in ApexIndex)) {
			fun('Not available');
			return;
		}

		// If entity already cached, just return it
		if (pid in EntCache) {
			if (apx == EntCache[pid].Par.Apex) {
				fun(null, EntCache[pid]);
				return;
			} else {
				fun('Not available');
				return;
			}
		}

		let folder = ApexIndex[apx];
		let path = CacheDir + '/' + folder + '/' + apx + '/' + pid + '.json';
		fs.readFile(path, function (err, data) {
			if (err) {
				log.e(' ** ERR:<' + path + '> unavailable');
				fun('Unavailable');
				return;
			}
			let par = JSON.parse(data.toString());
			let impkey = folder + '/' + par.Entity;
			let imp;
			if (impkey in ImpCache) {
				imp = ImpCache[impkey];
				BuildEnt();
				return;
			}

			GetModule(folder, function (err, mod) {
				if (err) {
					log.e(' ** ERR:Module <' + folder + '> not available');
					fun('Module not available');
					return;
				}
				if (!(par.Entity in mod)) {
					log.e(' ** ERR:<' + par.Entity + '> not in module <' + folder + '>');
					fun('Null entity');
					return;
				}
				imp = (1, eval)(mod[par.Entity]);
				ImpCache[impkey] = imp;
				BuildEnt();
			});

			function BuildEnt() {
				EntCache[pid] = new Entity(Nxs, imp, par);
				fun(null, EntCache[pid]);
			}
		});
	}


	/**
	 * Starts an instance of a module that exists in the cache.
	 * After generating, the instance Apex receives a setup and start command synchronously
	 * @param {Object} inst 		Definition of the instance to be spun up
	 * @param {string} inst.Module 	The name of te module to spin up
	 * @param {Object=} inst.Par	The par of the to be encorporated with the Moduel Apex Par	
	 * @callback fun 				(err, pid of module apex)
	 */
	function genModule(inst, fun = _ => _) {
		let that = this;

		GetModule(inst.Module, function (err, mod) {
			if (err) {
				log.w(' ** ERR:GenModule err -', err);
				fun(err);
				return;
			}
			let modnam = inst.Module;
			let pidapx = genPid();
			ApexIndex[pidapx] = mod.ModName;
			compileInstance(pidapx, inst);

			setup();

			function setup() {
				if (!("Setup" in mod)) {
					start();
					return;
				}
				var com = {};
				com.Cmd = mod["Setup"];
				com.Passport = {};
				com.Passport.To = pidapx;
				com.Passport.Pid = genPid();
				sendMessage(com, start);
			}

			// Start
			function start() {
				if (!("Start" in mod)) {
					fun(null, pidapx);
					return;
				}
				var com = {};
				com.Cmd = mod["Start"];
				com.Passport = {};
				com.Passport.To = pidapx;
				com.Passport.Pid = genPid();
				sendMessage(com, () => {
					fun(null, pidapx);
				});
			}
		});
	}

	/**
	 * Build a graph of xGraph Entities 
	 * @param {*} pidapx 	The apex of the module which requires spinnup
	 * @param {*} inst 		
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

		ents.forEach(function (par) {
			let impkey = modnam + par.Entity;
			let imp;
			if (impkey in ImpCache) {
				imp = ImpCache[impkey];
			} else {
				imp = (1, eval)(mod[par.Entity]);
				ImpCache[impkey] = imp;
			}
			var ent = new Entity(Nxs, imp, par);
			EntCache[par.Pid] = ent;
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
			if (val.charAt(0) === '$' && sym in Apex)
				return Apex[sym];
			if (val.charAt(0) === '#' && sym in Local)
				return Local[sym];
			if (val.charAt(0) === '\\')
				return sym;
			return val;
		}
	}



	/**
	 * For retrieving modules
	 * Modules come from memory, a defined broker, or disk depending on the module definition
	 * @param {Object} modRequest 
	 * @param {String} modRequest.Module
	 * @param {String=} modRequest.Source
	 * @param {Function} fun 
	 * @returns mod
	 */
	function GetModule(modRequest, fun = _ => _) {

		let modnam = modRequest.Module;
		if (typeof modRequest != "object") {
			modnam = modRequest;
		}
		let source = modRequest.Source;
		let mod = {};
		let ModName = modnam.replace(/\:/, '.').replace(/\//g, '.');
		let dir = ModName.replace('.', ':').replace(/\./g, '/');

		//get the module from memory (ModCache) if it has already been retrieved
		if (ModName in ModCache) return fun(null, ModCache[ModName]);

		//get the module from cache
		var cachedMod = `${CacheDir}/${ModName}/Module.json`;
		fs.lstat(cachedMod, function (err, stat) {
			if (err) {
				log.e(`Error retreiving ${cachedMod} from cache`);
				fun(err);
				return;
			}
			if (stat) {
				if (!stat.isDirectory()) {
					fs.readFile(cachedMod, function (err, data) {
						if (err) {
							fun(err);
							return;
						}
						ModCache[ModName] = JSON.parse(data.toString());
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
