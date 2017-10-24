(function () {
	
	var fs = require('fs');
	var Path = require('path');
	let log = {
		write: (...str) => {
			fs.appendFile(process.cwd() + "/xgraph.log", str.join(" "), (err)=>{if (err) console.log(err)});
		}
	};
	let date = new Date();

	//give log levels - log.v()
	global.log = {
        v: (...str) => {
            console.log('\u001b[90m[VRBS]', ...str, '\u001b[39m');
        },
        d: (...str) => {
            console.log('\u001b[35m[DBUG]', ...str, '\u001b[39m');
        },
        i: (...str) => {
            console.log('\u001b[36m[INFO]', ...str, '\u001b[39m');
        },
        w: (...str) => {
            console.log('\u001b[33m[WARN]', ...str, '\u001b[39m');
        },
        e: (...str) => {
            console.log('\u001b[31m[ERRR]', ...str, '\u001b[39m');
        }
    };

	var Uuid;
	var CacheDir;
	var Config = {};
	var Apex = {};		// {<Name>: <pid of Apex>}
	var Modules = {};	// {<Name>: <mod desc>} - only in Genesis
	var ModCache = {};	// {<folder>: <module>}
	var packagejson = {};
	
	EventLog('\n=================================================');
	EventLog(`Genesis Compile Start: ${date.toString()}`);

	// Process input arguments and define macro parameters
	var args = process.argv;
	let arg, parts;
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

	//if xGraph path has been defined by the process in process.env then use it
	if ("XGRAPH" in process.env)
		Params["xGraph"]= process.env.XGRAPH;

	var config = 'config.json';
	if ('Config' in Params)
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
		EventLog(' ** No configuration file provided');
		process.exit(1);
	}

	EventLog(JSON.stringify(Config, null, 2));

	CacheDir = 'cache';

	if ('Cache' in Params)
		CacheDir = Params.Cache;

	EventLog(`About to remove the cacheDir: "${CacheDir}"`);
	
	if (fs.existsSync(CacheDir)){ 
		remDir(CacheDir); // REMOVE REMOVE REMOVE REMOVE REMOVE REMOVE REMOVE
	}

	Genesis();

	function EventLog(string) {
		//event log only built to handle strings
		//write them out
		log.write(string + "\n");
		console.log(string);
	}

	//-----------------------------------------------------remDir
	// Shake well before using
	// Recursive directory deletion
	function remDir(path) {
		var files = [];
		if (fs.existsSync(path)) {
			files = fs.readdirSync(path);
			files.forEach(function (file, index) {
				var curPath = path + "/" + file;
				if (fs.lstatSync(curPath).isDirectory()) { // recurse
					//console.log("Entering Directory", curPath);
					remDir(curPath);
				} else { // delete file
					//console.log("Removing the file", curPath);
					fs.unlinkSync(curPath);
				}
			});
			fs.rmdirSync(path);
			EventLog(`Removing the directory ${path}`);
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
		//	EventLog('!!genPath', filein);
		if (!filein) {
			EventLog(' ** ERR:Invalid file name');
			return '';
		}
		var cfg = Config;
		var path;
		var parts;
		var file = filein;
		if (Config.Redirect) {
			if (file in Config.Redirect)
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
				EventLog(' ** ERR:File <' + file + '> {' + name + '} not found');
				return;
			}
		}
		parts = file.split(':');
		if (parts.length == 2) {
			if (parts[0] in cfg) {
				path = cfg[parts[0]] + '/' + parts[1];
			} else {
				EventLog(' ** ERR:File <' + file + '> prefix not defined');
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
		EventLog('--Nexus/Genesis');
		var Folders = [];

		// Create new cache and install high level
		// module subdirectories. Each of these also
		// has a link to the source of that module,
		// at this point a local file directory, but
		// eventually this should be some kind of
		// alternate repository (TBD)
		var keys = Object.keys(Config.Modules);
		for (let i = 0; i < keys.length; i++) {
			let key = keys[i];
			if (key == 'Deferred') {
				var arr = Config.Modules[key];
				arr.forEach(function (folder) {
					if (Folders.indexOf(folder) < 0)
						Folders.push(folder);
				});
			} else {
				var mod = {};
				let folder = Config.Modules[key].Module.replace(/\//g, '.').replace(/:/g, '.');
				if (Folders.indexOf(folder) < 0)
					Folders.push(folder);
			}
		}
		let nfolders = Folders.length;
		let ifolder = -1;
		next();

		function next() {
			ifolder++;
			if (ifolder >= nfolders) {
				refreshSystem(populate);
				return;
			}
			let folder = Folders[ifolder];
			GetModule(folder, function (err, mod) {
				ModCache[folder] = mod;
				next();
			});
		}

		function populate() {
			console.log('--populate');
			// Build cache structure and Module.json
			fs.mkdirSync(CacheDir);
			for (let folder in ModCache) {
				console.log(folder);
				var mod = ModCache[folder];
				var dir = CacheDir + '/' + folder;
				fs.mkdirSync(dir);
				path = dir + '/Module.json';
				var str = JSON.stringify(ModCache[folder]);
				fs.writeFileSync(path, str);
				var path = dir + '/Module.json';
				fs.writeFileSync(path, JSON.stringify(mod, null, 2));
			}

			// Assign pids to all instance in Configu.Modules
			for (let instname in Config.Modules) {
				//debugger;
				Apex[instname] = genPid();
			}
			console.log('Apex', Apex);

			// Now populate all of the modules from config.json
			for (let instname in Config.Modules) {
				if (instname === 'Deferred')
					continue;
				if (instname === 'Nexus')
					continue;
				var inst = Config.Modules[instname];
				console.log(instname, inst);
				var pidinst = Apex[instname];
				var ents = compileInstance(pidinst, inst);
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

			EventLog(`Genesis Compile Stop: ${date.toString()}`);
			EventLog('=================================================\n');
		}
	}

	//----------------------------------------------------=CompileMOdule
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
						prev[curr[0]]=curr[1];
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
		var ModName = modnam.replace(/\:/, '.').replace(/\//g, '.');
		var dir = ModName.replace('.', ':').replace(/\./g, '/');
		var ModPath = genPath(dir);
		// if (ModName in ModCache) {
		// 	fun(null, ModCache[ModName]);
		// 	return;
		// }

		var cachedMod = `${CacheDir}/${ModName}/Module.json`;
		EventLog(cachedMod);
		fs.lstat(cachedMod, function (err, stat) {
			// if (stat && !development) {
			// 	if (!stat.isDirectory()) {
			// 		fs.readFile(cachedMod, function (err, data) {
			// 			if (err) {
			// 				fun(err);
			// 				return;
			// 			}
			// 			ModCache[ModName] = JSON.parse(data.toString());
			// 			fun(null, ModCache[ModName]);
			// 			return;
			// 		});
			// 	}
			// } else {










			/////////////////////////////////////////////////We Play HERE





			//
			//
			//
			//		Access from the Broker!!!!!
			//
			//
			//

			var mod = {};

			fs.readdir(ModPath, function (err, files) {
				if (err) {
					console.log(' ** ERR:Module <' + ModPath + '? not available');
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
							//console.log('schema', JSON.stringify(schema, null, 2));
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
					})
				}
			});
			//}
		});
	}


})();
