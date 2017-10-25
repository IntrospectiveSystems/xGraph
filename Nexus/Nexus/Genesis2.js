(function () {
	
	var fs = require('fs');
	var Path = require('path');
	let date = new Date();
	let xgraphlog = (...str) => {
		fs.appendFile(process.cwd() + "/xgraph.log", str.join(" ")+"\n", (err)=>{if (err) {console.error(err); process.exit(1)}});
	};
	//give log levels - log.v() log.d() ...	
	// v : verbose
	// d : debug
	// i : info
	// w : warn
	// e : error
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
	var Config = {};
	var Apex = {};		// {<Name>: <pid of Apex>}
	var Modules = {};	// {<Name>: <mod desc>} - only in Genesis
	var ModCache = {};	// {<folder>: <module>}
	var packagejson = {};
	
	log.i('\n=================================================');
	log.i(`Genesis Compile Start: ${date.toString()}`);

	// Process input arguments and define macro parameters
	var args = process.argv;
	let arg, parts;
	let Params = {};
	for (var iarg = 0; iarg < args.length; iarg++) {
		arg = args[iarg];
		log.v(arg);
		parts = arg.split('=');
		if (parts.length == 2) {
			Params[parts[0]] = parts[1];
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
		log.e(' ** No configuration file (config.json) provided');
		process.exit(1);
	}

	log.v(JSON.stringify(Config, null, 2));

	CacheDir = 'cache';

	if ('Cache' in Params)
		CacheDir = Params.Cache;

	// If the CacheDir exists we delete it before rebuilding
	if (fs.existsSync(CacheDir)){ 
		log.v(`About to remove the cacheDir: "${CacheDir}"`);
		remDir(CacheDir); 
	}

	Genesis();

	//-----------------------------------------------------remDir
	// Recursive directory deletion
	// Used for cache cleanup
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
			log.v(`Removing the directory ${path}`);
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

	//---------------------------------------------------------genPath
	function genPath(filein) {
		if (!filein) {
			log.e(' ** ERR:Invalid file name');
			return '';
		}
		var cfg = Config;
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
			var name = parts[0].substr(1);
			if (name in cfg) {
				path = cfg[name] + '/' + parts[1];
				return path;
			} else {
				log.e(' ** ERR:File <' + file + '> {' + name + '} not found');
				return;
			}
		}
		parts = file.split(':');
		if (parts.length == 2) {
			if (parts[0] in cfg) {
				path = cfg[parts[0]] + '/' + parts[1];
			} else {
				log.e(' ** ERR:File <' + file + '> prefix not defined');
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
	function Genesis() {
		log.i('--Nexus/Genesis');
		var Folders = [];

		// Create new cache and install high level
		// module subdirectories. Each of these also
		// has a link to the source of that module (Module.json).
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
				//var mod = {};
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
			log.v('--populate : Writing Cache to Disk');
			// Write cache to CacheDir
			fs.mkdirSync(CacheDir);
			for (let folder in ModCache) {
				var mod = ModCache[folder];
				var dir = CacheDir + '/' + folder;
				fs.mkdirSync(dir);
				log.v(`Writing Module ${folder} to ${CacheDir}`);
				let path = dir + '/Module.json';
				fs.writeFileSync(path, JSON.stringify(mod, null, 2));
			}

			// Assign pids to all instance in Config.Modules
			for (let instname in Config.Modules) {
				Apex[instname] = genPid();
			}
			log.v('Apex', JSON.stringify(Apex, null, 2));

			// Now populate all of the modules from config.json
			for (let instname in Config.Modules) {
				if (instname === 'Deferred')
					continue;
				if (instname === 'Nexus')
					continue;
				var inst = Config.Modules[instname];
				log.v(instname, JSON.stringify(inst, null, 2));
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

			log.i(`Genesis Compile Stop: ${date.toString()}`);
			log.i('=================================================\n');
		}
	}

	//----------------------------------------------------CompileModule
	// Generate array of entities from module
	// Module must be in cache to allow use by both Genesis and
	// GenModule
	// The first parameter is the pid assigned to the Apex
	function compileInstance(pidapx, inst) {
		var Local = {};
		var modnam = inst.Module;
		var mod;
		var ents = [];
		// The following is for backword compatibility only
		var modnam = modnam.replace(/\:/, '.').replace(/\//g, '.');
		if (modnam in ModCache) {
			mod = ModCache[modnam];
		} else {
			log.e(' ** ERR:' + 'Module <' + modnam + '> not in ModCache');
			process.exit(1);
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
		// Reconstruct package.json and node_modules
		// directory by merging package.json of the
		// individual modules and then running npm
		// to create node_modules directory for system		
		log.i('--refreshSystems: Updating and installing dependencies\n');
		var packagejson;
		for (let folder in ModCache) {
			let mod = ModCache[folder];
			if ('package.json' in mod) {
				obj = JSON.parse(mod['package.json']);
				if (!packagejson) {
					packagejson = obj;
					continue;
				}
				if (obj.dependencies) {
					if (!packagejson.dependencies) packagejson.dependencies = {};
					for (key in obj.dependencies) {
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
			}
		}

		//include Genesis/Nexus required npm modules
		packagejson.dependencies["uuid"] = "3.1.0";
		packagejson.dependencies["async"] = "0.9.0";
		

		var strout = JSON.stringify(packagejson, null, 2);
		//write the compiled package.json to disk
		fs.writeFileSync('package.json', strout);

		//call npm install on a childprocess of node
		const proc = require('child_process');

		var npm = (process.platform === "win32" ? "npm.cmd" : "npm");
		var ps = proc.spawn(npm, ['install']);

		ps.stdout.on('data', _ => log.v(_.toString()));
		ps.stderr.on('data', _ => log.v(_.toString()));

		ps.on('err', function (err) {
			log.e('Failed to start child process.');
			log.e('err:' + err);
		});

		ps.on('exit', function (code) {
			if (code == 0)
				log.i('dependencies installed correctly');
			else{
				log.e('npm process exited with code:' + code);
				process.exit(1);
			}
			log.v('Current working directory: ' + process.cwd());
			func();
		});
	}

	//-----------------------------------------------------GetModule
	// This will 
	function GetModule(modnam, fun) {
		let mod = {};
		var ModName = modnam.replace(/\:/, '.').replace(/\//g, '.');
		var dir = ModName.replace('.', ':').replace(/\./g, '/');
		var ModPath = genPath(dir);


		//

		// only do this if the moduleName and broker reference match!!!!

		//

		//get the module from memory (ModCache) if it has already been retrieved
		if (ModName in ModCache) {
			fun(null, ModCache[ModName]);
			return;
		}


		//

		//

		//

		//get the module from the defined broker




		log.e(ModName, ModPath);
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


})();
