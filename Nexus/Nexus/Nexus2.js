(function () {
	console.log(`\nInitializing the Run Engine`);
	console.time('Nexus Start Time');

	const fs = require('fs');
	const date = new Date();
	let Uuid;
	let CacheDir;						// The location of where the Cache will be stored
	let Config = {};					// The read config.json
	let Apex = {};						// {<Name>: <pid of Apex>}
	let Modules = {};					// {<Name>: <mod desc>} - only in Genesis
	let ModCache = {};					// {<folder>: <module>}
	let ApexIndex = {}; 				// {<Apex pid>:<folder>}
	let SourceIndex = {};				// {<Apex pid>:<Broker obj or string>}
	let EntCache = {};					// {<Entity pid>:<Entity>
	let ImpCache = {};					// {<Implementation path>: <Implementation(e.g. disp)>}
	let packagejson = {};				// The compiled package.json, built from Modules
	let args = process.argv;			// The input argutments ----- should be removed ??
	let Params = {};					// The set of Macros for defining paths ---- should be removed??
	let Nxs = {
		genPid,
		//genPath,
		GetModule,
		genModule,
		genEntity,
		deleteEntity,
		saveEntity,
		// getParameter,
		getFile,
		sendMessage
	};


	//
	// Logging Functionality
	//

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



	setup();

	initiate(run);

	////////////////////////////////////////////////////////////////////////////////////////////////
	//
	// Only Function Definitions Beyond This Point
	//
	//



	function setup() {
		log.i('=================================================');
		log.i(`Nexus Setup:`);

		defineMacros();

		////////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Only Function Definitions Beyond This Point
		//
		//

		function defineMacros() {
			// Process input arguments and define macro parameters
			let arg, parts;
			for (var iarg = 0; iarg < args.length; iarg++) {
				arg = args[iarg];
				log.v(arg);
				parts = arg.split('=');
				if (parts.length == 2) {
					Params[parts[0]] = parts[1];
				}
			}

			// Use the xGraph path if defined in the process.env
			// --- should be removed ??
			if ("XGRAPH" in process.env) Params["xGraph"] = process.env.XGRAPH;

			// Define where the cache is located
			CacheDir = Params.Cache || 'cache';
		}
	}


	//-----------------------------------------------------Run
	function run() {
		log.i('\n--Nexus/Run');
		if ('send' in process) {
			process.send('{"Cmd":"Finished"}');
		}
	}
























	//---------------------------------------------------------genPid
	// Create a new PID
	function genPid() {
		if (!Uuid)
			Uuid = require('uuid/v4');
		var str = Uuid();
		var pid = str.replace(/-/g, '').toUpperCase();
		return pid;
	}

	// //---------------------------------------------------------genPath
	// function genPath(filein) {
	// 	// EventLog('!!genPath', filein);
	// 	// if (!filein) {
	// 	// 	EventLog(' ** ERR:Invalid file name');
	// 	// 	return '';
	// 	// }
	// 	// var cfg = Config;
	// 	// var path;
	// 	// var parts;
	// 	// var file = filein;
	// 	// if (Config.Redirect) {
	// 	// 	if (file in Config.Redirect)
	// 	// 		file = Config.Redirect[file];
	// 	// }
	// 	// if (file.charAt(0) == '/')
	// 	// 	return file;
	// 	// if (file.charAt(0) == '{') { // Macro
	// 	// 	parts = file.split('}');
	// 	// 	if (parts.length != 2) {
	// 	// 		return;
	// 	// 	}
	// 	// 	var name = parts[0].substr(1);
	// 	// 	if (name in cfg) {
	// 	// 		path = cfg[name] + '/' + parts[1];
	// 	// 		return path;
	// 	// 	} else {
	// 	// 		EventLog(' ** ERR:File <' + file + '> {' + name + '} not found');
	// 	// 		return;
	// 	// 	}
	// 	// }
	// 	// parts = file.split(':');
	// 	// if (parts.length == 2) {
	// 	// 	if (parts[0] in cfg) {
	// 	// 		path = cfg[parts[0]] + '/' + parts[1];
	// 	// 	} else {
	// 	// 		EventLog(' ** ERR:File <' + file + '> prefix not defined');
	// 	// 		return;
	// 	// 	}
	// 	// } else {
	// 	// 	path = file;
	// 	// }
	// 	// return path;
	// }

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

	//-----------------------------------------------------send
	// Send message to an entity in the current systems (bag)
	// If call back provided, return to sender
	function sendMessage(com, fun) {
		//console.log('--sendMessage', com.Cmd);
		if (!('Passport' in com)) {
			log.e(' ** ERR:Message has no Passport, ignored');
			log.e('    ' + JSON.stringify(com));
			if (fun)
				fun('No Passport');
			return;
		}
		if (!('To' in com.Passport) || !com.Passport.To) {
			log.e(' ** ERR:Message has no destination entity, ignored');
			log.e('    ' + JSON.stringify(com));
			console.trace();
			if (fun)
				fun('No recipient in message', com);
			return;
		}
		if (!('Pid' in com.Passport)) {
			log.e(' ** ERR:Message has no message id, ignored');
			log.e('    ' + JSON.stringify(com));
			if (fun)
				fun('No message id', com);
			return;
		}

		let pid = com.Passport.To;
		if (pid in EntCache) {
			let ent = EntCache[pid];
			ent.dispatch(com, reply);
			return;
		}
		if (pid in ApexIndex) {
			getEntity(pid, pid, done);
			return;
		}
		let apx;
		if ('Apex' in com.Passport)
			apx = com.Passport.Apex;
		else
			apx = pid;
		getEntity(apx, pid, done);

		function done(err, ent) {
			if (err) {
				log.e(' ** ERR:' + err);
				log.e(JSON.stringify(com, null, 2));
				if (fun)
					fun(err, com);
				return;
			}
			ent.dispatch(com, reply);
			return;
		}

		function reply(err, q) {
			if (fun)
				fun(err, q);
		}
	}

	// //-----------------------------------------------------getParameter
	// // Retrieve command line parameter
	// function getParameter(name) {
	// 	log.v('--Nexus/GetParameter');
	// 	log.v('Params', JSON.stringify(Params, null, 2));
	// 	if (name in Params)
	// 		return Params[name];
	// }

	//-----------------------------------------------------Entity
	// This is the entity base class that is used to create
	// new entities.
	function Entity(nxs, imp, par) {
		var Par = par;
		var Imp = imp;
		var Vlt = {};

		return {
			Par,
			Vlt,
			dispatch,
			genModule,
			getModule,
			genEntity,
			deleteEntity,
			genPid,
			//genPath: genPath,
			send,
			save,
			getPid,
			getFile,
			require
		};

		function getFile(filename, fun) {
			log.v(`Entity - Getting file ${filename} from ${Par.Module}`);
			nxs.getFile(Par.Module, filename, fun);
		}

		function getModule(moduleDef, fun) {
			nxs.GetModule(moduleDef, fun);
		}

		//-------------------------------------------------dispatch
		// Used by Nexus to dispatch messages
		function dispatch(com, fun) {
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

		//-------------------------------------------------genModule
		// Generate module and return (err, pidapx);
		function genModule(mod, fun) {
			//	log.v('--Entity/genModule');
			nxs.genModule(mod, fun);
		}

		function deleteEntity(fun) {
			log.v(`Deleting Entity ${Par.Pid}`);
			nxs.deleteEntity(Par.Apex, Par.Pid, fun);
		}

		function genEntity(par, fun) {
			nxs.genEntity(Par.Apex, par, fun);
		}

		function genPid() {
			return nxs.genPid();
		}

		// function genPath(mod) {
		// 	let path = nxs.genPath(mod);
		// 	return path;
		// }

		//-------------------------------------------------send
		// Send message to another entity which can be in another
		// bag or browser. Callback when message is returned
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

		//-------------------------------------------------save
		// Save entity in Cache
		function save(fun) {
			nxs.saveEntity(Par.Apex, Par.Pid, fun);
		}

		//-------------------------------------------------getPid
		// Return Pid of entity
		function getPid() {
			return Par.Pid;
		}
	}

	//-----------------------------------------------------genEntity
	// Create entity from parameter object in current module
	function genEntity(apx, par, fun) {

		var impkey = ApexIndex[apx] + '/' + par.Entity;


		let mod = ModCache[ApexIndex[apx]];
		if (!("Entity" in par)) {
			fun("No Entity defined in Par");
			return;
		}

		if (!(par.Entity in mod)) {
			log.e(' ** ERR:<' + par.Entity + '> not in module <' + ApexIndex[apx] + '>');
			if (fun)
				fun('Null entity');
			return;
		}

		par.Pid = par.Pid || genPid();
		par.Module = mod.ModName;
		par.Apex = apx;

		if (impkey in ImpCache) {
			let imp = ImpCache[impkey];
			let ent = new Entity(Nxs, imp, par);
			EntCache[par.Pid] = ent;
			fun(null, par.Pid);
			return;
		}

		let imp = (1, eval)(mod[par.Entity]);
		ImpCache[impkey] = imp;
		let ent = new Entity(Nxs, imp, par);
		EntCache[par.Pid] = ent;

		fun(null, par.Pid);
	}

	function deleteEntity(apx, pid, fun) {
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

		if (fun)
			fun(null, pid);
	}

	function saveEntity(apx, pid, fun) {
		let modpath = `${CacheDir}/${ApexIndex[apx]}`;
		let apxpath = `${modpath}/${apx}`;
		let entpath = `${apxpath}/${pid}.json`;

		let checkModule = (() => {
			//this function checks to make sure the entities Module.json 
			// file pre-exists or writes it if the entity is the module apex. 
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

		let checkApex = (() => {
			//this function checks to make sure the entities Apex directory
			//pre-exists or writes it if the entity is the module apex. 
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
				if (fun) fun('pid has not been loaded to EntCache...' + pid);
				return;
			}
			ent = EntCache[pid];
			fs.writeFileSync(entpath, JSON.stringify(ent.Par, null, 2));
			log.v("Saved 'ent'.json at " + entpath);
			if (fun) fun(null);
		});

		checkModule();
	}

	function getFile(module, filename, fun) {
		let mod = ModCache[module];
		if (filename in mod) {
			fun(null, mod[filename])
			return;
		}
		let err = `Error: File ${filename} does not exist in module ${module}`;
		log.e(err);
		fun(err);
	}

	//-----------------------------------------------------getEntity
	function getEntity(apx, pid, fun) {
		let imp;
		let par;
		let ent;

		// If entity already cached, just return it
		if (pid in EntCache) {
			ent = EntCache[pid];
			fun(null, ent);
			return;
		}

		// Check to see if Apex entity in this system
		if (!(apx in ApexIndex)) {
			fun('Not available');
			return;
		}
		let folder = ApexIndex[apx];
		let path = CacheDir + '/' + folder + '/' + apx + '/' + pid + '.json';
		fs.readFile(path, function (err, data) {
			if (err) {
				log.e(' ** ERR:<' + path + '> unavailable');
				if (fun)
					fun('Unavailable');
				return;
			}
			let par = JSON.parse(data.toString());
			let impkey = folder + '/' + par.Entity;
			if (impkey in ImpCache) {
				let imp = ImpCache[impkey];
				let ent = new Entity(Nxs, imp, par);
				EntCache[pid] = ent;
				fun(null, ent);
				return;
			}
			let moduleRequest = {
				Module:folder,
				Source: SourceIndex[apx]||null
			};
			// --- should be removed ??
			GetModule(moduleRequest, function (err, mod) {
				if (err) {
					log.e(' ** ERR:Module <' + folder + '> not available');
					if (fun)
						fun('Module not available');
					return;
				}
				if (!(par.Entity in mod)) {
					log.e(' ** ERR:<' + par.Entity + '> not in module <' + folder + '>');
					if (fun)
						fun('Null entity');
					return;
				}
				let imp = (1, eval)(mod[par.Entity]);
				ImpCache[impkey] = imp;
				let ent = new Entity(Nxs, imp, par);
				EntCache[pid] = ent;
				fun(null, ent);
			});
		});
	}

	//-------------------------------------------------genModule
	// This is the version used to install modules
	// after startup, such as web dashboards and such.
	// It provides for safe setup and start which is
	// handled by Nxs for modules instantiated initially.
	// TBD: If modules saved, Initializers will need to be
	//      added to the Start and Setup lists in Root
	function genModule(inst, fun) {
		let that = this;
		let modRequest = {
			Module: inst.Module,
			Source: inst.Source || undefined
		};
		// --- should be removed ??
		GetModule(modRequest, function (err, mod) {
			if (err) {
				console.log(' ** ERR:GenModule err -', err);
				if (fun)
					fun(err);
				return;
			}
			let modnam = inst.Module;
			let pidapx = genPid();
			ApexIndex[pidapx] = mod.ModName;
			let ents = compileInstance(pidapx, inst);
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
					if (fun)
						fun(null, pidapx);
					return;
				}

				var com = {};
				com.Cmd = mod["Start"];
				com.Passport = {};
				com.Passport.To = pidapx;
				com.Passport.Pid = genPid();
				sendMessage(com, () => {
					if (fun) {
						fun(null, pidapx);
					}
				});
			}
		});
	}

	//----------------------------------------------------=CompileModule
	// Generate array of entities from module
	// Module must be in cache to allow use by both Genesis and
	// GenModule
	// The first parameter is the pid assigned to the Apex
	function compileInstance(pidapx, inst) {
		let Local = {};
		let modnam = inst.Module;
		let mod;
		let ents = [];
		// The following is for backword compatibility only
		let modnam = modnam.replace(/\:/, '.').replace(/\//g, '.');
		if (modnam in ModCache) {
			mod = ModCache[modnam];
		} else {
			log.e(' ** ERR:' + 'Module <' + modnam + '> not in ModCache');
			return;
		}
		var schema = JSON.parse(mod['schema.json']);
		var entkeys = Object.keys(schema);

		for (j = 0; j < entkeys.length; j++) {
			let entkey = entkeys[j];
			if (entkey === 'Apex')
				Local[entkey] = pidapx;
			else
				Local[entkey] = genPid();
		}

		for (j = 0; j < entkeys.length; j++) {
			let entkey = entkeys[j];
			let ent = schema[entkey];
			ent.Pid = Local[entkey];

			//load module pars into the Apex entity
			if (entkey == 'Apex' && 'Par' in inst) {
				let pars = Object.keys(inst.Par);
				for (let ipar = 0; ipar < pars.length; ipar++) {
					let par = pars[ipar];
					ent[par] = inst.Par[par];
				}
			}
			ent.Module = modnam;
			ent.Apex = pidapx;

			//load pars from schema
			let pars = Object.keys(ent);
			for (ipar = 0; ipar < pars.length; ipar++) {
				let par = pars[ipar];
				let val = ent[par];
				ent[par] = symbol(val);
			}
			ents.push(ent);
		}
		return ents;

		function symbol(val) {

			if (typeof val === 'object') {
				return (Array.isArray(val) ?
					val.map(v => symbol(v)) :
					Object.entries(val).map(([key, val]) => {
						return [key, symbol(val)];
					}).reduce((prev, curr) => {
						prev[curr[0]] = curr[1];
						return prev;
					}, {})
				);
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
	 * @param {String} modRequest.Source
	 * @param {Function} fun 
	 * @returns mod
	 */
	function GetModule(modRequest, fun) {

		let modnam = modRequest.Module;
		if (typeof modRequest !="object"){
			modnam = modRequest;
			// --- should be removed ???
		}
		let source = modRequest.Source;
		let mod = {};
		let ModName = modnam.replace(/\:/, '.').replace(/\//g, '.');
		let dir = ModName.replace('.', ':').replace(/\./g, '/');


		//get the module from memory (ModCache) if it has already been retrieved
		if (ModName in ModCache) return fun(null, ModCache[ModName]);


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

	//-----------------------------------------------------Initialize
	function initiate(fun) {
		log.i('\n--Nexus/Initiate');
		Modules = {};
		ApexIndex = {};
		var Setup = {};
		var Start = {};
		var folders = fs.readdirSync(CacheDir);

		for (var ifold = 0; ifold < folders.length; ifold++) {
			var folder = folders[ifold];
			var dir = CacheDir + '/' + folder;
			if (!fs.lstatSync(dir).isDirectory())
				continue;
			var path = dir + '/Module.json';
			var data = fs.readFileSync(path).toString();
			var mod = JSON.parse(data);
			parseMod(mod, dir, folder);
			

			function parseMod(mod, dir, folder) {
				Modules[folder] = mod;
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

		// Setup
		var ipid = -1;
		var pids = Object.keys(Setup);
	
		setup();
		

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

		// Start
		function start() {
			ipid++;
			if (ipid >= pids.length) {
				fun();
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
	}

})();
