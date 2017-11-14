//# sourceURL=Nxs
__Nexus = (_ => {
	console.log(' ** Nxs executing');

	var SockIO;
	var Root;
	var PidServer;
	var PidNxs;
	var Config = {};
	var Cache;
	var EntCache = {};
	var ModCache = {};
	var Modules = {};
	var Scripts = {};

	var PidTop;
	var PidStart;
	var CurrentModule;
	var Initializers = {};

	var ModuleCache = {};
	var ZipCache = {};
	var SymTab = {};
	var Css = [];
	var Fonts = {};
	var Nxs = {
		genPid,
		genEntity,
		deleteEntity,
		genModule,
		getFile,
		send,
		getFont
	};
	var MsgFifo = [];
	var MsgPool = {};
	var that = this;
	__Config = {};
	__Config.TrackIO = false;
	__Share = {};
	let silent = false;


	//
	// Logging Functionality
	//
	{
		// The defined log levels for outputting to the std.out() (ex. log.v(), log.d() ...)
		// Levels include:
		// v : verbose
		// d : debug
		// i : info
		// w : warn
		// e : error
		window.log = {
			v: (...str) => console.log(`%c[VRBS] ${str.join(' ')}`, 'color: gray'),
			d: (...str) => console.log(`%c[DBUG] ${str.join(' ')}`, 'color: magenta'),
			i: (...str) => console.log(`%c[INFO] ${str.join(' ')}`, 'color: cyan'),
			w: (...str) => console.log(`%c[WARN] ${str.join(' ')}`, 'color: yellow'),
			e: (...str) => console.log(`%c[ERRR] ${str.join(' ')}`, 'color: red'),
		};
	}

	return {
		boot
	};

	async function boot(sockio, cfg) {
		if (!silent) log.i('--Nxs/start');

		SockIO = sockio;
		SockIO.removeListener('message');

		SockIO.on('message', function (data) {
			var cmd = JSON.parse(data);

			if (Array.isArray(cmd)) {
				// if its an array, its probs a reply...
				// so, you should split it up.
				var [err, cmd] = cmd;
				// if(cmd.Cmd == 'Evoke') debugger;
			}

			if (!silent) log.v(' << Msg:' + cmd.Cmd);

			//if the message is a reply pair it with its callback
			if ('Passport' in cmd && cmd.Passport.Reply) {
				var pid = cmd.Passport.Pid;
				var ixmsg = MsgFifo.indexOf(pid);
				if (ixmsg >= 0) {
					var func = MsgPool[pid];
					delete MsgPool[pid];
					MsgFifo.splice(ixmsg, 1);
					if (func) {
						func(err || null, cmd);
					}
				}
				return;
			}

			// Try to dispatch on browser
			var pid = cmd.Passport.To;
			if (pid in EntCache) {
				var ent = EntCache[pid];
				if ('Disp' in cmd.Passport && cmd.Passport.Disp == 'Query')
					ent.dispatch(cmd, reply);
				else
					ent.dispatch(cmd, _ => _);
			} else {
				log.v(' ** ERR:Local', pid, 'not in Cache');
			}
			return;


			function reply(err, cmd) {
				if (cmd == null)
					return;
				if ('Passport' in cmd) {
					cmd.Passport.Reply = true;
					var str = JSON.stringify([err, cmd]);
					SockIO.send(str);
				}
			}
		});

		SockIO.on('connect', () => {
			location.href = location.href;
		});

		await setup(cfg);

		genesis();
	}


	async function setup(cfg) {
		if (!silent) log.i('--Nxs/Genesis');

		Root = {};
		Root.Global = {};
		Root.Setup = {};
		Root.Start = {};
		Root.ApexList = {};

		parseCfg();

		await loadScripts();


		function parseCfg() {
			let val, sources, subval;
			if (typeof cfg != "object")
				cfg = JSON.parse(cfg);

			for (let key in cfg) {
				log.v(`Processing cfg key: ${key}`);
				switch (key) {
					case "Pid": {
						PidNxs = cfg.Pid
						break;
					}
					case "PidServer": {
						PidServer = cfg.PidServer;
						break;
					}
					case "ApexList": {
						Root.ApexList = cfg.ApexList;
						break;
					}
					case "Scripts": {
						Scripts = cfg.Scripts;
						Scripts = (typeof Scripts == "object")? Scripts:JSON.parse(Scripts);
						break;
					}
					case "Nxs": {
						delete cfg.Nxs;
						break;
					}
					case "Config": {
						Config = cfg.Config;
						break;
					}
					case "Cache": {
						Cache = cfg.Cache;
						break;
					}
					default: {
						log.w(`Not sure how to process cfg variable ${key}`);
					}
				}
			}

			// Print out the parsed config
			log.v(`Browser Config is:\n ${JSON.stringify(Config, null, 2)}`);
		}

		async function loadScripts() {
			let scriptsPromises = [];

			for (let key in Scripts) {
				scriptsPromises.push(new Promise((resolve, reject) => {
					let q = {};
					q.Cmd = 'GetFile';
					q.File = Scripts[key];
					send(q, Config.pidServer, function (err, r) {
						if (err) {
							log.v(' ** ERR:Script error', err);
							reject(err);
							return;
						}
						script(key, r.Data);
					});
					function script(url, data) {
						var tag = document.createElement('script');
						tag.setAttribute("data-script-url", url);
						tag.setAttribute("type", 'text/javascript');
						var txt = document.createTextNode(data);
						tag.appendChild(txt);
						document.head.appendChild(tag);

						resolve();
					}
				}));
			}

			await Promise.all(scriptsPromises);
		}
	}


	async function genesis() {

		generateModuleCatalog();

		await recursiveBuild();

		populate();

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

					getModule(modrequest, function (err, mod) {
						if (err) { rej(err); reject(err); }
						else res(ModCache[folder] = mod);
					});
				}));
			}

			await Promise.all(modArray)
			log.d("keys of modcache", Object.keys(ModCache));
		}

		function getModule(modRequest, fun) {
			log.d(`getMod ${JSON.stringify(modRequest, null, 2)}`);
			let modnam = modRequest.Module;
			let source = modRequest.Source;
			let mod = {};
			let ModName = modnam.replace(/\:/, '.').replace(/\//g, '.');

			//get the module from memory (ModCache) if it has already been retrieved
			if (ModName in ModCache) return fun(null, ModCache[ModName]);

			//unpack the zipped cache put all modules inot the ModCache
			const zipmod = new JSZip();

			zipmod.loadAsync(Cache, { base64: true }).then(function (zip) {

				zip.file('manifest.json').async('string').then((cacheArray) => {

					console.log(cacheArray)

					//need to store all of these moduels in the ModCache/somewhere
					// log.d(`Cache contains these files ${JSON.parse(str)}`);

					// zip.file('module.json').then(function (str) {
					// 	modjson = JSON.parse(str);
					// 	ModCache[mod.Module] = modjson;
					// });

				});


			});
		}

		async function populate() {
			// Assign pids to all instance in Config.Modules
			for (let instname in Config.Modules) {
				if (instname == "Deferred")
					continue;
				Root.ApexList[instname] = genPid();
			}
			log.v('ApexList', JSON.stringify(Root.ApexList, null, 2));

			// Now populate all of the modules from config.json
			for (let instname in Config.Modules) {
				if (instname === 'Deferred')
					continue;
				var inst = Config.Modules[instname];
				log.v(instname, JSON.stringify(inst, null, 2));
				var pidinst = Root.ApexList[instname];
				var ents = await compileInstance(pidinst, inst);
			}
		}
	}


	//-------------------------------------------------Setup
	function Setup(err) {
		// log.v('--Nexus/Setup');

		CurrentModule = null;
		var pids = Object.keys(Root.Setup);
		var npid = pids.length;
		var ipid = 0;
		setup();

		function setup() {
			if (ipid >= npid) {
				Start();
				return;
			}
			var pid8 = pids[ipid];
			ipid++;
			var q = {};
			q.Cmd = Root.Setup[pid8];
			var pid = Pid24 + pid8;
			send(q, pid, done);

			function done(err, r) {
				setup();
			}
		}
	}

	//-----------------------------------------------------Start
	function Start() {
		log.v('--Nxs/Start');
		var pids = Object.keys(Root.Start);
		var npid = pids.length;
		var ipid = 0;
		start();

		function start() {
			if (ipid >= npid) {
				Run();
				return;
			}
			var pid8 = pids[ipid];
			ipid++;
			var q = {};
			q.Cmd = Root.Start[pid8];
			var pid = Pid24 + pid8;
			//log.v("start ", pid);
			send(q, pid, done);

			function done(err, r) {
				//log.v("Return start ", pid);
				start();
			}
		}
	}

	//-------------------------------------------------Run
	function Run() {
		log.v('--Nxs/Run');
	}


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
		console.log(inst, pidapx);
		var Local = {};
		var modnam = inst.Module;
		var mod;
		var ents = [];
		// The following is for backword compatibility only

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
			//unpack the config pars to the par of the apex of the instance
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
				ent[par] = await symbol(val);
				// if (par === "Config") {
				// 	ent["Cache"] = await GenTemplate(ent["Config"]);
				// }
			}
			ents.push(ent);
		}
		return ents;

		async function symbol(val) {
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
			if (val.charAt(0) === '@') {
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




	//-----------------------------------------------------send
	// Can be called with 1, 2, or three arguments.
	//  1 - com sent to creating Nexus.
	//  2 - com sent to particular entity, no return
	//  3 - com sent to particular entity with callback
	function send(com, pid, fun) {
		if (!('Passport' in com))
			com.Passport = {};
		var pidmsg = genPid();
		com.Passport.Pid = pidmsg;

		if (pid) {
			if (pid.charAt(0) == '$') {
				var sym = pid.substr(1);
				if (sym in Root.Global)
					pid = Root.Global[sym];
			}
			com.Passport.To = pid;

			if (pid.charAt(0) != '$') {
				var pid24 = pid.substr(0, 24);
				if (pid24 == Pid24) {
					if (pid in EntCache) {
						var ent = EntCache[pid];
						ent.dispatch(com, fun);
					} else {
						log.v(' ** ERR:Local', pid, 'not in Cache');
					}
					return;
				}
			} else if (pid.substr(1) in SymTab) {
				pid = SymTab[pid.substr(1)];
				if (pid in EntCache) {
					var ent = EntCache[pid];
					ent.dispatch(com, fun);
				} else {
					log.v(' ** ERR:Local', pid, 'not in Cache');
				}
				return;
			}
		}

		if (fun) {
			MsgPool[pidmsg] = fun;
			MsgFifo.push(pidmsg);
			if (MsgFifo.length > 100) {
				var kill = MsgFifo.shift();
				delete MsgPool[kill];
			}
		}

		var str = JSON.stringify(com);
		if (__Config.TrackIO)
			log.v(' >> Msg:' + com.Cmd);
		if (!(silent)) log.v(str)
		SockIO.send(str);

		// function sendLocal() {
		//     if (pid in EntCache) {
		//         var ent = EntCache[pid];
		//         ent.dispatch(com, fun);
		//     } else {
		//         log.v(' ** ERR:Local', pid, 'not in Cache');
		//     }
		// }
	}

	function getFile(module, filename, fun) {
		let mod = ModCache[module];
		//log.v(Object.keys(ModCache[module]));
		if (filename in mod) {
			fun(null, mod[filename])
			return;
		}
		let err = `Error: File ${filename} does not exist in module ${module}`;
		fun(err);
	}

	//--------------------------------------------------------getFont
	function getFont(font) {
		if (font in Fonts)
			return Fonts[font];
	}

	//--------------------------------------------------------Entity
	// Entity base class
	function Entity(nxs, imp, par) {
		var Par = par;
		var Imp = imp;
		var Vlt = {};

		return {
			Par,
			Vlt,
			dispatch,
			send,
			deleteEntity,
			getPid,
			getFile,
			genModule
		};

		//-------------------------------------------------dispatch
		// This is used by Nexus to dispatch incoming messages.
		// It should not be used internally unless you have a
		// prediliction to talk to yourself =)
		function dispatch(com, fun) {
			var disp = Mod.dispatch;
			if (com.Cmd in disp) {
				disp[com.Cmd].call(this, com, fun);
				return;
			}
			if ('*' in disp) {
				disp['*'].call(this, com, fun);
				return;
			}
			//log.v(com.Cmd + ' unknown');
			if (fun)
				fun(com.Cmd + ' unknown');
		}

		function deleteEntity(fun) {
			nxs.deleteEntity(Par.Pid, fun);
		}

		//-------------------------------------------------getPid
		// Return Pid of entity
		function getPid() {
			log.w("getPid() is deprecated and will be removed. \n Use Par.Pid");
			return Par.Pid;
		}

		//generate a module in the local system
		function genModule(mod, fun) {
			nxs.genModule(mod, fun);
		}

		function getFile(filename, fun) {
			nxs.getFile(Par.Module, filename, fun);
		}

		//-------------------------------------------------send
		function send(com, pid, fun) {
			com.Passport = {};
			if (fun)
				com.Passport.From = Par.Pid;
			com.Passport.To = pid;
			nxs.send(com, pid, fun);
		}
	}

	//-----------------------------------------------------genNode
	// Generate node from parameter object
	function genEntity(par, fun) {
		//	log.v('--genEntity', par.Entity);
		var name = par.Entity;
		if (name in ModCache) {
			var mod = ModCache[name];
			var pid = genPid();
			par.Pid = pid;
			ent = new Entity(Nxs, mod, par);
			if (ent) {
				EntCache[pid] = ent;
				if (par.$Browser) {
					SymTab[par.$Browser] = pid;
				}
				fun(null, ent);
				return;
			}
			fun('genEntity failed');
			return;
		}
		var com = {};
		com.Cmd = 'GetEntityMod';
		var name = par.Entity;
		com.Name = name;
		send(com, null, done);

		function done(err, com) {
			if (!('Mod' in com)) {
				var errmsg = com.Name + 'module is not available';
				log.e(' ** ERR:' + errmsg);
				fun(err);
			}
			var pid = genPid();
			par.Pid = pid;

			var mod = eval(com.Mod);
			var ent = new Entity(Nxs, mod, par);
			if (ent) {
				ModCache[name] = mod;
				EntCache[pid] = ent;

				fun(null, ent);
				return;
			}
			fun('Entity creation failed');
		}
	}

	//-----------------------------------------------------deleteEntity
	// Generate node from parameter object
	function deleteEntity(pid, fun = _ => _) {
		if (EntCache[pid]) {
			delete EntCache[pid];
			log.v(pid, ' Deleted');
			fun(null)

		} else {
			log.w('Entity not found: ', pid);

			fun(("Entity not found: " + pid));

		}
	}

	//------------------------------------------------------genPid
	// Generate Pid (pseudo-GUID)
	function genPid() {
		var hexDigits = "0123456789ABCDEF";
		let pid = "";
		for (var i = 0; i < 32; i++)
			pid += hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		return pid;
	}

	//-------------------------------------------------genModule
	// This is the version used to install modules
	// after startup, such as web dashboards and such.
	// It provides for safe setup and start which is
	// handled by Nxs for modules instantiated initially.
	function genModule(mod, fun) {
		var pidapx;
		Initializers = {};
		addModule(mod, setup);

		function setup(err, pid) {
			//	log.v('pid', pid);
			//	log.v('Initializers', Initializers);
			pidapx = pid;
			if (err) {
				if (!silent) log.e(' ** genModule:' + err);
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
		function start(err, r) {
			if (err) {
				if (!silent) log.e(' ** genModule:' + err);
				fun(err);
				return;
			}
			if ('Start' in Initializers) {
				var q = {};
				q.Cmd = Initializers.Start;
				send(q, pidapx, pau);
			} else {
				pau();
			}
		}
		function pau(err, r) {
			if (err) {
				if (!silent) log.e(' ** genModule:' + err);
			}
			fun(err, pidapx);
		}
	}

	//-------------------------------------------------addModule
	function addModule(mod, fun) {
		if (!(silent)) log.v('..addModule');
		if (!(silent)) log.v(JSON.stringify(mod, null, 2));
		var ents = {};
		var lbls = {};
		var q = {};
		let modjson = null
		q.Cmd = 'GetModule';
		q.Module = mod.Module;
		if (!(silent)) log.v(q);
		send(q, PidServer, addmod);

		function addmod(err, r) {
			//log.v('..addmod');
			var module = r.Module;
			var zipmod = new JSZip();
			zipmod.loadAsync(r.Zip, { base64: true }).then(function (zip) {
				var dir = zipmod.file(/.*./);

				zip.file('module.json').async('string').then(function (str) {
					modjson = JSON.parse(str);
					ModuleCache[mod.Module] = modjson;
					var keys = Object.keys(mod);
					//debugger;
					styles();
				});


				function styles() {
					if ('styles.json' in modjson) {
						var obj = JSON.parse(modjson["styles.json"]);
						var keys = Object.keys(obj);
						//debugger;
						async.eachSeries(keys, function (key, func) {
							//debugger;

							//this needs to be reworked duplicate names are not loaded
							// if(Css.indexOf(key) >= 0) {
							// 	func();
							// 	return;
							// }

							Css.push(key);
							var file = obj[key];

							let css = modjson[file];
							//log.v("Css is ", css);
							var tag = document.createElement('style');
							tag.setAttribute("data-css-url", key);
							tag.setAttribute("type", 'text/css');
							tag.innerHTML = css;
							document.head.appendChild(tag);
							// var txt = document.createTextNode(css);
							// tag.appendChild(txt);
							// document.head.appendChild(tag);

							/*	var tag = document.createElement('script');
								tag.setAttribute("data-script-url", key);
								tag.setAttribute("type", 'text/javascript');
								var txt = document.createTextNode(scr);
								tag.appendChild(txt);
								document.head.appendChild(tag); */
							func();
						}, scripts);
					} else {
						scripts();
					}
				}

				function scripts() {
					//log.v('..scripts');
					if ('scripts.json' in modjson) {
						var obj = JSON.parse(modjson["scripts.json"]);
						var keys = Object.keys(obj);
						async.eachSeries(keys, function (key, func) {
							if (Scripts.indexOf(key) >= 0) {
								func();
								return;
							}
							Scripts.push(key);
							var file = obj[key];
							let scr = modjson[file];
							//log.v("loading module from ", module, scr);

							// var tag = document.createElement('script');
							// tag.setAttribute("data-script-url", key);
							// tag.setAttribute("type", 'text/javascript');
							// var txt = document.createTextNode(scr);
							// tag.appendChild(txt);
							// document.head.appendChild(tag);
							eval(scr);
							log.v("Evaled scr", file);
							func();
						}, fonts);
					} else {
						fonts();
					}
				}

				function fonts() {
					//	log.v('..fonts');
					if ('fonts.json' in modjson) {
						var obj = JSON.parse(modjson["fonts.json"]);
						var keys = Object.keys(obj);
						async.eachSeries(keys, function (key, func) {
							if (key in Fonts) {
								func();
								return;
							}
							var file = obj[key];
							let str = modjson[file];
							var json = JSON.parse(str);
							var font = new THREE.Font(json);
							if (!silent) log.v('font', font);
							Fonts[key] = font;
							func();
						}, schema);
					} else {
						schema();
					}
				}

				function schema() {
					//log.v('..schema');
					let str = JSON.parse(modjson["schema.json"]);
					compile(str);
				}
			});

			function compile(str) {
				//	log.v('..compile');
				var pidapx;
				var schema = str;
				ZipCache[module] = zipmod;
				//debugger;
				for (let lbl in schema) {
					var ent = schema[lbl];
					if ('Par' in mod) {
						for (key in mod.Par) {
							ent[key] = mod.Par[key];
						}
					}
					ent.Module = mod.Module;
					//Note: CurrentModule is only used in initial processing
					//      of browser.json
					if (lbl == 'Apex') {
						if (CurrentModule)
							ent.Pid = Root.ApexList[CurrentModule];
						else
							ent.Pid = genPid();
						pidapx = ent.Pid;
						//	log.v('Apex', ent);
					} else {
						ent.Pid = genPid();
					}
					lbls[lbl] = ent.Pid;
					ents[lbl] = ent;
				}
				var keys = Object.keys(ents);
				var nkey = keys.length;
				var ikey = 0;
				nextent();

				function nextent() {
					if (ikey >= nkey) {
						fun(null, pidapx);
						return;
					}
					var key = keys[ikey];
					var ent = ents[key];

					//The below seems to be duplicate code from 484-488

					// if('Par' in mod) {
					// 	for(key in mod.Par) {
					// 		ent[key] = mod.Par[key];
					// 	}
					// }
					ikey++;
					for (let key in ent) {
						val = ent[key];
						if (key == '$Setup') {
							//it looks like only one setup will be called. should be an array..
							Initializers.Setup = ent[key];
							Root.Setup[ent.Pid.substr(24)] = ent[key];
							continue;
						}
						if (key == '$Start') {
							//it looks like only one start will be called. should be an array..
							Initializers.Start = ent[key];
							Root.Start[ent.Pid.substr(24)] = ent[key];
							continue;
						}
						function recurseSymbol(obj) {

							if (typeof obj == 'string')
								return symbol(obj);
							if (typeof obj == 'object') {
								for (let sym in obj) {
									obj[sym] = recurseSymbol(obj[sym]);
								}
							}
							return obj;
						}
						ent[key] = recurseSymbol(ent[key]);
					}
					var modkey = ent.Module + '/' + ent.Entity;

					//seems to be duplicate from line 481

					//ZipCache[mod] = zipmod;
					let str = modjson[ent.Entity]
					var mod = eval(str);
					ModCache[modkey] = mod;
					EntCache[ent.Pid] = new Entity(Nxs, mod, ent);
					nextent();
				}

				function symbol(str) {
					var esc = str.charAt(0);
					if (esc == '#') {
						var lbl = str.substr(1);
						if (!(lbl in lbls)) {
							var err = ' ** Symbol ' + lbl + ' not defined';
							throw err;
						}
						return lbls[lbl];
					}
					if (esc == '$') {
						var sym = str.substr(1);
						if (!(sym in Root.ApexList)) {
							var err = ' ** Symbol ' + sym + ' not defined';
							throw err;
						}
						return Root.ApexList[sym];
					}
					return str;
				}
			}
		}
	}

})();
