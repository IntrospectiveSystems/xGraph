(function () {
	///Startup Processes
	var fs = require('fs');
	var Path = require('path');
	let date = new Date();
	let xgraphlog = (...str) => {
		fs.appendFile(process.cwd() + "/xgraph.log", str.join(" ")+"\n", (err)=>{if (err) console.log(err)});
	};
	//give log levels - log.v() log.d() ...	
	// v : verbose --everything is broken
	// d : debug   --casual development
	// i : info    --end user info
	// w : warn    --what should be fixed
	// e : error   --what must be fixed
	let log = {
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

	var Uuid;
	var CacheDir;
	var WorkDir = process.cwd();
	var Config = {};
	var Apex = {};		// {<Name>: <pid of Apex>}
	var Modules = {};	// {<Name>: <mod desc>} - only in Genesis
	var ModCache = {};	// {<folder>: <module>}
	var ApexIndex = {}; // {<Apex pid>:<folder>}
	var EntCache = {};	// {<Entity pid>:<Entity>
	var ImpCache = {};	// {<Implementation path>: <Implementation(e.g. disp)>}
	var packagejson = {};
	var Mod = {};
	var Nxs = {
		EventLog: EventLog,
		genPid: genPid,
		genPath: genPath,
		GetModule,
		genModule: genModule,
		genEntity: genEntity,
		deleteEntity: deleteEntity,
		saveEntity,
		getParameter: getParameter,
		getFile,
		sendMessage: sendMessage
	}
	
	EventLog('\n=================================================');
	EventLog(`Nexus Instantiate Start: ${date.toString()}`);

	// Process input arguments and define macro parameters
	var args = process.argv;
	let arg;
	let parts;
	let development = false;
	if (process.env.XGRAPH_ENV && process.env.XGRAPH_ENV.toLowerCase() === "development") {
		development = true;
	}
	let Params = {};
	for (var iarg = 0; iarg < args.length; iarg++) {
		arg = args[iarg];
		EventLog(arg);
		parts = arg.split('=');
		if (parts.length == 2) {
			Params[parts[0]] = parts[1];
			//make way for development=true command line set
			if (parts[0] == 'development')
				development = (parts[1] === 'true');
		}
	}

	// //if xGraph path has been defined by the process in process.env then use it
	// if ("XGRAPH" in process.env)
	// 	Params["xGraph"] = process.env.XGRAPH;

	CacheDir = 'cache';

	if ('Cache' in Params)
		CacheDir = Params.Cache;
	
	Initiate(Run);
	




	function EventLog(string) {
		//event log only built to handle strings
		//write them out
		log.write(string + "\n");
	}

	//-----------------------------------------------------Run
	function Run() {
		EventLog('\n--Nexus/Run');
		if ('send' in process) {
			process.send('{"Cmd":"Finished"}');
		}
	}

	//---------------------------------------------------------genPid
	// Create a new PID
	function genPid() {
		if (!Uuid)
			Uuid = require('node-uuid');
		var str = Uuid.v4();
		var pid = str.replace(/-/g, '').toUpperCase();

		return pid;
	}

	//---------------------------------------------------------genPath
	function genPath(filein) {
		// EventLog('!!genPath', filein);
		// if (!filein) {
		// 	EventLog(' ** ERR:Invalid file name');
		// 	return '';
		// }
		// var cfg = Config;
		// var path;
		// var parts;
		// var file = filein;
		// if (Config.Redirect) {
		// 	if (file in Config.Redirect)
		// 		file = Config.Redirect[file];
		// }
		// if (file.charAt(0) == '/')
		// 	return file;
		// if (file.charAt(0) == '{') { // Macro
		// 	parts = file.split('}');
		// 	if (parts.length != 2) {
		// 		return;
		// 	}
		// 	var name = parts[0].substr(1);
		// 	if (name in cfg) {
		// 		path = cfg[name] + '/' + parts[1];
		// 		return path;
		// 	} else {
		// 		EventLog(' ** ERR:File <' + file + '> {' + name + '} not found');
		// 		return;
		// 	}
		// }
		// parts = file.split(':');
		// if (parts.length == 2) {
		// 	if (parts[0] in cfg) {
		// 		path = cfg[parts[0]] + '/' + parts[1];
		// 	} else {
		// 		EventLog(' ** ERR:File <' + file + '> prefix not defined');
		// 		return;
		// 	}
		// } else {
		// 	path = file;
		// }
		// return path;
	}

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
			EventLog(' ** ERR:Message has no Passport, ignored');
			EventLog('    ' + JSON.stringify(com));
			if (fun)
				fun('No Passport');
			return;
		}
		if (!('To' in com.Passport) || !com.Passport.To) {
			EventLog(' ** ERR:Message has no destination entity, ignored');
			EventLog('    ' + JSON.stringify(com));
			console.trace();
			if (fun)
				fun('No recipient in message', com);
			return;
		}
		if (!('Pid' in com.Passport)) {
			EventLog(' ** ERR:Message has no message id, ignored');
			EventLog('    ' + JSON.stringify(com));
			if (fun)
				fun('No message id', com);
			return;
		}

		var pid = com.Passport.To;
		if (pid in EntCache) {
			var ent = EntCache[pid];
			ent.dispatch(com, reply);
			return;
		}
		if (pid in ApexIndex) {
			//console.log('In ApexIndex');
			getEntity(pid, pid, done);
			return;
		}
		var apx;
		if ('Apex' in com.Passport)
			apx = com.Passport.Apex;
		else
			apx = pid;
		getEntity(apx, pid, done);

		function done(err, ent) {
			if (err) {
				EventLog(' ** ERR:' + err);
				console.log(JSON.stringify(com, null, 2));
				if (fun)
					fun(err, com);
				return;
			}
			ent.dispatch(com, reply);
			return;
		}

		function reply(err, q) {
			//	EventLog('..Nexus/send/reply', com.Cmd, com.Passport);
			if (fun)
				fun(err, q);
		}
	}

	//-----------------------------------------------------getParameter
	// Retrieve command line parameter
	function getParameter(name) {
		EventLog('--Nexus/GetParameter');
		EventLog('Params', JSON.stringify(Params, null, 2));
		if (name in Params)
			return Params[name];
	}

	//-----------------------------------------------------Entity
	// This is the entity base class that is used to create
	// new entities.
	function Entity(nxs, imp, par) {
		var Par = par;
		var Imp = imp;
		var Vlt = {};

		return {
			Par: Par,
			Vlt: Vlt,
			dispatch: dispatch,
			genModule: genModule,
			getModule,
			genEntity: genEntity,
			deleteEntity,
			genPid: genPid,
			genPath: genPath,
			send: send,
			save: save,
			getPid: getPid,
			getFile,
			log: log,
			require
		};

		//log data to EventLog.txt in the current working directory
		//this log only works with a single string 
		function log(string) {
			//we will write to the eventlog if this.log was misused
			if (arguments.length > 1) {
				nxs.EventLog("Error: Message may be incomplete\n" +
					"more than one argument was passed to this.log()");
			}
			nxs.EventLog(string);
		}

		function getFile(filename, fun) {
			nxs.EventLog(`Entity - Getting file ${filename} from ${Par.Module}`);
			nxs.getFile(Par.Module, filename, fun);
		}

		function getModule(modulename, fun) {
			// nxs.EventLog(`Entity - Getting module ${modulename}`);
			nxs.GetModule(modulename, fun);
		}

		//-------------------------------------------------dispatch
		// Used by Nexus to dispatch messages
		function dispatch(com, fun) {
			//	EventLog(Mod);
			//  EventLog('||dispatch', com.Cmd);
			var disp = Imp.dispatch;
			if (com.Cmd in disp) {
				disp[com.Cmd].call(this, com, fun);
				return;
			}
			if ('*' in disp) {
				disp['*'].call(this, com, fun);
				return;
			}
			nxs.EventLog(' ** ERR:Nada Cmd:' + com.Cmd);
			fun('Nada', com);
		}

		//-------------------------------------------------genModule
		// Generate module and return (err, pidapx);
		function genModule(mod, fun) {
			//	EventLog('--Entity/genModule');
			nxs.genModule(mod, fun);
		}

		function deleteEntity(fun) {
			//EventLog("DElElTingASDF")
			nxs.deleteEntity(Par.Apex, Par.Pid, fun);
		}

		function genEntity(par, fun) {
			nxs.genEntity(Par.Apex, par, fun);
		}

		function genPid() {
			let pid = nxs.genPid();
			return pid;
		}

		function genPath(mod) {
			let path = nxs.genPath(mod);
			return path;
		}

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
			console.log(' ** ERR:<' + par.Entity + '> not in module <' + ApexIndex[apx] + '>');
			if (fun)
				fun('Null entity');
			return;
		}

		par.Pid = par.Pid || genPid();
		par.Module = mod.ModName;
		par.Apex = apx;

		if (impkey in ImpCache) {
			var imp = ImpCache[impkey];
			var ent = new Entity(Nxs, imp, par);
			EntCache[par.Pid] = ent;
			fun(null, par.Pid);
			return;
		}

		var imp = (1, eval)(mod[par.Entity]);
		ImpCache[impkey] = imp;
		var ent = new Entity(Nxs, imp, par);
		EntCache[par.Pid] = ent;

		fun(null, par.Pid);
	}

	function deleteEntity(apx, pid, fun) {
		var modpath = CacheDir + '/';
		modpath += ApexIndex[apx];
		let apxpath = modpath + '/' + apx + '/';

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
			console.log('Deleting file:' + apxpath + '/' + pid + '.json');
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
		var modpath = CacheDir + '/';
		modpath += ApexIndex[apx];
		let apxpath = modpath + '/' + apx;
		let entpath = apxpath + '/' + pid + '.json';


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
						EventLog("Saved Module.json at " + path);
						var str = JSON.stringify(mod, null, 2);
						fs.writeFileSync(path, str);
						checkApex();
					} else {
						if (!("Save" in mod)) {
							fun("Save Not Implemented in Module's Apex", modpath);
							return;
						}
						var com = {};
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
						EventLog("Made directory " + apxpath);
						checkEntity();
					} else {
						if (!("Save" in mod)) {
							fun("Apex has not been saved", apx);
							return;
						}
						var com = {};
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
			//debugger;
			EventLog("Saved 'ent'.json at " + entpath);
			if (fun) fun(null);
		});

		checkModule();
	}

	function getFile(module, filename, fun) {
		let mod = ModCache[module];
		//console.log(Object.keys(ModCache[module]));
		if (filename in mod) {
			fun(null, mod[filename])
			return;
		}
		let err = `Error: File ${filename} does not exist in module ${module}`;
		EventLog(err);
		fun(err);
	}

	//-----------------------------------------------------getEntity
	function getEntity(apx, pid, fun) {
		var imp;
		var par;
		var ent;

		// If entity already cached, just return it
		if (pid in EntCache) {
			ent = EntCache[pid];
			fun(null, ent);
			return;
		}

		// Check to see if Apex entity in this system
		if (!(apx in ApexIndex)) {
			//	EventLog(' ** ERR:Pid <' + pid + '> not Apex in system');
			fun('Not available');
			return;
		}
		var folder = ApexIndex[apx];
		var path = CacheDir + '/' + folder + '/' + apx + '/' + pid + '.json';
		fs.readFile(path, function (err, data) {
			if (err) {
				console.log(' ** ERR:<' + path + '> unavailable');
				if (fun)
					fun('Unavailable');
				return;
			}
			var par = JSON.parse(data.toString());
			var impkey = folder + '/' + par.Entity;
			if (impkey in ImpCache) {
				var imp = ImpCache[impkey];
				var ent = new Entity(Nxs, imp, par);
				EntCache[pid] = ent;
				fun(null, ent);
				return;
			}
			//debugger;
			GetModule(folder, function (err, mod) {
				if (err) {
					console.log(' ** ERR:Module <' + folder + '> not available');
					if (fun)
						fun('Module not available');
					return;
				}
				if (!(par.Entity in mod)) {
					console.log(' ** ERR:<' + par.Entity + '> not in module <' + folder + '>');
					if (fun)
						fun('Null entity');
					return;
				}
				var imp = (1, eval)(mod[par.Entity]);
				ImpCache[impkey] = imp;
				var ent = new Entity(Nxs, imp, par);
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
		var that = this;
		var modnam = inst.Module;
		GetModule(modnam, function (err, mod) {
			if (err) {
				console.log(' ** ERR:GenModule err -', err);
				if (fun)
					fun(err);
				return;
			}
			var pidapx = genPid();
			ApexIndex[pidapx] = mod.ModName;
			var ents = compileInstance(pidapx, inst);
			ents.forEach(function (par) {
				let impkey = modnam + par.Entity;
				var imp;
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
		var Local = {};
		var modnam = inst.Module;
		//debugger;
		var mod;
		var ents = [];
		// The following is for backword compatibility only
		var modnam = modnam.replace(/\:/, '.').replace(/\//g, '.');
		if (modnam in ModCache) {
			mod = ModCache[modnam];
		} else {
			console.log(' ** ERR:' + 'Module <' + modnam + '> not in ModCache');
			return;
		}
		var schema = JSON.parse(mod['schema.json']);
		var entkeys = Object.keys(schema);
		//console.log('entkeys', entkeys);
		Local = {};
		for (j = 0; j < entkeys.length; j++) {
			let entkey = entkeys[j];
			if (entkey === 'Apex')
				Local[entkey] = pidapx;
			else
				Local[entkey] = genPid();
		}
		//console.log('Local', Local);
		for (j = 0; j < entkeys.length; j++) {
			let entkey = entkeys[j];
			let ent = schema[entkey];
			ent.Pid = Local[entkey];
			if (entkey == 'Apex' && 'Par' in inst) {
				var pars = Object.keys(inst.Par);
				for (var ipar = 0; ipar < pars.length; ipar++) {
					var par = pars[ipar];
					ent[par] = inst.Par[par];
				}
			}
			ent.Module = modnam;
			ent.Apex = pidapx;
			var pars = Object.keys(ent);
			for (ipar = 0; ipar < pars.length; ipar++) {
				var par = pars[ipar];
				var val = ent[par];
				ent[par] = symbol(val);
			}
			ents.push(ent);
		}
		return ents;

		function symbol(val) {
			// debugger;
			//console.log(typeof val);
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

	function refreshSystem(func) {
		// Clean up all of the files from the
		// previous refresh. This is most important
		// for the package.json and node_modeuls dir
		console.log('--refreshSystems');

		// Reconstruct package.json and nod_modules
		// directory by merging package.json of the
		// individual modules and then running npm
		// to create node_modules directory for system
		var packagejson;
		//console.log('ModeCache', ModCache);
		for (let folder in ModCache) {
			let mod = ModCache[folder];
			if ('package.json' in mod) {
				obj = JSON.parse(mod['package.json']);
				//console.log('Input', obj);
				if (!packagejson) {
					packagejson = obj;
					continue;
				}
				//console.log('A');
				if (obj.dependencies) {
					//console.log('B');
					if (!packagejson.dependencies) packagejson.dependencies = {};
					for (key in obj.dependencies) {
						//console.log('key', key);
						if (!(key in packagejson.dependencies))
							packagejson.dependencies[key] = obj.dependencies[key];
					}
				}
				if (obj.devDependencies) {
					if (!packagejson.devDependencies) packagejson.devDependencies = {};
					for (key in obj.devDependencies) {
						if (!(key in packagejson.devDependencies))
							packagejson.devDependencies[key] = obj.devDependencies[key];
					}
				}
				//console.log('output', package);
			}
		}
		var strout = JSON.stringify(packagejson, null, 2);
		fs.writeFileSync('package.json', strout);
		const proc = require('child_process');
		var npm = (process.platform === "win32" ? "npm.cmd" : "npm");
		var ps = proc.spawn(npm, ['install']);


		ps.stdout.on('data', _ => process.stdout.write(_.toString()));
		ps.stderr.on('data', _ => process.stdout.write(_.toString()));

		ps.on('err', function (err) {
			EventLog('Failed to start child process.');
			EventLog('err:' + err);
		});

		ps.on('exit', function (code) {
			EventLog('npm process exited with code:' + code);
			EventLog('Current working directory: ' + process.cwd());
			func();
		});
	}

	//-----------------------------------------------------GetModule
	// This is a surrogate for an eventual Module Server. This
	// code should be useful in developing such.
	// Because Nexus during Genesis does not have zip capability,
	// it relies on the Module Server to deliver content in that form.
	// Module Server names use dot notiation as in domain.family.module
	// where..
	//    domain is a major domain name such as 'xCraft2", or 'xGraph'
	//    family is a grouping withing the domain such as 'Widgets'
	//    module is the name withing that group which can be further
	//        separated by dots as desired
	function GetModule(modnam, fun) {
		console.log('##GetModule', modnam);
		// debugger;
		var ModName = modnam.replace(/\:/, '.').replace(/\//g, '.');
		var dir = ModName.replace('.', ':').replace(/\./g, '/');
		//var ModPath = genPath(dir);
		if (ModName in ModCache) {
			fun(null, ModCache[ModName]);
			return;
		}

		var cachedMod = `${CacheDir}/${ModName}/Module.json`;
		//console.log("looking in dir", dir);
		fs.lstat(cachedMod, function (err, stat) {
			if (stat && !development) {
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
			} 
			fun(`Module ${ModName} Not In Cache\n
				Include it in Deferred Array and Recompile or \n
				Use the Import tool to import it into the cache`, ModCache[ModName]);
				return;
		});
	}

	//-----------------------------------------------------Initialize
	async function Initiate(fun) {
		EventLog('\n--Nexus/Initiate');
		let refresh = false;
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

			if (!fs.existsSync(path) || development) {
				let mod = await new Promise((resolve, reject) => {
					GetModule(folder, (err, mod) => {
						if (err)
							reject(err);
						else
							resolve(mod);
					});
				});
				refresh = true;
				if (!fs.existsSync(path) && !development) {
					fs.writeFileSync(path, JSON.stringify(mod, null, 2));
					EventLog('WARNING: Replaced Missing Module.json at ' + path);
				}
				parseMod(mod, dir, folder);

			} else {
				var data = fs.readFileSync(path).toString();
				var mod = JSON.parse(data);
				parseMod(mod, dir, folder);
			}

			function parseMod(mod, dir, folder) {
				//console.log('mod', JSON.stringify(mod, null, 2));
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
			//console.log('ApexIndex', ApexIndex);
		}
		//console.log('Modules', JSON.stringify(Modules, null, 2));
		console.log('ApexIndex', JSON.stringify(ApexIndex, null, 2));
		console.log('Setup', JSON.stringify(Setup, null, 2));
		console.log('Start', JSON.stringify(Start, null, 2));

		// Setup
		var ipid = -1;
		var pids = Object.keys(Setup);
		if (refresh) {
			refreshSystem(setup);
		} else {
			setup();
		}

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
				Run();
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
