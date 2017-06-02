//# sourceURL=Nxs
__Nexus = (function() {
	console.log(' ** Nxs executing');
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

	return {
		start: start,
		genPid: genPid,
		genModule: genModule,
		send: send,
		getFont: getFont
	};

	function start(sockio, cfg) {
		console.log('--Nxs/start');
		console.log('cfg', JSON.stringify(cfg, null, 2));
		Pid24 = cfg.Pid24;
		PidServer = cfg.PidServer;
		SockIO = sockio;
		SockIO.removeListener('message');
		SockIO.on('message', function (data) {
			var cmd = JSON.parse(data);
			console.log(' << Msg:' + cmd.Cmd);
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
			// Not reply, try to dispatch on browser
			var pid = cmd.Passport.To;
			var pid24 = pid.substr(0, 24);
			if (pid24 == Pid24) {
				if (pid in EntCache) {
					var ent = EntCache[pid];
					if('Disp' in cmd && cmd.Disp == 'Query')
						ent.dispatch(cmd, reply);
					else
						ent.dispatch(cmd);
				} else {
					console.log(' ** ERR:Local', pid, 'not in Cache');
				}
				return;
			}

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
        	if(pid.charAt(0) == '$') {
        		var sym = pid.substr(1);
        		if(sym in Root.Global)
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
            MsgPool[pidmsg] = fun;
            MsgFifo.push(pidmsg);
            if (MsgFifo.length > 100) {
                var kill = MsgFifo.shift();
                delete MsgPool[kill];
            }
        }
        var str = JSON.stringify(com);
        if(__Config.TrackIO)
            console.log(' >> Msg:' + com.Cmd);
        SockIO.send(str);

		function sendLocal() {
            if (pid in EntCache) {
                var ent = EntCache[pid];
                ent.dispatch(com, fun);
            } else {
                console.log(' ** ERR:Local', pid, 'not in Cache');
            }
		}
	}

	//--------------------------------------------------------getFont
	function getFont(font) {
		if(font in Fonts)
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
			getPid: getPid,
			genModule :genModule
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
			console.log(com.Cmd + ' unknown');
			if(fun)
				fun(com.Cmd + ' unknown');
		}

		//-------------------------------------------------getPid
		// Return Pid of entity
		function getPid() {
			return Par.Pid;
		}

		//generate a module in the local system
		function genModule(mod, fun){

			nxs.genModule(mod,fun);
		}

		//-------------------------------------------------send
		function send(com, pid, fun) {
			com.Passport = {};
			if(fun)
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
				var errmsg = com.Name +  'module is not available';
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

    //-----------------------------------------------------delEntity
    // Generate node from parameter object
    function delEntity(pid, fun) {
		if (EntCache[pid]) {
			delete EntCache[pid];
			console.log(pid, ' Deleted');
			if (fun) {
				fun(null)
			}
		} else {
			console.log('Entity not found: ', pid);
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
			console.log('pid', pid);
			console.log('Initializers', Initializers);
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

	//-------------------------------------------------addModule
	function addModule(mod, fun) {
		console.log('..addModule');
		console.log(JSON.stringify(mod, null, 2));
		var ents = {};
		var lbls = {};
		var q = {};
		q.Cmd = 'GetModule';
		q.Module = mod.Module;
		//	console.log(com);
		send(q, PidServer, addmod);

		function addmod(err, r) {
			console.log('..addmod');
			var module = com.Module;
			var zipmod = new JSZip();
			zipmod.loadAsync(r.Zip, {base64: true}).then(function(zip){
				var dir = zipmod.file(/.*./);
				styles();

				function styles() {
					if(zipmod.file('styles.json')) {
						zip.file('styles.json').async('string').then(function(str) {
							var obj = JSON.parse(str);
							var keys = Object.keys(obj);
							async.eachSeries(keys, function(key, func) {
								if(Css.indexOf(key) >= 0) {
									func();
									return;
								}
								Css.push(key);
								var file = obj[key];
								zip.file(file).async('string').then(function(css) {
									var tag = document.createElement('link');
									tag.setAttribute("data-css-url", key);
									tag.setAttribute("type", 'text/css');
									var txt = document.createTextNode(css);
									tag.appendChild(txt);
									document.head.appendChild(tag);

									/*	var tag = document.createElement('script');
									 tag.setAttribute("data-script-url", key);
									 tag.setAttribute("type", 'text/javascript');
									 var txt = document.createTextNode(scr);
									 tag.appendChild(txt);
									 document.head.appendChild(tag); */
									func();
								});
							}, scripts);
						});
					} else {
						scripts();
					}
				}

				function scripts() {
					console.log('..scripts');
					if(zipmod.file('scripts.json')) {
						zip.file('scripts.json').async('string').then(function(str) {
							var obj = JSON.parse(str);
							var keys = Object.keys(obj);
							async.eachSeries(keys, function(key, func) {
								if(Scripts.indexOf(key) >= 0) {
									func();
									return;
								}
								Scripts.push(key);
								var file = obj[key];
								zip.file(file).async('string').then(function(scr) {
									var tag = document.createElement('script');
									tag.setAttribute("data-script-url", key);
									tag.setAttribute("type", 'text/javascript');
									var txt = document.createTextNode(scr);
									tag.appendChild(txt);
									document.head.appendChild(tag);
									func();
								});
							}, fonts);
						});
					} else {
						fonts();
					}
				}

				function fonts() {
					console.log('..fonts');
					if(zipmod.file('fonts.json')) {
						zip.file('fonts.json').async('string').then(function(str) {
							var obj = JSON.parse(str);
							var keys = Object.keys(obj);
							async.eachSeries(keys, function(key, func) {
								if(key in Fonts) {
									func();
									return;
								}
								var file = obj[key];
								zip.file(file).async('string').then(function(str) {
									var json = JSON.parse(str);
									var font = new THREE.Font(json);
									console.log('font', font);
									Fonts[key] = font;
									func();
								});
							}, schema);
						});
					} else {
						schema();
					}
				}

				function schema() {
					console.log('..schema');
					zip.file('schema.json').async('string').then(function(str){
						compile(str);
					});
				}
			});

			function compile(str) {
				console.log('..compile');
				var pidapx;
				var schema = JSON.parse(str);
				ZipCache[module] = zipmod;
				for (let lbl in schema) {
					var ent = schema[lbl];
					if('Par' in mod) {
						for(key in mod.Par) {
							ent[key] = mod.Par[key];
						}
					}
					ent.Module = mod.Module;
					//Note: CurrentModule is only used in initial processing
					//      of browser.json
					if(lbl == 'Apex') {
						if(CurrentModule)
							ent.Pid = Root.Apex[CurrentModule];
						else
							ent.Pid = genPid();
						pidapx = ent.Pid;
						console.log('Apex', ent);
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
					if(ikey >= nkey) {
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
						if(typeof val == 'string')
							ent[key] = symbol(val);
						if(Array.isArray(val)) {
							for (var i = 0; i < val.length; i++) {
								if (typeof val[i] == 'string')
									val[i] = symbol(val[i]);
							}
							continue;
						}
						if(typeof val == 'object') {
							for(let sym in val) {
								var tmp = val[sym];
								if(typeof tmp == 'string')
									val[sym] = symbol(tmp);
							}
						}
					}
					var modkey = ent.Module + '/' + ent.Entity;

					//seems to be duplicate from line 481

					//ZipCache[mod] = zipmod;
					zipmod.file(ent.Entity).async('string').then(function(str){
						var mod = eval(str);
						ModCache[modkey] = mod;
						EntCache[ent.Pid] = new Entity(Nxs, mod, ent);
						nextent();
					});
				}

				function symbol(str) {
					var esc = str.charAt(0);
					if(esc == '#') {
						var lbl = str.substr(1);
						if(!(lbl in lbls)) {
							var err = ' ** Symbol ' + lbl + ' not defined';
							throw err;
						}
						return lbls[lbl];
					}
					if(esc == '$') {
						var sym = str.substr(1);
						if(!(sym in Root.Apex)) {
							var err = ' ** Symbol ' + sym + ' not defined';
							throw err;
						}
						return Root.Apex[sym];
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
		console.log('--Nxs/Genesis');
		Config = cfg;
		Root = {};
		Root.Global = {};
		Root.Setup = {};
		Root.Start = {};
		if('Apex' in cfg)
			Root.Apex = cfg.Apex;
		else
			Root.Apex = {};
		var ikey = 0;
		if('Scripts' in Config) {
			var keys = Object.keys(Config.Scripts);
			nkeys = keys.length;
		} else {
			nkeys = 0;
		}
		console.log('Scripts', nkeys, Config.Scripts);
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
			send(q, Config.pidServer, function(err, r) {
				if(err) {
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
			for(var i=0; i<keys.length; i++) {
				key = keys[i];
				Root.Apex[key] = genPid();
			}
			async.eachSeries(keys, function(key, func) {
				let mod = Config.Modules[key];
				CurrentModule = key;
				addModule(mod, addmod);

				function addmod(err, pid) {
					if(err) {
						console.log(' ** ERR:Cannot add mod <' + r.Module + '>');
					}
					//TBD: Might want to bail on err
					console.log('Apex', key, '<=', pid);
					func();
				}
			}, Setup);

		}

		//-------------------------------------------------Setup
		function Setup(err) {
			console.log('--Nexus/Setup');
			var pids = Object.keys(Root.Setup);
			var npid = pids.length;
			var ipid = 0;
			setup();

			function setup() {
				if(ipid >= npid) {
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
				if(ipid >= npid) {
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
			console.log('--Nxs/Run');
			CurrentModule = null;
		}
	}

})();
