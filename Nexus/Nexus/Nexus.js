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
	var ModuleCache = {};
	var CurrentModule;
	var Initializers = {};
	var package = {};
	var scripts = {};
	var css = {};
	var Mod = {};
	var Nxs = {
		genPid: genPid,
		genPath: genPath,
		getGlobal: getGlobal,
		genModule: genModule,
		genEntity:genEntity,
		getParameter: getParameter,
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

	var config = 'config.json';
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

	CacheDir = 'cache';
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
		console.log('Root', Root);
		var pids = Object.keys(Root.Setup);
		if(!Async)
			Async = require('async');
		Async.eachSeries(pids, setup, Start);

		function setup(pid8, func) {
		//	console.log('..setup', pid8);
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
				if (err)
					console.log(" ** Error passed to Nexus' async Setup"+err);
				func(err);
			}
		}
	}

	//---------------------------------------------------------Start
	function Start() {
		console.log('--Nexus/Start');
		var pids = Object.keys(Root.Start);
		console.log(pids);
		Async.eachSeries(pids, start, Run);

		function start(pid8, func) {
			console.log('..start', pid8);

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
				if (err)
					console.log(" ** Error passed to Nexus' async Setup"+err);
				func(err);
			}
		}
	}

	//-----------------------------------------------------Run
	function Run() {
		console.log('--Nexus/Run');
		if ('send' in process) {
			process.send('{"Cmd":"Finished"}');
		}
	}

	//-----------------------------------------------------send
	// Send message to an entity in the current systems (bag)
	// If call back provided, return to sender
	function sendMessage(com, fun) {
		//console.log('--sendMessage', com.Cmd, com.Passport);
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
			if (sym in Root.SymTab) {
				com.Passport.To = Root.SymTab[sym];
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

	//-----------------------------------------------------getGlobal
	// Get Pid associated with a global symbol
	function getGlobal(sym) {
		console.log('--Nexus/getGlobal');
		if(sym in Root.Apex)
			return Root.Apex[sym];
	}

	//-----------------------------------------------------getParameter
	// Retrieve command line parameter
	function getParameter(name) {
		console.log('--Nexus/GetParameter');
		console.log('Params', JSON.stringify(Params, null, 2));
		if(name in Params)
			return Params[name];
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
				fun(' ** Not found');
				return;
			}
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
				fs.readFile(path, done);

				function done(err, data) {
					if (err) {
						console.log(' ** ERR:Cannot read code file', path);
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
		//	var Nxs = nxs;
		var Vlt = {};

		return {
			Par: Par,
			Mod: Mod,
			Vlt: Vlt,
			//	Nxs: Nxs,
			dispatch: dispatch,
			genModule: genModule,
			genEntity:genEntity,
		//	addModule:addModule,
			genPid:genPid,
			genPath:genPath,
			send: send,
			save: save,
			getPid: getPid
		};

		//-------------------------------------------------dispatch
		// Used by Nexus to dispatch messages
		function dispatch(com, fun) {
			//	console.log(Mod);
			//	console.log('||dispatch', com.Cmd);
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

		//-------------------------------------------------genModule
		// Generate module and return (err, pidapx);
		function genModule(mod, fun) {
		//	console.log('--Entity/genModule');
			nxs.genModule(mod, done);

			function done(err, pidapx, init) {
			//	console.log('..done', pidapx, init);
				if(err) {
					console.log(' ** Entity/genModule:' + err);
					fun();
					return;
				}
				if('Setup' in init) {
					var q = {};
					q.Cmd = init.Setup;
					send(q, pidapx, start);
				} else {
					start();
				}

				function start(err, r) {
					if('Start' in init) {
						var q = {};
						q.Cmd = init.Start;
						send(q, pidapx, pau);
					} else {
						fun(null, pidapx);
					}
				}

				function pau(err, r) {
					if(err) {
						console.log(' ** Entity/genmodule:' + err);
						fun(err);
					}
					if(fun)
						fun(null, pidapx);
				}
			}

		}

		function genEntity(par,fun){
			nxs.genEntity(par, fun);
		}

		function genPid(){
			return nxs.genPid();
		}

		function genPath(mod){
			return nxs.genPath(mod);
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
			nxs.sendMessage(com, fun);
		}

		//-------------------------------------------------save
		// Save entity in Cache
		function save(fun) {
			var path = CacheDir + '/' + Par.Pid.substr(24) + '.json';
			var str = JSON.stringify(Par, null, 2);
			fs.writeFile(path, str, done);

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

	//-------------------------------------------------genModule
	// This is the version used to install modules
	// after startup, such as web dashboards and such.
	// It provides for safe setup and start which is
	// handled by Nxs for modules instantiated initially.
	// TBD: If modules saved, Initializers will need to be
	//      added to the Start and Setup lists in Root
	function genModule(mod, fun) {
	//	console.log('--genModule', mod);
		var pidapx;
		Initializers = {};
		addModule(mod, done);

		function done(err, pid) {
			if(err) {
				console.log(' ** genModule/done:' + err);
				if(fun)
					fun(err);
				return;
			}
			fun(null, pid, Initializers);
		}

		function setup(err, pid) {
		//	console.log('..genModule/setup');
		//	console.log('pid', pid);
		//	console.log('Initializers', Initializers);
			pidapx = pid;
			if(err) {
				console.log(' ** genModule:' + err);
				fun(err);
				return;
			}
			if ('Setup' in Initializers) {
				var q = {};
				q.Cmd = Initializers.Setup;
				send(q, pidapx, start);
			} else {
				start();
			}
		}

		function start(err, r ) {
		//	console.log('..genModeul.start');
			if(err) {
				console.log(' ** genModule:' + err);
				fun(err);
				return;
			}
			if('Start' in Initializers) {
				var q = {};
				q.Cmd = Initializers.Start;
				send(q, pidapx, pau);
			} else {
				pau();
			}
		}

		function pau(err, r) {
			if(err) {
				console.log(' ** genModule:' + err);
			}
			fun(err, pidapx);
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
		var module = par.Module;
		var type = par.Entity;
		if (type in Mod) {
			mod = Mod[type];
			finish();
		} else {
			var path = genPath(module+"/"+type);
			console.log("Path is ", path);
			fs.readFile(path, done);

			function done(err, data) {
				if (err) {
					console.log(' ** ERR:Cannot read code file', path);
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
	//	console.log('!!genPath', filein);
		if(!filein) {
			console.log(' ** ERR:Invalid file name');
			return '';
		}
		var cfg = Config;
		var path;
		var parts;
		var file = filein;
		if(Config.Redirect) {
			if(file in Config.Redirect)
				file = Config.Redirect[file];
		}
		if (file.charAt(0) == '/')
			return file;
		if (file.charAt(0) == '{') { // Macro
			parts = file.split('}');
			if (parts.length != 2) {
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
		return s;
	}

	//-----------------------------------------------------Genesis
	// Create cache if it does nto exist and populate
	// This is called only once when a new systems is
	// first instantiated
	function Genesis(fun) {
		console.log('--Nexus/Genesis');
		var path;
		var obj;
		// var package;
		// var scripts;
		// var css;
		Root = {};
		Root.Apex = {};
		Root.Setup = {};
		Root.Start = {};
		// Merge npm package dependencies
		var keys = Object.keys(Config.Modules);
		for(let i=0; i<keys.length; i++) {
			let key = keys[i];
			var mod = Config.Modules[key];
			var moddir = genPath(mod.Module);
			path = moddir + '/package.json';
			if(fs.existsSync(path)) {
				let str = fs.readFileSync(path);
				if(str) {
					obj = JSON.parse(str);
					if(!package) {
						package = obj;
						continue;
					}
					console.log('obj', JSON.stringify(obj, null, 2));


					if (obj.dependencies) {
						if (!package.dependencies) package.dependencies = {};
						for (key in obj.dependencies) {
							if (!(key in package.dependencies))
								package.dependencies[key] = obj.dependencies[key];
						}
					}
					if (obj.devDependencies) {
						if (!package.devDependencies) package.devDependencies = {};
						for (key in obj.devDependencies) {
							if (!(key in package.devDependencies))
								package.devDependencies[key] = obj.devDependencies[key];
						}
					}

				}
			}
			// css files
			path = moddir + '/css.json';
			if(fs.existsSync(path)) {
				let str = fs.readFileSync(path);
				var obj = JSON.parse(str);
				for(key in obj) {
					var file = obj[key];
					path = moddir + '/' + file;
					if(fs.existsSync(path)) {
						if(!css)
							css = {};
						if(!(key in css)) {
							var data = fs.readFileSync(path);
							fs.writeFileSync(file, data);
							css[key] = file;
						}
					} else {
						console.log(' ** ERR:Css <' + file + '> not available');
					}
				}
			}
			// script files
			path = moddir + '/scripts.json';
			if(fs.existsSync(path)) {
				let str = fs.readFileSync(path);
				var obj = JSON.parse(str);
				for(key in obj) {
					var script = obj[key];
					path = moddir + '/' + script;
					if(fs.existsSync(path)) {
						if(!scripts)
							scripts = {};
						if(!(key in scripts)) {
							var scr = fs.readFileSync(path);
							fs.writeFileSync(script, scr);
							scripts[key] = script;
						}
					} else {
						console.log(' ** ERR:Script <' + script + '> not available');
					}
				}
			}
		}
		if(css) {
			var cssout = JSON.stringify(css, null, 2);
			fs.writeFileSync('css.json', cssout);
		}
		if(scripts) {
			var scrout = JSON.stringify(scripts, null, 2);
			fs.writeFileSync('scripts.json', scrout);
		}
		// Create node_module folder
		var strout = JSON.stringify(package, null, 2);
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
			console.log('Current working directory:' + process.cwd());
			if(!Async)
				Async = require('async');
			genPid();	// Generate Pid24 for this Nexus
			fs.mkdirSync(CacheDir);
			let keys = Object.keys(Config.Modules);
			for(var i=0; i<keys.length; i++) {
				var key = keys[i];
				Root.Apex[key] = genPid();
			}
			Async.eachSeries(keys, addmod, done);

			function addmod(key, func) {
				CurrentModule = key;
				let mod = Config.Modules[key];
				addModule(mod, func);
			}
		});

		function done(err) {
			CurrentModule = null;
			saveRoot(fun);
		}

		//------------------------------------------------saveroot
		function saveRoot(fun) {
			console.log('..saveRoot');
			Root.Pid24 = Pid24;
			var path = CacheDir + '/00000000.json';
			var str = JSON.stringify(Root, null, 2);
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
		console.log('path', path);
		var pidapx;
		fs.exists(path, compile);

		function compile(yes) {
			if(!yes) {
				console.log(' ** ERR:No schema **');
				if(fun)
					fun();
				return;
			}
			fs.readFile(path, parse);

			function parse(err, data) {
				if (err) {
					console.log('File err:' + err);
					if(fun)
						fun(err);
					return;
				}
				var schema = JSON.parse(data.toString());
				console.log('schema', schema);
				for (let lbl in schema) {
					var obj = schema[lbl];
					if('Par' in mod) {
						for(key in mod.Par) {
							obj[key] = mod.Par[key];
						}
					}
					obj.Module = mod.Module;
					if(lbl == 'Apex') {
						if(CurrentModule)
							obj.Pid = Root.Apex[CurrentModule];
						else
							obj.Pid = genPid();
						pidapx = obj.Pid;
					} else {
						obj.Pid = genPid();
					}
					lbls[lbl] = obj.Pid;
					ents[lbl] = obj;
				}
				for (let lbl in ents) {
					var obj = ents[lbl];
					for(let key in obj) {
						val = obj[key];
						if (key == '$Setup') {
							Root.Setup[obj.Pid.substr(24)] = obj[key];
							Initializers.Setup = obj[key];
							continue;
						}
						if (key == '$Start') {
							Root.Start[obj.Pid.substr(24)] = obj[key];
							Initializers.Start = obj[key];
							continue;
						}	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 	 
						if(typeof val == 'string') {
							obj[key] = symbol(val);
							continue;
						}
						if(Array.isArray(val)) {
							for(var i=0; i<val.length; i++) {
								if(typeof val[i] == 'string')
									val[i] = symbol(val[i]);
							}
							continue;
						}
						if(typeof val === 'object') {
							for(let sym in val) {
								var tmp = val[sym];
								if(typeof tmp === 'string')
									val[sym] = symbol(tmp);
							}
							continue;
						}
					}
				}
				var keys = Object.keys(ents);
				Async.eachSeries(keys, cache, pau);

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

				function pau(err) {
					if(err) {
						console.log(' ** ERR:' + err);
						if(fun)
							fun(err);
						return;
					}
					fun(null, pidapx);
				}
			}

			function symbol(str) {
				var esc = str.charAt(0);
				if(esc == '#') {
					var sym = str.substr(1);
					if(sym in lbls) {
						return lbls[sym];
					} else {
						var err = 'Invalide global symbol <' + sym + '>';
						console.log(' ** ERR:' + err);
						throw 'Invalid local sysmbol';
					}
				}
				if(esc == '$') {
					var sym = str.substr(1);
					if (sym in Root.Apex)
						return Root.Apex[sym];
					if(sym in Config)
						return Config[sym];
					var err = 'Invalide global symbol <' + sym + '>';
					console.log(' ** ERR:' + err);
					throw 'Invalid global symbol';
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
