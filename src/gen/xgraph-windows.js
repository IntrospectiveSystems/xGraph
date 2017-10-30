const { execSync } = require('child_process');
const tar = require('targz');
const fs = require('fs');
const mergedirs = require('merge-dirs').default;

let system = 'windows';
let linux = false;
let windows = true;
let mac = false;
let unix = false;

let pathOverrides = {};

let genesis = function(){
			(function () {
	console.log(`\nInitializing the Compile Engine`);
	console.time('Genesis Runtime');

	const fs = require('fs');
	const date = new Date();
	let Uuid;
	let CacheDir;						// The location of where the Cache will be stored
	let Config = {};					// The read config.json
	let Apex = {};						// {<Name>: <pid of Apex>}
	let Modules = {};					// {<Name>: <mod desc>} - only in Genesis
	let ModCache = {};					// {<folder>: <module>}
	let packagejson = {};				// The compiled package.json, built from Modules
	let args = process.argv;			// The input argutments ----- should be removed ??
	let Params = {};					// The set of Macros for defining paths ---- should be removed??


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
	const log = {
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

	genesis();

	////////////////////////////////////////////////////////////////////////////////////////////////
	//
	// Only Function Definitions Beyond This Point
	//
	//


	function setup() {
		log.i('=================================================');
		log.i(`Genesis Setup:`);

		defineMacros();

		parseConfig();

		cleanCache();

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
			if ("XGRAPH" in process.env)
				Params["xGraph"] = process.env.XGRAPH;

		}

		function parseConfig() {
			// Read in the provided config.json file
			// File is passed in Params.Config or defaults to "config.json" in current working directory
			let cfg = fs.readFileSync(Params.Config || 'config.json');

			// Parse the config.json and replace Macros
			// Store all Macros in Params --- should be removed?
			let val, sources, subval;
			if (cfg) {
				var ini = JSON.parse(cfg);
				for (let key in ini) {
					val = ini[key];
					if (typeof val == 'string') {
						//this if will be depricated when Sources are used solely
						// --- should be removed ??
						Config[key] = Macro(val);
						//Params[key] = Config[key];
					} else {
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
				}
			} else {
				// No config was provided. Exit promptly.
				log.e(' ** No configuration file (config.json) provided');
				process.exit(1);
			}

			// Print out the parsed config
			log.v(JSON.stringify(Config, null, 2));
		}

		function cleanCache() {
			// Directory is passed in Params.Cache or defaults to "cache" in the current working directory.
			CacheDir = Params.Cache || "cache"

			// Remove the provided cache directory
			if (fs.existsSync(CacheDir)) {
				log.v(`About to remove the cacheDir: "${CacheDir}"`);
				remDir(CacheDir);
			}
		}
	}


	//----------------------------------------------------Genesis
	// Builds a cache from a config.json
	function genesis() {
		log.i('=================================================');
		log.i(`Genesis Compile Start:`);

		let ifolder, moduleKeys, nfolders;

		generateModuleCatalog();

		recursiveBuild();


		////////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Only Function Definitions Beyond This Point
		//
		//

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
						let folder = mod.Module.replace(/\//g, '.').replace(/:/g, '.');
						let source = mod.Source;
						if (!(folder in Modules)) {
							Modules[folder] = source;
						} else {
							if (Modules[folder] != source) {
								log.e("Broker Mismatch Exception");
								process.exit(2);
							}
						}
					});
				} else {
					let folder = Config.Modules[key].Module.replace(/\//g, '.').replace(/:/g, '.');
					let source = Config.Modules[key].Source;
					if (!(folder in Modules)) {
						Modules[folder] = source;
					} else {
						if (Modules[folder] != source) {
							log.e("Broker Mismatch Exception");
							process.exit(2);
						}
					}
				}
			}
			//prepare for looping over the module catalog
			ifolder = -1;
			moduleKeys = Object.keys(Modules);
			nfolders = moduleKeys.length;
		}

		function recursiveBuild() {
			ifolder++;
			if (ifolder >= nfolders) {
				refreshSystem(populate);
				return;
			}

			let folder = moduleKeys[ifolder];
			let modrequest = {
				"Module": folder,
				"Source": Modules[folder]
			};

			GetModule(modrequest, function (err, mod) {
				ModCache[folder] = mod;
				recursiveBuild();
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
			console.timeEnd("Genesis Runtime");
		}
	}



	//
	// Helper functions
	//


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
		let source = modRequest.Source;
		let mod = {};
		let ModName = modnam.replace(/\:/, '.').replace(/\//g, '.');
		let dir = ModName.replace('.', ':').replace(/\./g, '/');


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

		function loadModuleFromDisk() {
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

	//-----------------------------------------------------refreshSystem
	// Reconstruct package.json and node_modules
	// directory by merging package.json of the
	// individual modules and then running npm
	// to create node_modules directory for system	
	function refreshSystem(func) {
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
		//for old nexus --- should be removed ...
		packagejson.dependencies["node-uuid"] = "~1.4.2";

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
			else {
				log.e('npm process exited with code:' + code);
				process.exit(1);
			}
			log.v('Current working directory: ' + process.cwd());
			func();
		});
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

})();

		};
let nexus = function(){
			(function () {
	console.log(`\nInitializing the Run Engine`);
	console.time('Nexus Start Time');

	const fs = require('fs');
	const date = new Date();
	var Uuid;
	var CacheDir;						// The location of where the Cache will be stored
	var Config = {};					// The read config.json
	var Apex = {};						// {<Name>: <pid of Apex>}
	var Modules = {};					// {<Name>: <mod desc>} - only in Genesis
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

	log.i('=================================================');
	log.i(`Nexus Warming Up:`);




	defineMacros();

	if (!fs.existsSync(CacheDir)) {
		Genesis(Initiate);
	}

	initiate(run);










	////////////////////////////////////////////////////////////////////////////////////////////////
	//
	// Only Function Definitions Beyond This Point
	//
	//




	//-----------------------------------------------------Initialize
	function initiate(fun) {
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



		function loadCache() {
			var folders = fs.readdirSync(CacheDir);

			for (var ifold = 0; ifold < folders.length; ifold++) {
				let folder = folders[ifold];
				let dir = CacheDir + '/' + folder;
				if (!fs.lstatSync(dir).isDirectory())
					continue;
				let path = dir + '/Module.json';
				let data = fs.readFileSync(path).toString();
				let mod = JSON.parse(data);
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



	//-----------------------------------------------------Run
	function run() {
		log.i('\n--Nexus/Run');
		if ('send' in process) {
			process.send('{"Cmd":"Finished"}');
		}
		console.timeEnd('Nexus Start Time');

	}



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


	//
	//
	// Helper Functions as well as Entity definition
	//
	//


	//---------------------------------------------------------genPid
	// Create a new PID
	function genPid() {
		if (!Uuid)
			Uuid = require('uuid/v4');
		var str = Uuid();
		var pid = str.replace(/-/g, '').toUpperCase();
		return pid;
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
				Module: folder,
				Source: SourceIndex[apx] || null
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
		modnam = modnam.replace(/\:/, '.').replace(/\//g, '.');
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
		if (typeof modRequest != "object") {
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



})();

		};

let cwd = (process.cwd());
let bindir = process.argv[0].substr(0, process.argv[0].lastIndexOf('/'));

let configFile = null; // purposefully null
let cacheDir = null;

if(process.argv.length == 1) process.argv[1] = 'help';

processSwitches();

console.log(pathOverrides);

switch(process.argv[1]) {
case 'run': {
run();
break;
}
case 'help':
case '--help': {
help();
break;
}
case 'g':
case 'init': {
init(process.argv.slice(2));
break;
}
default: {
console.log(`unknown command <${process.argv[1]}>`);
help();
break;
}
}

async function init(args) {
console.log('init System');
console.log('[', ...args, ']');

}

function help() {
console.log(`
xGraph
Introspective Systems LLC

Commands:
help: displays this help screen.
run: Starts a system from config or cache
Example: xgraph run --config config.json
xgraph run --cache cache/

`);
}

async function run() {
try {
await ensureNode();
console.log('look for config/cache here: ' + cwd);
console.log('executable is here: ' + bindir);
startChildProcess();
} catch (e) {
console.log(`ERR: ${e}`);
}
}

async function ensureNode() {
console.error(`System ${system} is not yet supported`);
}

function install() {
return new Promise((resolve) => {
console.error(`System ${system} is not yet supported`);
//node-msi.fetch.start

});
}

function processSwitches() {
for(let i = 0; i < process.argv.length; i ++) {
let str = process.argv[i];
if(str.startsWith('--')) {
let key = process.argv[i].slice(2);
applySwitch(key, i);
}
}
}

function applySwitch(str, i) {
let val = null;
if ((i+1) in process.argv) { // switch has a value
val = process.argv[i+1];
}
switch(str) {
case 'config': {
configFile = val;
break;
}
case 'cache': {
cacheDir = val;
}
default: {
pathOverrides[str] = val;
}
}
}

function startChildProcess() {

// set all command line arguments to ENV variables
let arg;
for (let iarg = 0; iarg < process.argv.length; iarg++) {
arg = process.argv[iarg];
console.log(arg);
parts = arg.split('=');
if (parts.length == 2) {
if (parts[0].toLowerCase() == "xgraph") {
process.env['XGRAPH'] = parts[1];
}
else {
process.env[parts[0]] = parts[1];
}
}
}

process.env.NODE_PATH = "node_modules/";
const { spawn } = require('child_process');

console.log(`\nNexus Path: ${bindir.substr(0, bindir.lastIndexOf('/'))}/lib/Nexus/Nexus.js`);
const ls = spawn("node", [`${bindir.substr(0, bindir.lastIndexOf('/'))}/lib/Nexus/Nexus.js`, ...process.argv], { env: process.env });

ls.stdout.on('data', (data) => {
console.log(`${data}`);
});

ls.stderr.on('data', (data) => {
console.log(`${data}`);
});

ls.on('close', (code) => {
console.log(`child process exited with code ${code}`);
});
}









// -------------------------------------------------------------
//                       templating stuff
// -------------------------------------------------------------

let launchConfigBase = {
version: "0.2.0",
configurations: []
};
let config = (repo, system) => {return {
name: system,
type: "node",
request: "launch",
cwd: `\${workspaceRoot}/Systems/${system}`,
program: '${workspaceRoot}/../xGraph/Nexus/Nexus/Nexus.js',
args: [
"xGraph=${workspaceRoot}/../xGraph",
`${repo}=\${workspaceRoot}`,
"development=true"
],
env: {
NODE_PATH: "node_modules"
}
}};

function initSystem() {

}

function initModule() {

}

function initView() {

}
