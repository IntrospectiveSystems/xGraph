__Nexus = (function() {
	console.log(' ** Nxs executing');
	var SockIO;
	var Pid24;
	var PidNxs;
	var PidTop;
	var PidStart;
	var Config;
	var EntCache = {};
	var ModCache = {};
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
                if (par.$Browser) {
                    SymTab[par.$Browser] = pid;
                }
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
		var path;
		var obj;
		var package;
		// Merge npm package dependencies
		var keys = Object.keys(Config.Modules);
		var nkeys = keys.length;
		var ikey = 0;
		nextmodule();

		function nextmodule() {
			console.log('..nextmodule')
			if(ikey >= nkeys) {
				fun();
				return;
			}
			var key = keys[ikey];
			var mod = Config.Modules[key];
			var com = {};
			com.Cmd = 'GetModule';
			com.Module = mod.Module;
			console.log(com);
			send(com, Config.pidServer, addmodule);
			ikey++;
		}

		function addmodule(err, com) {
			console.log('..addmodule');
			nextmodule();
		}
	}

})();
