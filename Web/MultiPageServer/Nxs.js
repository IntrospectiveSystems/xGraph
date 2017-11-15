//# sourceURL=Nxs
__Nexus = (function () {
	console.log(' ** Nxs executing');
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
	var SockIO;
	var Root;
	var Pid24;
	var PidServer;
	var PidNxs;
	var PidTop;
	var PidStart;
	var Config;
	var CurrentModule;
	var Initializers = {};
	var EntCache = {};
	window.entCache = EntCache;
	var ModCache = {};
	var ZipCache = {};
	var SymTab = {};
	var Css = [];
	var Scripts = [];
	var Fonts = {};
	var Nxs = {
		genPid: genPid,
		genEntity: genEntity,
		delEntity: delEntity,
		genModule: genModule,
		send: send,
		getFont: getFont
	};
	var MsgFifo = [];
	var MsgPool = {};
	var that = this;
	__Config = {};
	__Config.TrackIO = false;
	__Share = {};
	let silent = true;

	return {
		start: start,
		genPid: genPid,
		genModule: genModule,
		send: send,
		getFont: getFont
	};

	function start(sockio, cfg) {
		if (!silent) console.log('--Nxs/start');
		if (!silent) console.log('cfg', JSON.stringify(cfg, null, 2));
		Pid24 = cfg.Pid24;
		PidServer = cfg.PidServer;
		SockIO = sockio;
		SockIO.removeListener('message');
		SockIO.on('message', function (data) {
			var cmd = JSON.parse(data);
			if(Array.isArray(cmd)) {
				// if its an array, its probs a reply...
				// so, you should split it up.
				var [err, cmd] = cmd;
				// if(cmd.Cmd == 'Evoke') debugger;
			}
			// debugger;
			if (!silent) console.log(' << Msg:' + cmd.Cmd);
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
			// Not reply, try to dispatch on browser
			var pid = cmd.Passport.To;
			var pid24 = pid.substr(0, 24);
			if (pid24 == Pid24) {
				if (pid in EntCache) {
					var ent = EntCache[pid];
					if ('Disp' in cmd.Passport && cmd.Passport.Disp == 'Query')
						ent.dispatch(cmd, reply);
					else
						ent.dispatch(cmd, () => {

						});
				} else {
					console.warn(` ** ERR:Local ${pid} not in Cache. Ignoring...`);
				}
				return;
			}

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
						console.error(' ** ERR:Local', pid, 'not in Cache');
					}
					return;
				}
			} else if (pid.substr(1) in SymTab) {
				pid = SymTab[pid.substr(1)];
				if (pid in EntCache) {
					var ent = EntCache[pid];
					ent.dispatch(com, fun);
				} else {
					console.error(' ** ERR:Local', pid, 'not in Cache');
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
			if (!silent) console.log(' >> Msg:' + com.Cmd);
		SockIO.send(str);


	}

	//--------------------------------------------------------getFont
	function getFont(font) {
		if (font in Fonts)
			return Fonts[font];
	}

	//--------------------------------------------------------Entity
	// Entity base class
	function Entity(nxs, mod, par) {
		//	var Nxs = nxs;
		var Par = par;
		var Mod = mod;
		var Vlt = {};

		return {
			Par: Par,
			Mod: Mod,
			Vlt: Vlt,
			//		Nxs: Nxs,
			dispatch: dispatch,
			send: send,
			deleteEntity: deleteEntity,
			getPid: getPid,
			genModule: genModule
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
			nxs.delEntity(Par.Pid, fun);
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
				console.error(' ** ERR:' + errmsg);
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

	//-----------------------------------------------------delEntity
	// Generate node from parameter object
	function delEntity(pid, fun) {
		if (EntCache[pid]) {
			delete EntCache[pid];
			if (!silent) console.log(pid, ' Deleted');
			if (fun) {
				fun(null)
			}
		} else {
			if (!silent) console.log('Entity not found: ', pid);
			if (fun) {
				fun(("Entity not found: " + pid));
			}
		}
	}
	//------------------------------------------------------genPid
	// Generate Pid (pseudo-GUID)
	function genPid() {
		var pid = Pid24;
		var hexDigits = "0123456789ABCDEF";
		for (var i = 0; i < 8; i++)
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
			//	console.log('pid', pid);
			//	console.log('Initializers', Initializers);
			pidapx = pid;
			if (err) {
				if (!silent) console.log(' ** genModule:' + err);
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
				if (!silent) console.log(' ** genModule:' + err);
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
				if (!silent) console.log(' ** genModule:' + err);
			}
			fun(err, pidapx);
		}

	}

	function asyncGenModule(mod) {
		return new Promise((resolve, reject) => {
			genModule(mod, (err, apx) => {
				if (err) reject(err);
				else resolve(apx);
			})
		});
	}

	//-------------------------------------------------addModule
	function addModule(mod, fun) {
		//	console.log('..addModule');
		//	console.log(JSON.stringify(mod, null, 2));
		// debugger;
		var ents = {};
		var lbls = {};
		var q = {};
		let modjson = null;
		q.Cmd = 'GetModule';
		q.Module = mod.Module;
		if (!silent) console.log(q);
		send(q, PidServer, addmod);

		function addmod(err, r) {
			//	console.log('..addmod');
			var module = r.Module;
			var zipmod = new JSZip();
			zipmod.loadAsync(r.Zip, { base64: true }).then(function (zip) {
				var dir = zipmod.file(/.*./);

				zip.file('module.json').async('string').then(function (str) {
					modjson = JSON.parse(str);
					var keys = Object.keys(mod);
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
							if(!silent) console.log("Evaled scr", file);
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
		Config = cfg;
		Root = {};
		Root.Global = {};
		Root.Setup = {};
		Root.Start = {};
		Root.ApexList = cfg.ApexList || {};
		var ikey = 0;
		if ('Scripts' in Config) {
			var keys = Object.keys(Config.Scripts);
			nkeys = keys.length;
		} else {
			nkeys = 0;
		}
		if (!silent) console.log('Scripts', nkeys, Config.Scripts);
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
					console.error(' ** ERR:Script error', err);
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
			for (var i = 0; i < keys.length; i++) {
				key = keys[i];
				Root.ApexList[key] = genPid();
			}
			async.eachSeries(keys, function (key, func) {
				let mod = Config.Modules[key];
				CurrentModule = key;
				addModule(mod, addmod);

				function addmod(err, pid) {
					if (err) {
						console.error(' ** ERR:Cannot add mod <' + r.Module + '>');
					}
					//TBD: Might want to bail on err
					if (!silent) console.log('Apex', key, '<=', pid);
					func();
				}
			}, Setup);

		}

		//-------------------------------------------------Setup
		function Setup(err) {
			console.log('\n--Nexus/Setup');
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
			console.log('\n--Nxs/Start');
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
				send(q, pid, done);

				function done(err, r) {
					start();
				}
			}
		}

		//-------------------------------------------------Run
		function Run() {
			console.log('\n--Nxs/Run');
		}
	}

})();




// --------------------------------
// this is a complete hack, to 
// give me easy cookie access
// TODO create actual Nxs functionality
// for accessing cookies
// --------------------------------

// API for future reference: 
// Cookies('a', 3); sets a to 3
// Cookies('a'); returns a: 3
// Cookies('a', undefined); deletes a

!function(e,t){"use strict";var o=function(e){if("object"!=typeof e.document)throw new Error("Cookies.js requires a `window` with a `document` object");var t=function(e,o,n){return 1===arguments.length?t.get(e):t.set(e,o,n)};return t._document=e.document,t._cacheKeyPrefix="cookey.",t._maxExpireDate=new Date("Fri, 31 Dec 9999 23:59:59 UTC"),t.defaults={path:"/",secure:!1},t.get=function(e){t._cachedDocumentCookie!==t._document.cookie&&t._renewCache();var o=t._cache[t._cacheKeyPrefix+e];return void 0===o?void 0:decodeURIComponent(o)},t.set=function(e,o,n){return n=t._getExtendedOptions(n),n.expires=t._getExpiresDate(void 0===o?-1:n.expires),t._document.cookie=t._generateCookieString(e,o,n),t},t.expire=function(e,o){return t.set(e,void 0,o)},t._getExtendedOptions=function(e){return{path:e&&e.path||t.defaults.path,domain:e&&e.domain||t.defaults.domain,expires:e&&e.expires||t.defaults.expires,secure:e&&void 0!==e.secure?e.secure:t.defaults.secure}},t._isValidDate=function(e){return"[object Date]"===Object.prototype.toString.call(e)&&!isNaN(e.getTime())},t._getExpiresDate=function(e,o){if(o=o||new Date,"number"==typeof e?e=e===1/0?t._maxExpireDate:new Date(o.getTime()+1e3*e):"string"==typeof e&&(e=new Date(e)),e&&!t._isValidDate(e))throw new Error("`expires` parameter cannot be converted to a valid Date instance");return e},t._generateCookieString=function(e,t,o){var n=(e=(e=e.replace(/[^#$&+\^`|]/g,encodeURIComponent)).replace(/\(/g,"%28").replace(/\)/g,"%29"))+"="+(t=(t+"").replace(/[^!#$&-+\--:<-\[\]-~]/g,encodeURIComponent));return n+=(o=o||{}).path?";path="+o.path:"",n+=o.domain?";domain="+o.domain:"",n+=o.expires?";expires="+o.expires.toUTCString():"",n+=o.secure?";secure":""},t._getCacheFromString=function(e){for(var o={},n=e?e.split("; "):[],r=0;r<n.length;r++){var i=t._getKeyValuePairFromCookieString(n[r]);void 0===o[t._cacheKeyPrefix+i.key]&&(o[t._cacheKeyPrefix+i.key]=i.value)}return o},t._getKeyValuePairFromCookieString=function(e){var t=e.indexOf("=");t=t<0?e.length:t;var o,n=e.substr(0,t);try{o=decodeURIComponent(n)}catch(e){console&&"function"==typeof console.error&&console.error('Could not decode cookie with key "'+n+'"',e)}return{key:o,value:e.substr(t+1)}},t._renewCache=function(){t._cache=t._getCacheFromString(t._document.cookie),t._cachedDocumentCookie=t._document.cookie},t._areEnabled=function(){var e="1"===t.set("cookies.js",1).get("cookies.js");return t.expire("cookies.js"),e},t.enabled=t._areEnabled(),t},n=e&&"object"==typeof e.document?o(e):o;"function"==typeof define&&define.amd?define(function(){return n}):"object"==typeof exports?("object"==typeof module&&"object"==typeof module.exports&&(exports=module.exports=n),exports.Cookies=n):e.Cookies=n}("undefined"==typeof window?this:window);


// --------------------------------------- end cookies hack