//Load the required modules
(function() {
	var fs = require('fs');
//	var async = require('async');
	var Uuid;
	var Async;
	var Pid24;
	var Root;
	var CacheDir;
	var Config = {};
	var EntCache = {};
	var CurrentModule;
	var Mod = {};
	var Nxs = {
		genPid: genPid,
		genPath: genPath,
		sendMessage: sendMessage
	}
	console.log('=================================================');

	// Process input arguments and define macro parameters
	var args = process.argv;
	let arg;
	let parts;
	let Params = {};
	for (var iarg = 0; iarg < args.length; iarg++) {
		console.log(args);
		arg = args[iarg];
		parts = arg.split('=');
		if (parts.length == 2) {
			Params[parts[0]] = parts[1];
		}
	}

	var config = 'Config.json';
	if('Config' in Params)
		config = Params.Config;
	let str = fs.readFileSync(config);
	let val;
	if (str) {
		var ini = JSON.parse(str);
		for (key in ini) {
			val = ini[key];
			if (typeof val == 'string') {
				Config[key] = Macro(val);
				Params[key] = Config[key];
			} else {
				Config[key] = val;
			}
		}
	} else {
		console.log(' ** No configuration file provided');
		process.exit(1);
	}
	console.log(JSON.stringify(Config, null, 2));

	CacheDir = 'Cache';
	if('Cache' in Params)
		CacheDir = Params.Cache;
	if(!fs.existsSync(CacheDir)) {
		Genesis(Setup);
	} else {
		Initialiate(Setup);
	}

	//---------------------------------------------------------start
	function Setup() {
		console.log('--Nexus/Setup');
		var pids = Object.keys(Root.Setup);
		if(!Async)
			Async = require('async');
		Async.eachSeries(pids, setup, Start);

		function setup(pid8, func) {
			var q = {};
			q.Cmd = Root.Setup[pid8];
			var pid = Pid24 + pid8;
			getEntity(pid, done);

			function done(err, ent) {
				if(err) {
					console.log(' ** ERR:' + err);
					func(err);
					return;
				}
				ent.dispatch(q, reply);
			}

			function reply(err) {
				func(err);
			}
		}
	}

	//---------------------------------------------------------Start
	function Start() {
		console.log('--Nexus/Start');
		var pids = Object.keys(Root.Start);
		Async.eachSeries(pids, start, Run);

		function start(pid8, func) {
			var q = {};
			q.Cmd = Root.Start[pid8];
			var pid = Pid24 + pid8;
			getEntity(pid, done);

			function done(err, ent) {
				if(err) {
					console.log(' ** ERR:' + err);
					func(err);
					return;
				}
				ent.dispatch(q, reply);
			}

			function reply(err) {
				func(err);
			}
		}
	}

	//-----------------------------------------------------Run
	function Run() {
		console.log('--Nexus/Run');
	}

	//-----------------------------------------------------send
	// Send message to an entity in the current systems (bag)
	// If call back provided, return to sender
	function sendMessage(com, fun) {
		if(!('Passport' in com)) {
			console.log(' ** ERR:Message has no Passport, ignored');
			console.trace();
			if(fun)
				fun('No Passport');
			return;
		}
		if (!('To' in com.Passport) || !com.Passport.To) {
			console.log(' ** ERR:Message has no destination entity, ignored');
			console.log('    ' + JSON.stringify(com));
			console.trace();
			if(fun)
				fun('No recipient in message', com);
			return;
		}
		if (!('Pid' in com.Passport)) {
			console.log(' ** ERR:Message has no message id, ignored');
			console.log('    ' + JSON.stringify(com));
			if(fun)
				fun('No message id', com);
			return;
		}
		var to = com.Passport.To;
		if (to.charAt(0) == '$') {
			var sym = to.substr(1);
			if (sym in Root.Global) {
				com.Passport.To = Root.Global[sym];
			} else
			if (sym in Root.SymTab) {
				com.Passport.To = Pid24 + Root.SymTab[sym];
			}
		}
		var pid = com.Passport.To;
		var pid24 = pid.substr(0, 24);
		if(pid24 != Pid24) {
			console.log(' ** ERR:Misdirected message, pid:' + pid);
			console.log('    ', JSON.stringify(com));
			console.trace();
			if(fun)
				fun('Message not local');
			return;
		}
		if(pid in EntCache) {
			var ent = EntCache[pid];
			ent.dispatch(com, reply);
			return;
		}
		getEntity(pid, done);

		function done(err, ent) {
			if (err) {
				console.log(' ** ERR:' + err);
				if (fun)
					fun(err, com);
				return;
			}
			ent.dispatch(com, reply);
			return;
		}

		function reply(err, q) {
			//	console.log('..Nexus/send/reply', com.Cmd, com.Passport);
			if(fun)
				fun(null, q);
		}
	}

	//-----------------------------------------------------getEntity
	function getEntity(pid, fun) {
		let pid24 = pid.substr(0, 24);
		if (pid24 != Pid24) {
			console.log(' ** Not in my back yard');
			console.log(pid24, Pid24);
			fun(' ** Pid not in bag');
			return;
		}
		var mod;
		var par;

		// If entity already cached, just return it
		var pid8 = pid.substr(24);
		if (pid8 in EntCache) {
			var ent = EntCache[pid8];
			fun(null, ent);
			return;
		}

		// First time entity encountered, generate and
		// store in Cache
		var pathpar = CacheDir + '/' + pid8 + '.json';
		fs.exists(pathpar, exists);

		function exists(yes) {
			if (!yes) {
				console.log(' ** Pid <' + pid + '> not available');
				fun(' ** Not found');
				return;
			}
			console.log('pathpar', pathpar);
			fs.readFile(pathpar, parent);
			return;
		}

		function parent(err, data) {
			if (err) {
				console.log(' ** ERR:' + err);
				fun(err);
				return;
			}
			let str = data.toString();
			par = JSON.parse(str);
			var type = par.Module + '/' + par.Entity;
			if (type in Mod) {
				mod = Mod[type];
				finish();
			} else {
				var path = genPath(type);
				console.log('Mod path is', path);
				fs.readFile(path, done);

				function done(err, data) {
					if (err) {
						console.log(' ** Cannot read code file', path);
						fun(err);
						return;
					}
					var str = data.toString();
					mod = eval(str);
					Mod[type] = mod;
					finish();
				}
			}
		}

		// Have all necessary pieces, construct entity
		// store in cache, and return to caller
		function finish() {
			var ent = new Entity(Nxs, mod, par);
			EntCache[pid8] = ent;
			fun(null, ent);
		}
	}

	//-----------------------------------------------------Entity
	// This is the entity base class that is used to create
	// new entities.
	function Entity(nxs, mod, par) {
		var Par = par;
		var Mod = mod;
		var Nxs = nxs;
		var Vlt = {};

		return {
			Par: Par,
			Mod: Mod,
			Vlt: Vlt,
			Nxs: Nxs,
			dispatch: dispatch,
			send: send,
			save: save,
			getPid: getPid
		}

		//-------------------------------------------------dispatch
		// Used by Nexus to dispatch messages
		function dispatch(com, fun) {
			//	console.log(Mod);
			var disp = Mod.dispatch;
			if (com.Cmd in disp) {
				disp[com.Cmd].call(this, com, fun);
				return;
			}
			if('*' in disp) {
				disp['*'].call(this, com, fun);
				return;
			}
			console.log(' ** ERR:Nada Cmd:' + com.Cmd);
			fun('Nada', com);
		}

		//-------------------------------------------------send
		// Send message to another entity which can be in another
		// bag or browser. Callback when message is returned
		function send(com, pid, fun) {
			if ('Passport' in com) {
				com.Passport.To = pid;
			} else {
				com.Passport = {};
				com.Passport.To = pid;
				if (fun)
					com.Passport.From = Par.Pid;
				com.Passport.Pid = genPid();
			}
			//	console.log('Entity/send/this', this);
			//	console.log('Entity/send/Nxs', that.Nxs);
			Nxs.sendMessage(com, fun);
		}

		//-------------------------------------------------save
		// Save entity in Cache
		function save(fun) {
			var file = Par.Pid.substr(24) + '.json';
			var path = __Config.Cache + '/' + file;
			var str = JSON.stringify(Par, null, 2);
			__Fs3.writeFile(path, str, done);

			function done(err) {
				if (fun)
					fun(err);
			}
		}

		//-------------------------------------------------getPid
		// Return Pid of entity
		function getPid() {
			return Par.Pid;
		}

	}

	//-----------------------------------------------------genEntity
	// Create entity from parameter object
	function genEntity(par, fun) {
		// If user pid, make sure they know what they are doing!
		if ('Pid' in par) {
			if (par.Pid.substr(0, 24) != Pid24) {
				console.log(' ** ERR:Invalid Pid assignment');
				console.trace();
				if (fun)
					fun('Invalid Pid assignment');
				return;
			}
		} else {
			par.Pid = genPid();
		}
		var pid8 = par.Pid.substr(24);
		var type = par.Entity;
		if (type in Mod) {
			mod = Mod[type];
			finish();
		} else {
			var path = __Path(type) + '.js';
			fs.readFile(path, done);

			function done(err, data) {
				if (err) {
					console.log(' ** Cannot read code file', path);
					fun(err);
					return;
				}
				var str = data.toString();
				mod = eval(str);
				Mod[type] = mod;
				finish();
			}
		}

		function finish() {
			var ent = new Entity(Nxs, mod, par);
			EntCache[pid8] = ent;
			fun(null, ent);
		}
	}

	//---------------------------------------------------------genPid
	// Create a new PID
	function genPid() {
		if(!Uuid)
			Uuid = require('node-uuid');
		var str = Uuid.v4();
		var pid = str.replace(/-/g, '').toUpperCase();
		if (Pid24)
			return Pid24 + pid.substr(24);
		Pid24 = pid.substr(0, 24);
		return genPid();
	}

	//---------------------------------------------------------genPath
	function genPath(filein) {
		var cfg = Config;
		var path;
		var parts;
		var file = filein;
		if(Config.Redirect) {
			if(file in Config.Redirect)
				file = Config.Redirect[file];
			console.log('Nexus/genPath', filein, file);
		}
		if (file.charAt(0) == '/')
			return file;
		if (file.charAt(0) == '{') { // Macro
			parts = file.split('}');
			if (parts.length != 2) {
				console.log('File <' + file + '> invalide {} syntax');
				return;
			}
			var name = parts[0].substr(1);
			if (name in cfg) {
				path = cfg[name] + '/' + parts[1];
				return path;
			} else {
				console.log(' ** ERR:File <' + file + '> {' + name + '} not found');
				return;
			}
		}
		parts = file.split(':');
		if (parts.length == 2) {
			if (parts[0] in cfg) {
				path = cfg[parts[0]] + '/' + parts[1];
			} else {
				console.log(' ** ERR:File <' + file + '> prefix not defined');
				return;
			}
		} else {
			path = file;
		}
		return path;
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
		console.log('__Macro in', str);
		console.log('__Macro out', s);
		return s;
	};

	//-----------------------------------------------------Genesis
	// Create cache if it does nto exist and populate
	// This is called only once when a new systems is
	// first instantiated
	function Genesis(fun) {
		console.log('--Nexus/Genesis');
		var path;
		var obj;
		var package;
		// Merge npm package dependencies
		var keys = Object.keys(Config.Modules);
		for(let i=0; i<keys.length; i++) {
			let key = keys[i];
			var mod = Config.Modules[key];
			path = genPath(mod.Module) + '/package.json';
			console.log('Package:' + path);
			if(fs.existsSync(path)) {
				let str = fs.readFileSync(path);
				if(str) {
					obj = JSON.parse(str);
					if(!package) {
						package = obj;
						continue;
					}
					for(key in obj.dependencies) {
						if(!(key in package.dependencies))
							package.dependencies[key] = obj.dependencies[key];
					}
				}
			}
		}
		// Create node_module folder
		var strout = JSON.stringify(package, null, 2);
		console.log('package.json', strout);
		fs.writeFileSync('package.json', strout);
		const proc = require('child_process');
		var npm = (process.platform === "win32" ? "npm.cmd" : "npm");
		var ps = proc.spawn(npm, ['install']);

		ps.on('error', (err) => {
			console.log('Failed to start child process.');
			console.log('err:' + err);
		});

		ps.on('exit', (code) => {
			console.log(`npm process exited with code:` + code);
			if(!Async)
				Async = require('async');
			genPid();	// Generate Pid24 for this Nexus
			fs.mkdirSync(CacheDir);
			Root = {};
			Root.SymTab = {};
			Root.Global = {};
			Root.System = {};
			Root.Setup = {};
			Root.Start = {};
			Root.Route = {};
			let keys = Object.keys(Config.Modules);
			console.log('Keys', keys);
			Async.eachSeries(keys, addmod, done);

			function addmod(key, func) {
				CurrentModule = key;
				console.log('addmod', key);
				let mod = Config.Modules[key];
				addModule(mod, func);
			}
		});

		function done(err) {
			saveRoot(fun);
		}

		//------------------------------------------------saveroot
		function saveRoot(fun) {
			console.log('..saveRoot');
			Root.Pid24 = Pid24;
			var path = CacheDir + '/00000000.json';
			var str = JSON.stringify(Root, null, 2);
			console.log("Writing to ROOOOOOOOT");
			fs.writeFile(path, str, done);

			function done(err) {
				if (err)
					throw err;
				Initialiate(fun);
			}
		}
	}

	//-----------------------------------------------------addModule
	// Compile and integrate module into Nexus. This function
	// is used during initialization of the Cache as well as
	// later when modules are added to a running xGraph.
	// TBD: Deal with addition of new package.json here
	function addModule(mod, fun)  {
		console.log('--addModule', mod.Module);
		var ents = {};
		var lbls = {};
		var path = genPath(mod.Module) + '/schema.json';
		fs.exists(path, compile);

		function compile(yes) {
			if(!yes) {
				console.log(' ** No schema **');
				fun();
				return;
			}
			console.log('..compile', path);
			fs.readFile(path, parse);

			function parse(err, data) {
				console.log('..parse', path);
				if (err) {
					console.log('File err:' + err);
					fun(err);
					return;
				}
				var schema = JSON.parse(data.toString());
				console.log('schema...\n' + JSON.stringify(schema, null, 2));
				for (let lbl in schema) {
					var obj = schema[lbl];
					obj.Module = mod.Module;
					if ('$Pid8' in obj) {
						var pid8 = obj.$Pid8;
						if (pid8.length != 8) {
							console.log(' ** ERR:$Pid8 must be 8 characters');
							if(fun)
								fun('$Pid8 not 8 characters');
							return;
						}
						obj.Pid = Pid24 + pid8;
					} else {
						obj.Pid = genPid();
					}
					lbls[lbl] = obj.Pid;
					headEntPid= obj.Pid;
					ents[lbl] = obj;
				}
				for (let lbl in ents) {
					var obj = ents[lbl];
					for (let key in obj) {
						val = obj[key];
						if (key == '$Local') {
							Root.SymTab[val] = obj.Pid;
							continue;
						}
						if (key == '$Global') {
							if(CurrentModule) {
								sym = CurrentModule + '.' + val;
								Root.Global[sym] = obj.Pid;
							}
							continue;
						}
						if (key == '$System') {
							Root.System[obj.Pid.substr(24)] = obj[key];
							continue;
						}
						if (key == '$Setup') {
							Root.Setup[obj.Pid.substr(24)] = obj[key];
							continue;
						}
						if (key == '$Start') {
							Root.Start[obj.Pid.substr(24)] = obj[key];
							continue;
						}
						if (typeof val == 'string') {
							obj[key] = symbol(val);
							continue;
						}
						if(Array.isArray(val)) {
							for (var i = 0; i < val.length; i++) {
								if (typeof val[i] == 'string')
									val[i] = symbol(val[i]);
							}
							continue;
						}
					}
					//	console.log('After:' + JSON.stringify(obj, null, 2));
				}
				var keys = Object.keys(ents);
				Async.eachSeries(keys, cache, fun);

				function cache(key, func) {
					var obj = ents[key];
					var pid = obj.Pid;
					var path = CacheDir + '/' + pid.substr(24) + '.json';
					var str = JSON.stringify(obj, null, 2);
					fs.writeFile(path, str, done);

					function done(err) {
						if (err)
							throw err;
						func();
					}
				}
			}

			function symbol(str) {
				if(str.charAt(0) == '#') {
					var lbl = str.substr(1);
					if(!(lbl in lbls)) {
						var err = ' ** Symbol ' + lbl + ' not defined';
						throw err;
					}
					return lbls[lbl];
				}
				if(str.charAt(0) == '$') {
					if('Par' in mod) {
						console.log('mod.Par', mod.Par);
						var par = str.substr(1);
						if(par in mod.Par) {
							return mod.Par[par];
						} else {
							var err = ' ** Parameter <' + par + '> not available';
							throw err;
						}
					}
					var err = ' ** No parameters provided';
					throw err;
				}
				return str;
			}
		}
	}

	//-----------------------------------------------------Initialize
	function Initialiate(fun) {
		console.log('--Nexus/Initialiate');
		var path = CacheDir + '/00000000.json';
		fs.readFile(path, root);
		return;

		function root(err, data) {
			if (err) {
				console.log(' ** ERR:' + err);
				fun(err);
				return;
			}
			var str = data.toString();
			Root = JSON.parse(str);
			console.log(Root);
			Pid24 = Root.Pid24;
			fun();
		}
	}

})();