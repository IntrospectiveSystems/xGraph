//# sourceURL=Nxs
__Nexus = (_ => {
	console.log(' ** Nxs executing');

	var SockIO;
	var Root;
	var PidServer;
	var PidNxs;
	var Config = {};
	var EntCache = {};
	var ModCache = {};
	var Modules = {};

	var PidTop;
	var PidStart;
	var CurrentModule;
	var Initializers = {};

	var ModuleCache = {};
	var ZipCache = {};
	var SymTab = {};
	var Css = [];
	var Scripts = [];
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
		start: start,
		// genPid: genPid,
		// genModule: genModule,
		// send: send,
		// getFont: getFont
	};

	function start(sockio, cfg) {
		if (!silent) log.i('--Nxs/start');
		Config = JSON.parse(cfg.Config);
		if (!silent) log.v('Config', JSON.stringify(Config, null, 2));
		PidNxs = cfg.Pid;
		PidServer = cfg.PidServer;
		SockIO = sockio;
		SockIO.removeListener('message');

		SockIO.on('message', function (data) {
			var cmd = JSON.parse(data);
			if (!silent) console.log(' << Msg:' + cmd.Cmd);

			//if the message is a reply pair it with its callback
			if ('Passport' in cmd && cmd.Passport.Reply) {
				var pid = cmd.Passport.Pid;
				var ixmsg = MsgFifo.indexOf(pid);
				if (ixmsg >= 0) {
					var func = MsgPool[pid];
					delete MsgPool[pid];
					MsgFifo.splice(ixmsg, 1);
					if (func) {
						func(null, cmd);
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
				console.log(' ** ERR:Local', pid, 'not in Cache');
			}
			return;


			function reply(err, cmd) {
				if (cmd == null)
					return;
				if ('Passport' in cmd) {
					cmd.Passport.Reply = true;
					var str = JSON.stringify(cmd);
					SockIO.send(str);
				}
			}
		});
		Genesis(cfg);
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
						console.log(' ** ERR:Local', pid, 'not in Cache');
					}
					return;
				}
			} else if (pid.substr(1) in SymTab) {
				pid = SymTab[pid.substr(1)];
				if (pid in EntCache) {
					var ent = EntCache[pid];
					ent.dispatch(com, fun);
				} else {
					console.log(' ** ERR:Local', pid, 'not in Cache');
				}
				return;
			}
		}
		if (fun) {
			//debugger;
			MsgPool[pidmsg] = fun;
			MsgFifo.push(pidmsg);
			if (MsgFifo.length > 100) {
				var kill = MsgFifo.shift();
				delete MsgPool[kill];
			}
		}
		var str = JSON.stringify(com);
		if (__Config.TrackIO)
			console.log(' >> Msg:' + com.Cmd);
		if (!(silent)) console.log(str)
		SockIO.send(str);

		// function sendLocal() {
		//     if (pid in EntCache) {
		//         var ent = EntCache[pid];
		//         ent.dispatch(com, fun);
		//     } else {
		//         console.log(' ** ERR:Local', pid, 'not in Cache');
		//     }
		// }
	}

	function getFile(module, filename, fun) {
		let mod = ModuleCache[module];
		//console.log(Object.keys(ModCache[module]));
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
			//console.log(com.Cmd + ' unknown');
			if (fun)
				fun(com.Cmd + ' unknown');
		}

		function deleteEntity(fun) {
			nxs.deleteEntity(Par.Pid, fun);
		}

		//-------------------------------------------------getPid
		// Return Pid of entity
		function getPid() {
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

		//-------------------------------------------------reply
		// Reply to a message previously received
		function reply(com, fun) {

		}
	}

	//-----------------------------------------------------genNode
	// Generate node from parameter object
	function genEntity(par, fun) {
		//	console.log('--genEntity', par.Entity);
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
				console.log(' ** ERR:' + errmsg);
				fun(err);
			}
			var pid = genPid();
			par.Pid = pid;
			// if
			var mod = eval(com.Mod);
			var ent = new Entity(Nxs, mod, par);
			if (ent) {
				ModCache[name] = mod;
				EntCache[pid] = ent;
				//                if (par.$Browser) {
				//                	SymTab[par.$Browser] = pid;
				//                }
				fun(null, ent);
				return;
			}
			fun('Entity creation failed');
		}
	}

	//-----------------------------------------------------deleteEntity
	// Generate node from parameter object
	function deleteEntity(pid, fun) {
		if (EntCache[pid]) {
			delete EntCache[pid];
			console.log(pid, ' Deleted');
			if (fun) {
				fun(null)
			}
		} else {
			console.log('Entity not found: ', pid);
			if (fun) {
				fun(("Entity not found: " + pid));
			}
		}
	}

	//------------------------------------------------------genPid
	// Generate Pid (pseudo-GUID)
	async function genPid() {
		const pidBuffer = await crypto.subtle.digest("SHA-1", new TextEncoder("utf-8").encode(date.toString()));
		const pid = Array.from(new Uint8Array(pidBuffer)).map(b => ('00' + b.toString(16)).slice(-2)).join('').slice(8);

		log.d(pid, pid.length);

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
			//	console.log('pid', pid);
			//	console.log('Initializers', Initializers);
			pidapx = pid;
			if (err) {
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

		function start(err, r) {
			if (err) {
				console.log(' ** genModule:' + err);
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
				console.log(' ** genModule:' + err);
			}
			fun(err, pidapx);
		}

	}

	//-------------------------------------------------addModule
	function addModule(mod, fun) {
		if (!(silent)) console.log('..addModule');
		if (!(silent)) console.log(JSON.stringify(mod, null, 2));
		var ents = {};
		var lbls = {};
		var q = {};
		let modjson = null
		q.Cmd = 'GetModule';
		q.Module = mod.Module;
		if (!(silent)) console.log(q);
		send(q, PidServer, addmod);

		function addmod(err, r) {
			//console.log('..addmod');
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
							//console.log("Css is ", css);
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
					//console.log('..scripts');
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
							//console.log("loading module from ", module, scr);

							// var tag = document.createElement('script');
							// tag.setAttribute("data-script-url", key);
							// tag.setAttribute("type", 'text/javascript');
							// var txt = document.createTextNode(scr);
							// tag.appendChild(txt);
							// document.head.appendChild(tag);
							eval(scr);
							console.log("Evaled scr", file);
							func();
						}, fonts);
					} else {
						fonts();
					}
				}

				function fonts() {
					//	console.log('..fonts');
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
							if (!silent) console.log('font', font);
							Fonts[key] = font;
							func();
						}, schema);
					} else {
						schema();
					}
				}

				function schema() {
					//console.log('..schema');
					let str = JSON.parse(modjson["schema.json"]);
					compile(str);
				}
			});

			function compile(str) {
				//	console.log('..compile');
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
						//	console.log('Apex', ent);
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

	//-----------------------------------------------------Genesis
	// Create cache if it does nto exist and populate
	// This is called only once when a new systems is
	// first instantiated
	function Genesis(cfg) {
		if (!silent) console.log('--Nxs/Genesis');

		Root = {};
		Root.Global = {};
		Root.Setup = {};
		Root.Start = {};
		Root.ApexList = cfg.ApexList || {};
		var ikey = 0;
		if ('Scripts' in cfg) {
			var keys = Object.keys(cfg.Scripts);
			nkeys = keys.length;
		} else {
			nkeys = 0;
		}
		if (!silent) console.log('Scripts', nkeys, cfg.Scripts);
		nextscript();

		function nextscript() {
			//	console.log('..nextscript');
			if (ikey >= nkeys) {
				modules();
				return;
			}
			var key = keys[ikey];
			ikey++;
			var q = {};
			q.Cmd = 'GetFile';
			q.File = Config.Scripts[key];
			send(q, Config.pidServer, function (err, r) {
				if (err) {
					console.log(' ** ERR:Script error', err);
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
				nextscript();
			}
		}

		//.................................................modules
		function modules() {
			var keys = Object.keys(Config.Modules);

			generateModuleCatalog();

			recursiveBuild();

			for (var i = 0; i < keys.length; i++) {
				key = keys[i];
				Root.ApexList[key] = genPid();
			}

			let instArray = []
			async.eachSeries(keys, function (key, func) {
				let mod = Config.Modules[key];
				CurrentModule = key;
				addModule(mod, addmod);

				function addmod(err, pid) {
					if (err) {
						console.log(' ** ERR:Cannot add mod <' + r.Module + '>');
					}
					//TBD: Might want to bail on err
					console.log('Apex', key, '<=', pid);
					func();
				}
			}, Setup);


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

					await Promise.all(modArray)

				}

				/**
				 * Write the modules.json to a zipped cache and set as Par.System 
				 */
				function populate() {
					const jszip = require("jszip");
					var zip = new jszip();
					var man = [];
					zip.folder("cache");
					for (let folder in ModCache) {
						let mod = ModCache[folder];
						if (typeof mod == "object")
							mod = JSON.stringify(mod);
						let dir = "cache/" + folder;
						zip.folder(dir);
						let path = dir + '/Module.json';
						man.push(path);
						zip.file(path, mod, {
							date: new Date("December 25, 2007 00:00:01")
							//the date is required for zip consistency
						});
					}
					zip.file('manifest.json', JSON.stringify(man), {
						date: new Date("December 25, 2007 00:00:01")
						//the date is required for zip consistency
					});
					zip.generateAsync({ type: 'base64' }).then(function (data) {
						resolve(data);
					});

				}
			}

			function getModule(modRequest, fun){
				let modnam = modRequest.Module;
				let source = modRequest.Source;
				let mod = {};
				let ModName = modnam.replace(/\:/, '.').replace(/\//g, '.');

				//get the module from memory (ModCache) if it has already been retrieved
				if (ModName in ModCache) return fun(null, ModCache[ModName]);

				//unpack the zipped cache put all modules inot the ModCache
				const zipmod = new JSZip();
				zipmod.loadAsync(cfg.Cache, { base64: true }).then(function (zip) {
					zip.file('manifest.json').async('string').then((str) => {


						log.d(`Cache contains these files ${JSON.parse(str)}`);

						zip.file('module.json').async('string').then(function (str) {
							modjson = JSON.parse(str);
							ModuleCache[mod.Module] = modjson;
						});

					});

					
				});
			}
		}
	}

	//-------------------------------------------------Setup
	function Setup(err) {
		// console.log('--Nexus/Setup');

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
		console.log('--Nxs/Start');
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
			//console.log("start ", pid);
			send(q, pid, done);

			function done(err, r) {
				//console.log("Return start ", pid);
				start();
			}
		}
	}

	//-------------------------------------------------Run
	function Run() {
		console.log('--Nxs/Run');
	}
}

}) ();
