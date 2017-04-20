__Nexus = (function() {
	console.log(' ** Nxs executing');
	var SockIO;
	var Root;
	var Pid24;
	var PidNxs;
	var PidTop;
	var PidStart;
	var Config;
	var CurrentModule;
	var EntCache = {};
	var ModCache = {};
	var ZipCache = {};
	var SymTab = {};
	var Nxs = {
		genPid: genPid,
		genEntity: genEntity,
		delEntity: delEntity
	}
	var MsgFifo = [];
	var MsgPool = {};
	var that = this;
	__Config = {};
	__Config.TrackIO = false;

	return {
		start: start,
		genPid: genPid,
		send: send
	};

	function start(config) {
		console.log(' ** Nxs config', config);
		Config = JSON.parse(config);
		console.log('Config...\n');
		console.log(JSON.stringify(Config, null, 2));
		SockIO = io();
		var that = this;
		if(typeof __Start !== 'undefined') {
			__Start();
		}

		// Suppress browser context menus
		$(document).bind("contextmenu", function (e) {
			return false;
		});

		SockIO.on('connect', function () {
			console.log('SockIO connection established');
			SendIO = SockIO.send;
		});

		SockIO.on('message', function (data) {
			var cmd = JSON.parse(data);
			console.log(' << Msg:' + cmd.Cmd);
			switch (cmd.Cmd) {
			case 'SetPid':
				Pid24 = cmd.Pid24;
				if ('Config' in cmd)
					__Config = cmd.Config;
				PidNxs = Pid24 + '00000000';
			//	console.log('Pid24 <=', Pid24);
				Genesis(pau);
				break;
			default:
				//	console.log('cmd', cmd);
				//	console.log('Passport', JSON.stringify(cmd.Passport, null, 2));
				if('Passport' in cmd && cmd.Passport.Reply) {
					var pid = cmd.Passport.Pid;
					var ixmsg = MsgFifo.indexOf(pid);
					if(ixmsg >= 0) {
						var func = MsgPool[pid];
						MsgFifo.splice(ixmsg, 1);
						delete MsgPool[pid];
						if(func)
							func(null, cmd);
					}
					return;
				}
				// Not reply, try to dispatch on browser
				var pid = cmd.Passport.To;
				var pid24 = pid.substr(0, 24);
				if (pid24 == Pid24) {
					if (pid in EntCache) {
						var ent = EntCache[pid];
						ent.dispatch(cmd, reply);
					} else {
						console.log(' ** ERR:Local', pid, 'not in Cache');
					}
					return;
				}
			}

			function reply(err, cmd) {
				if (cmd == null)
					return;
				console.log('++Sending reply to server');
				if ('Passport' in cmd) {
					cmd.Passport.Reply = true;
					console.log('++Setting Reply to true');
					var str = JSON.stringify(cmd);
					SockIO.send(str);
				}
			}

			function pau(err) {
				console.log('..pau');
				console.log(JSON.stringify(Root, null, 2));
			}

		});
	}

	//-----------------------------------------------------engage
	// This function is triggered on receipt of the 'SetPid'
	// command which establishes the identity of the browser
	// bag. It generate an 'Engage' message and on reply
	// creates the seed entity and fires off a start command
	// to it.
	function engage() {
		var com = {};
		com.Cmd = 'Engage';
		com.Passport = {};
		com.Passport.From = Pid24 + '00000000';
		send(com, PidTop, reply);

		function reply(err, com) {
			if ('Par' in com) {
				var par = com.Par;
				genEntity(com.Par, start);
			}
		}

		function start(err, ent) {
			if (err) {
				console.log(' ** ERR:engage failed to create starting entity');
				return;
			}
			var q = {};
			q.Cmd = 'Start';
			PidStart = ent.getPid();
			console.log('..starting, pid=' + PidStart);
			send(q, PidStart);
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

	//--------------------------------------------------------Entity
	// Entity base class
	function Entity(nxs, mod, par) {
		var Nxs = nxs;
		var Par = par;
		var Mod = mod;
		var Vlt = {};

		return {
			Par: Par,
			Mod: Mod,
			Vlt: Vlt,
			Nxs: Nxs,
			dispatch: dispatch,
			send: send,
			getPid: getPid
		}

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

		//-------------------------------------------------send
		function send(com, pid, fun) {
			com.Passport = {};
			com.Passport.From = Par.Pid;
			com.Passport.To = pid;
			__Nexus.send(com, pid, fun);
		}

		//-------------------------------------------------reply
		// Reply to a message previously received
		function reply(com, fun) {

		}
	}

	//-----------------------------------------------------genNode
	// Generate node from parameter object
	function genEntity(par, fun) {
		console.log('--genEntity', par.Entity);
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

	//-----------------------------------------------------Genesis
	// Create cache if it does nto exist and populate
	// This is called only once when a new systems is
	// first instantiated
	function Genesis(fun) {
		console.log('--Nxs/Genesis');
		Root = {};
//		Root.SymTab = {};
		Root.Global = {};
//		Root.System = {};
		Root.Setup = {};
		Root.Start = {};
		if('Apex' in Config)
			Root.Apex = Config.Apex;
		else
			Root.Apex = {};
		var path;
		var obj;
		var package;
		// Merge npm package dependencies
		var keys = Object.keys(Config.Modules);
		for(var i=0; i<keys.length; i++) {
			var key = keys[i];
			Root.Apex[key] = genPid();
		}
		var nkeys = keys.length;
		var ikey = 0;
		var mod;
		var modkey;
		nextmodule();

		function nextmodule() {
			console.log('..nextmodule')
			if(ikey >= nkeys) {
				Setup();
				return;
			}
			modkey = keys[ikey];
			mod = Config.Modules[modkey];
			var com = {};
			com.Cmd = 'GetModule';
			com.Module = mod.Module;
			console.log(com);
			send(com, Config.pidServer, addmodule);
			ikey++;
		}

		function addmodule(err, com) {
			console.log('..addmodule');
			console.log(com);
			var ents = {};
			var lbls = {};
			var module = com.Module;
			var zipmod = new JSZip();
			zipmod.loadAsync(com.Zip, {base64: true}).then(function(zip){
				zip.file('schema.json').async('string').then(function(str){
					console.log('Finally', str);
					compile(str);
				});
			});

			function compile(str) {
				var schema = JSON.parse(str);
				console.log('schema...\n' + JSON.stringify(schema, null, 2));
				ZipCache[module] = zipmod;
				for (let lbl in schema) {
					var ent = schema[lbl];
					if('Par' in mod) {
						for(key in mod.Par) {
							ent[key] = mod.Par[key];
						}
					}
					CurrentModule = modkey;
					ent.Module = module;
					if(lbl == 'Apex')
						ent.Pid = Root.Apex[modkey];
					else
						ent.Pid = genPid();
					lbls[lbl] = ent.Pid;
					ents[lbl] = ent;
				}
				var keys = Object.keys(ents);
				var nkey = keys.length;
				var ikey = 0;
				nextent();

				function nextent() {
					if(ikey >= nkey) {
						nextmodule();
						return;
					}
					var key = keys[ikey];
					var ent = ents[key];
					if('Par' in mod) {
						for(key in mod.Par) {
							ent[key] = mod.Par[key];
						}
					}
					console.log('ent', ent);
					ikey++;
					for (let key in ent) {
						val = ent[key];
						if (key == '$Setup') {
							Root.Setup[ent.Pid.substr(24)] = ent[key];
							continue;
						}
						if (key == '$Start') {
							Root.Start[ent.Pid.substr(24)] = ent[key];
							continue;
						}
						if(typeof val == 'string') {
							if(val.charAt(0) == '$')
								ent[key] = Root.Apex[val.substr(1)];
						}
						if(Array.isArray(val)) {
							for (var i = 0; i < val.length; i++) {
								if (typeof val[i] == 'string')
									val[i] = symbol(val[i]);
							}
							continue;
						}
						if(Array.isArray(val)) {
							for(var i=0; i<val.length; i++) {
								var tmp = val[i];
								if(typeof tmp == 'string') {
									if(tmp.charAt(0) == '#')
										val[i] = Root.Apex[tmp.substr(1)];
								}
							}
						} else
						if(typeof val == 'object') {
							for(let sym in val) {
								var tmp = val[sym];
								if(typeof tmp == 'string' && tmp.charAt(0) == '#')
									val[sym] = Root.Apex[tmp.substr(1)];
							}
							console.log('After', val);
						}
					}
					console.log('ent', ent);
					var modkey = ent.Module + '/' + ent.Entity;
					ZipCache[mod] = zipmod;
					console.log('modkey', modkey);
					zipmod.file(ent.Entity).async('string').then(function(str){
						var mod = eval(str);
						ModCache[modkey] = mod;
						EntCache[ent.Pid] = new Entity(Nxs, mod, ent);
						console.log('Root', Root);
						nextent();
					});
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
		//---------------------------------------------------------start
		function Setup() {
			console.log('--Nxs/Setup');
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

		//---------------------------------------------------------Start
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

		//-----------------------------------------------------Run
		function Run() {
			console.log('--Nxs/Run');
		}
	}

})();
