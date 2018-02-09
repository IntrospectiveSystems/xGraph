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
	var ApexIndex = {};
	var ImpCache = {};
	var ModCache = {};
	var Modules = {};
	var Scripts = {};
	var Fonts = {};
	var Css = [];
	var MsgFifo = [];
	var MsgPool = {};
	var Nxs = {
		genPid,
		genEntity,
		deleteEntity,
		genModule,
		getFile,
		sendMessage,
		getFont
	};

	//
	// Logging Functionality
	//
	{
		// The defined log levels for outputting to the std.out() (ex. log. v(), log. d() ...)
		// Levels include:
		// v : verbose		Give too much information 
		// d : debug		For debugging purposes not in production level releases
		// i : info			General info presented to the end user 
		// w : warn			Failures that dont result in a system exit
		// e : error 		Critical failure should always follow with a system exit
		window.log = {
			v: console.log.bind(window.console, `%c[VRBS] %s`, 'color: gray'),
			d: console.log.bind(window.console, `%c[DBUG] %s`, 'color: magenta'),
			i: console.log.bind(window.console, `%c[INFO] %s`, 'color: cyan'),
			w: console.log.bind(window.console, `%c[WARN] %s`, 'color: color:yellow;background-color:#242424;'),
			e: console.log.bind(window.console, `%c[ERRR] %s`, 'color: red')
		};
		window.pidInterchange = (pid) => { return { Value: pid, Format: 'is.xgraph.pid', toString: function() {return this.Value} } };
	}

	return {
		boot
	};


	/**
	 * The function that is called from the .html file that initializes the system
	 * @param {string} sockio 	the sockio script  
	 * @param {object} cfg 		the object containing all browser required variables
	 */
	async function boot(sockio, cfg) {
		log.i('--Nxs is booting up');

		SockIO = sockio;
		SockIO.removeListener('message');

		SockIO.on('message', function (data) {
			var cmd = JSON.parse(data);

			if (Array.isArray(cmd)) {
				// if its an array, its probs a reply...
				// so, you should split it up.
				var [err, cmd] = cmd;
			}
			log.v(' << Msg:' + cmd.Cmd);

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

			// Try to dispatch
			var pid = cmd.Passport.To;
			if (pid in EntCache) {
				var ent = EntCache[pid];
				if ('Disp' in cmd.Passport && cmd.Passport.Disp == 'Query')
					ent.dispatch(cmd, reply);
				else
					ent.dispatch(cmd, _ => _);
			} else {
				log.e(pid, 'not in Cache');
				debugger;
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

		await genesis();

		Setup();
	}


	////////////////////////////////////////////////////////////////////////////////////////////////
	//
	// Only Function Definitions Beyond This Point
	//
	//

	/**
	 * 
	 * @param {object} cfg parameter containing all browser required files
	 */
	async function setup(cfg) {
		log.i('--Nxs Setting Up');

		Root = {};
		Root.Global = {};
		Root.Setup = {};
		Root.Start = {};
		Root.ApexList = {};

		parseCfg();

		await loadScripts();


		////////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Only Helper Functions Beyond This Point
		//
		//

		/**
		 * parse in the browser required files
		 */
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
					case "Scripts": {
						Scripts = cfg.Scripts;
						Scripts = (typeof Scripts == "object") ? Scripts : JSON.parse(Scripts);
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

		/**
		 * Load in the system level scripts from the server
		 */
		async function loadScripts() {
			let Viewify;

			if ("Viewify" in Scripts) {
				Viewify = Scripts["Viewify"];
				delete Scripts["Viewify"];
			}

			let scriptsPromises = [];

			for (let key in Scripts) {
				scriptsPromises.push(new Promise((resolve, reject) => {
					let q = {};
					q.Cmd = 'GetFile';
					q.File = Scripts[key];
					q.Passport = {};
					q.Passport.To = PidServer;
					q.Passport.Pid = genPid();
					sendSocket(q, function (err, r) {
						if (err) {
							log.w('Script error', err);
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

			if (Viewify) {
				await new Promise((resolve, reject) => {
					let q = {};
					q.Cmd = 'GetFile';
					q.File = Viewify;
					q.Passport = {};
					q.Passport.To = PidServer;
					q.Passport.Pid = genPid();
					sendSocket(q, function (err, r) {
						if (err) {
							log.w('Script error', err);
							reject(err);
							return;
						}
						script("Viewify", r.Data);
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
				});
			}
		}
	}

	/**
	 * load the xgraph system into memory EntCache and populate all requrements
	 */
	async function genesis() {
		log.i("Nxs Genesis");

		generateModuleCatalog();

		await unpackCache();

		await recursiveBuild();

		await populate();





		////////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Only Helper Functions Beyond This Point
		//
		//


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

				/**
				 * Add the module to the Modules object if unique
				 * @param {object} mod 		The module object 
				 * @param {string} mod.Module	The name of the module
				 * @param {object, string} mod.Source The Module broker or path reference
				 */
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
		 * Make sure all the required modules were in the cache zip
		 */
		async function recursiveBuild() {
			let moduleKeys = Object.keys(Modules);
			for (let ifolder = 0; ifolder < moduleKeys.length; ifolder++) {
				await new Promise(async (res, rej) => {

					let folder = moduleKeys[ifolder];
					if (!(folder in ModCache)) {
						log.w(`Module ${folder} not in Zipped Cache`);
						rej();
						return;
					}
					let modjson = ModCache[folder];
					await styles();

					/**
					 * Load all the scripts that were passed in the styles.json object of the module
					 */
					async function styles() {
						if ('styles.json' in modjson.files) {
							log.v(`Loading styles.json from ${folder}`);
							let schema = await new Promise((res2, rej2) => {
								modjson.file("styles.json").async("string").then((sch) => {
									res2(sch);
								});
							});
							var obj = JSON.parse(schema);
							var keys = Object.keys(obj);
							for (let idx = 0; idx < keys.length; idx++) {
								let key = keys[idx];
								if (Css.indexOf(key) >= 0) {
									continue;
								}
								Css.push(key);
								var file = obj[key];
								let dat = await new Promise((res1, rej1) => {
									modjson.file(file).async("string").then((dat) => {
										res1(dat);
									});
								});
								let css = dat;
								var tag = document.createElement('style');
								tag.setAttribute("data-css-url", key);
								tag.setAttribute("type", 'text/css');
								tag.innerHTML = css;
								document.head.appendChild(tag);
								log.v("Evaled styles", file);
							}
						}
						await scripts();
					}

					/**
					 * Load all the scripts that were passed in the scripts.json object of the module
					 */
					async function scripts() {
						if ('scripts.json' in modjson.files) {
							log.v(`Loading scripts.json from ${folder}`);
							let scripts = await new Promise((res2, rej2) => {
								modjson.file("scripts.json").async("string").then((dat) => {
									res2(dat);
								});
							});
							var obj = JSON.parse(scripts);
							var keys = Object.keys(obj);
							for (let idx = 0; idx < keys.length; idx++) {
								let key = keys[idx];
								if (key in Scripts) {
									continue;
								}
								var file = obj[key];
								let script = await new Promise((res3, rej3) => {
									modjson.file(file).async("string").then((dat) => {
										res3(dat);
									});
								});
								Scripts[key] = script;
								eval(script);
								log.v("Evaled scr", file);
							}
						}
						await fonts();
					}

					/**
					 * Load all the fonts that were passed in the fonts.json object of the module
					 */
					async function fonts() {
						if ('fonts.json' in modjson.files) {
							log.v(`Loading fonts.json from ${folder}`);
							let fonts = await new Promise((res2, rej2) => {
								modjson.file("fonts.json").async("string").then((dat) => {
									res2(dat);
								});
							});
							var obj = JSON.parse(fonts);
							var keys = Object.keys(obj);
							for (let idx = 0; idx < keys.length; idx++) {
								let key = keys[idx];
								if (key in Fonts) {
									continue;
								}
								var file = obj[key];
								log.v("Evaled font", file);
								let font = await new Promise((res3, rej3) => {
									modjson.file(file).async("string").then((dat) => {
										res3(dat);
									});
								});
								var json = JSON.parse(font);
								Fonts[key] = new THREE.Font(json);
							}
						}
						res();
					}
				});
			}
		}

		/**
		 * Unpack the zipped cache and store the parsed modules in the ModCache object
		 */
		function unpackCache() {
			return new Promise((resolve, reject) => {
				//unpack the zipped cache put all modules into the ModCache
				const zipmod = new JSZip();
				zipmod.loadAsync(Cache, { base64: true }).then(function (zip) {
					zip.file('manifest.json').async('string').then(async (cacheArray) => {
						//unpack all of the modules into the ModCache
						cacheArray = JSON.parse(cacheArray);
						log.v(`Modules array is [${cacheArray}]`);
						let ModulePromiseArray = [];
						for (let idx = 0; idx < cacheArray.length; idx++) {
							log.v(`Unpacking Module: ${cacheArray[idx]}`);
							ModulePromiseArray.push(new Promise((res, rej) => {
								zip.file(cacheArray[idx]).async("uint8array").then((modzip) => {
									let modunzip = new JSZip();
									modunzip.loadAsync(modzip).then((mod) => {
										log.v(`Module ${cacheArray[idx]} files are ${Object.keys(mod.files)}`);
										ModCache[cacheArray[idx]] = mod;
										res();
									});
								});
							}));
						}
						await Promise.all(ModulePromiseArray);
						resolve();
					});
				});
			});
		}

		/**
		 * Assign pids to all module apex entities then compile each in turn
		 */
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
				//log.v(instname + '\n', JSON.stringify(inst, null, 2));
				var pidinst = Root.ApexList[instname];
				await compileInstance(pidinst, inst, true);
			}
		}
	}

	/**
	 * Call the setup function in each of the apex entities that requires it
	 */
	async function Setup() {
		log.v(`--Nexus/Setup ${JSON.stringify(Root.Setup, null, 2)}`);

		var pids = Object.keys(Root.Setup);
		for(let pid of pids) {
			await new Promise(resolve => {

				// create a timer that checks if we've completed, starting at 1 second
				// and doubling each time it checks.
				let time = 1000; // the time to wait
				let monitor = setTimeout(checkIn, time); // the timer reference, so we can cancel it
				// function to check in after the timer finishes
				function checkIn() {
					// try and get the module name from ApexList (For End User)
					let name = pid; // default it to the pid
					for(let key in Root.ApexList) {
						//search apex list, if we have a pid match, use that.
						if(Root.ApexList[key] == pid) name = key;
					}
					//warn in the console about taking a long time
					log.w(`${name} taking a while to Setup... Retrying in ${time / 1000}s`);
					//restart the timer with double the time.
					time *= 2;
					monitor = setTimeout(checkIn, time);
				}

				// send the setup message
				sendMessage({
					Cmd: Root.Setup[pid],
					Passport: {
						To: pid,
						Pid: genPid()
					}
				}, _ => {
					// clear the timer that prints warnings, because we're done.
					clearTimeout(monitor);
					// resolve this promise, move to next pid.
					resolve()
				});
			});
		}
		//after all pids complete, move to Nxsx/Start phase
		Start();
	}

	/**
	 * Call the start function in each of the apex entities that requires it
	 */
	function Start() {
		log.v(`--Nxs/Start ${JSON.stringify(Root.Start, null, 2)}`);
		var pids = Object.keys(Root.Start);
		var npid = pids.length;
		var ipid = 0;
		start();

		function start() {
			if (ipid >= npid) {
				Run();
				return;
			}
			var pid = pids[ipid];
			ipid++;
			var q = {};
			q.Cmd = Root.Start[pid];
			q.Passport = {};
			q.Passport.To = pid;
			q.Passport.Pid = genPid();
			sendMessage(q, done);

			function done(err, r) {
				start();
			}
		}
	}

	/**
	 * The final function called when the system is done with initialize, setup and start
	 */
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
	 * @param {boolean} saveRoot	Add the setup and start functions of the apex to the Root.Setup and start
	 */
	async function compileInstance(pidapx, inst, saveRoot) {
		log.v('compileInstance', inst.Module, pidapx);
		var Local = {};
		var modnam = inst.Module;
		var mod;
		var ents = [];
		var modnam = modnam.replace(/\:/, '.').replace(/\//g, '.');

		if (modnam in ModCache) {
			mod = ModCache[modnam];
		} else {
			log.e('Module <' + modnam + '> not in ModCache');
			return;
		}

		var schema = await new Promise(async (res, rej) => {
			if ('schema.json' in mod.files) {
				mod.file('schema.json').async('string').then(function (schemaString) {
					res(JSON.parse(schemaString));
				});
			} else {
				log.e('Module <' + modnam + '> schema not in ModCache');
				rej();
				return;
			}
		});

		var entkeys = Object.keys(schema);

		//set Pids for each entity in the schema
		for (j = 0; j < entkeys.length; j++) {
			let entkey = entkeys[j];
			if (entkey === 'Apex') {
				Local[entkey] = pidapx;
				ApexIndex[pidapx] = modnam;
			} else
				Local[entkey] = genPid();
		}

		//unpack the par of each ent
		for (let j = 0; j < entkeys.length; j++) {
			let entkey = entkeys[j];
			let ent = schema[entkey];
			ent.Pid = Local[entkey];
			ent.Module = modnam;
			ent.Apex = pidapx;

			//give the webProxy modules access to the websocket and callback message stack
			if (modnam.split(/[\.\/]/g)[modnam.split(/[\.\/]/g).length - 1] == 'WebProxy')
				ent.sendSock = sendSocket;

			//unpack the config pars to the par of the apex of the instance
			if (entkey == 'Apex' && 'Par' in inst) {
				let pars = Object.keys(inst.Par);
				for (let ipar = 0; ipar < pars.length; ipar++) {
					let par = pars[ipar];
					ent[par] = inst.Par[par];
				}
			}

			//load pars from schema
			var pars = Object.keys(ent);
			for (ipar = 0; ipar < pars.length; ipar++) {
				var par = pars[ipar];
				var val = ent[par];
				if (entkey == "Apex" && saveRoot) {
					if (par == "$Setup") Root.Setup[ent.Pid] = val;
					if (par == "$Start") Root.Start[ent.Pid] = val;
				}
				ent[par] = await symbol(val);
			}
			ents.push(ent);
		}

		for (let entIdx = 0; entIdx < ents.length; entIdx++) {
			let par = ents[entIdx];
			let impkey = modnam + par.Entity;
			if (!(impkey in ImpCache)) {
				let entString = await new Promise(async (res, rej) => {
					mod.file(par.Entity).async("string").then((string) => res(string))
				});
				ImpCache[impkey] = (1, eval)(entString);
			}
			EntCache[par.Pid] = new Entity(Nxs, ImpCache[impkey], par);
		}

		async function symbol(val) {
			if (typeof val === 'object') {
				if (Array.isArray(val)) {
					val = val.map(v => symbol(v));
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
			if (val.charAt(0) === '$' && sym in Root.ApexList)
				return Root.ApexList[sym];
			if (val.charAt(0) === '#' && sym in Local)
				return Local[sym];
			if (val.charAt(0) === '\\')
				return sym;
			return val;
		}
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
	function sendMessage(com, fun) {
		if (!('Passport' in com)) {
			log.w('Message has no Passport, ignored');
			log.w('    ' + JSON.stringify(com));
			fun('No Passport');
			return;
		}
		if (!('To' in com.Passport) || !com.Passport.To) {
			log.w('Message has no destination entity, ignored');
			log.w('    ' + JSON.stringify(com));
			console.trace();
			fun('No recipient in message', com);
			return;
		}
		if (!('Pid' in com.Passport)) {
			log.w('Message has no message id, ignored');
			log.w('    ' + JSON.stringify(com));
			fun('No message id', com);
			return;
		}

		let pid = com.Passport.To;
		let apx = com.Passport.Apex || pid;
		let pidmsg = com.Passport.Pid;
		if (pid in EntCache) {
			done(EntCache[pid]);
			return;
		} else {
			// debugger;
			let err = 'Ent not in EntCache';
			log.w(err);
			fun(err, com);
		}

		function done(entContext) {
			if ((pid in ApexIndex) || (entContext.Par.Apex == apx)) {
				entContext.dispatch(com, reply);
				return;
			} else {
				let err = 'Trying to send a message to a non-Apex'
					+ 'entity outside of the sending module';
				log.w(err);
				log.w(JSON.stringify(com, null, 2));
				fun(err, com);
			}
		}
		function reply(err, q) {
			if (fun) fun(err, q);
		}
	}

	/**
	 * Send a message over the websocket
	 * If a callback is provided, return when finished
	 * @param {object} com 			the message object 
	 * @param {string} com.Cmd 		the command of the message
	 * @param {object} com.Passport	the information about the message
	 * @param {string} com.Passport.To the Pid of the recipient module
	 * @param {string} com.Passport.Pid the ID of the message
	 * @param {string=} com.Passport.From the Pid of the sending module
	 * @callback fun 				the callback function to return to when finished
	 */
	function sendSocket(com, fun) {

		//check for message valididty
		if (!('Passport' in com)) {
			log.w('Message has no Passport, ignored');
			log.w('    ' + JSON.stringify(com));
			fun('No Passport');
			return;
		}
		if (!('To' in com.Passport) || !com.Passport.To) {
			log.w('Message has no destination entity, ignored');
			log.w('    ' + JSON.stringify(com));
			console.trace();
			fun('No recipient in message', com);
			return;
		}
		if (!('Pid' in com.Passport) || (com.Passport.Pid.length != 32)) {
			log.w('Message has no message id, ignored');
			log.w('    ' + JSON.stringify(com));
			fun('No message id', com);
			return;
		}

		//we're dispatching to the server
		if (fun) {
			MsgPool[com.Passport.Pid] = fun;
			MsgFifo.push(com.Passport.Pid);
			if (MsgFifo.length > 100) {
				var kill = MsgFifo.shift();
				delete MsgPool[kill];
			}
		}

		var str = JSON.stringify(com);
		log.v(' >> Msg:' + com.Cmd);
		log.v(str.substring(0, (str.length > 100) ? 100 : str.length) + ' ... ');
		SockIO.send(str);
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

		if ('static' in mod) {
			let filearr = filename.split('/');
			let store = mod["static"];
			let [err, file] = subSearch(filearr, store);
			fun(err, file);
			return;

			// /**
			//  * Recursive object search
			//  * @param {Object} ar 		An array of requested files (requested file separated by '/')
			//  * @param {Object} st 		The directort we're searching in 
			//  */
			function subSearch(ar, st) {
				if (ar[0] in st) {
					if (ar.length == 1) {
						return [null, st[ar[0]]];
					}
					else {
						return subSearch(arr.slice(1), st[ar[0]]);
					}
				} else {
					let err = `${url} does not exist in Par.Static`;
					log.w(err);
					return [err, null];
				}
			}
		}
		let err = `File ${filename} does not exist in module ${module}`;
		log.e(err);
		fun(err);
	}


	/**
	 * Access a font that was loaded in the server
	 * @param {string} font the name of the font we're trying to access
	 */
	function getFont(font) {
		if (font in Fonts)
			return Fonts[font];
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
			getFile,
			getFont
		};

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
		 * Access a font that was loaded in the server
		 * @param {string} font the name of the font we're trying to access
		 */
		function getFont(fontName) {
			log.v(`Entity - Getting font ${fontName} from ${Par.Module}`);
			return nxs.getFont(fontName);
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
			log.e(' Nada Cmd:' + com.Cmd);
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
			log.e(' <' + par.Entity + '> not in module <' + ApexIndex[apx] + '>');
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
		if (EntCache[pid]) {
			delete EntCache[pid];
			log.v(pid, ' Deleted');
			fun(null);
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

	/**
	 * Starts an instance of a module that exists in the cache.
	 * After generating, the instance Apex receives a setup and start command synchronously
	 * @param {Object} inst 		Definition of the instance to be spun up
	 * @param {string} inst.Module 	The name of te module to spin up
	 * @param {Object=} inst.Par	The par of the to be encorporated with the Moduel Apex Par	
	 * @callback fun 				(err, pid of module apex)
	 */
	function genModule(inst, fun = _ => _) {
		(async () => {
			inst.Module = inst.Module.replace(/[\/\:]/g, '.');

			if (!(inst.Module in ModCache)) {
				let err = `Module ${inst.Module} does not exist in ModCache`;
				log.e(err);
				fun(err);
				return;
			}
			let mod = ModCache[inst.Module];

			let pidapx = genPid();
			ApexIndex[pidapx] = mod.ModName;
			Root.ApexList[pidapx] = pidapx;
			await compileInstance(pidapx, inst, false);

			var schema = await new Promise(async (res, rej) => {
				if ('schema.json' in mod.files) {
					mod.file('schema.json').async('string').then(function (schemaString) {
						res(JSON.parse(schemaString));
					});
				} else {
					log.e('Module <' + modnam + '> schema not in ModCache');
					res()
					return;
				}
			});

			setup();

			function setup() {
				if (!("$Setup" in schema.Apex)) {
					start();
					return;
				}
				var com = {};
				com.Cmd = schema.Apex["$Setup"];
				com.Passport = {};
				com.Passport.To = pidapx;
				com.Passport.Pid = genPid();
				sendMessage(com, start);
			}

			// Start
			function start() {
				if (!("$Start" in schema.Apex)) {
					fun(null, pidapx);
					log.v(`The genModule ${mod.ModName} pid apex is ${pidapx}`);
					return;
				}
				var com = {};
				com.Cmd = schema.Apex["$Start"];
				com.Passport = {};
				com.Passport.To = pidapx;
				com.Passport.Pid = genPid();
				sendMessage(com, () => {
					log.v(`The genModule ${mod.ModName} pid apex is ${pidapx}`);
					fun(null, pidapx);
				});
			}
		})();
	}
})();
