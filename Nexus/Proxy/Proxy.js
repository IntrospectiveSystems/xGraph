(function Proxy() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		"*":Proxy
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------Setup
	function Setup(com, fun) {
		console.log('--Proxy/Setup', this.Par.Pid);
		var Par = this.Par;
		console.log('Par', JSON.stringify(Par, null, 2));
		if(Par.Name == 'Plexus') {
			switch(Par.Role) {
			case 'Server':
				genServer.call(this, fun);
				return;
			case 'Client':
				genClient.call(this, fun);
				return;
			}
		}
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------Start
	function Start(com, fun) {
		console.log('--Proxy/Start', this.Par.Pid);
		var Par = this.Par;
		console.log('Par', JSON.stringify(Par, null, 2));
		if(Par.Name != 'Plexus') {
			switch(Par.Role) {
			case 'Server':
				genServer.call(this, fun);
				return;
			case 'Client':
				genClient.call(this, fun);
				return;
			}
		}
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------genServer
	function genServer(fun) {
		console.log('--genServer');
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		console.log('Par', JSON.stringify(Par, null, 2));
		var err;
		if(!('Name' in Par))
			err = 'No Name in Par';
		if(!('Plexus' in Par))
			err = 'No Plexus in Par';
		if(err) {
			if(fun)
				fun(err);
			return;
		}
		var q = {};
		q.Cmd = 'Publish';
		q.Name = Par.Name;
		q.Host = '127.0.0.1';
		that.send(q, Par.Plexus, connect);

		function connect(err, r) {
			console.log('..connect', r);
			var net = require('net');
			var err;
			var tmp = new Buffer(2);
			var STX = 2;
			var ETX = 3;
			tmp[0] = 2;
			tmp[1] = 3;
			var str = tmp.toString();
			Vlt.STX = str.charAt(0);
			Vlt.ETX = str.charAt(1);
			Vlt.Buf = '';
			Vlt.State = 0;
			Vlt.Subscribed = false;
			var Msg;
			var port = r.Port;
			Vlt.Server = true;
			Vlt.Socks = [];
			net.createServer(function(sock) {
				console.log('#### Portal connection from',
					sock.remoteAddress + ':' + sock.remotePort);
				Vlt.Socks.push(sock);
				sock._userData = {};
				sock._userData.Buf = '';
				sock._userData.State = 0;

				sock.on('error', (err) => {
					console.log(' ** ERR2:' + err);
					console.log('    Proxy:' + Par.Name);
				});

				// Process data received from socket. The messages are
				// bracketed by STX(02) and ETX(03). Note that messages
				// may not be complete spanning multiple sends, or the
				// data content may contain multiple messages
				// TBD: Implement more flexible buffering policy
				sock.on('data', function (data) {
					var Buf = sock._userData.Buf;
					var State = sock._userData.State;
					var Fifo = [];
					var isQuery;
					var nd = data.length;
					for(let i=0; i<nd; i++) {
						switch(State) {
							case 0:
								if(data[i] == STX) {
									Buf = '';
									State = 1;
									i1 = i+1;
								}
								break;
							case 1:
								i2 = i;
								let str = data.toString()
								if(data[i] == ETX) {
									Buf += data.toString('utf8', i1, i2);
									var obj = JSON.parse(Buf);
									Fifo.push(obj);
									State = 0;
								}
								break;
						}
					}
					if(State == 1)
						Buf += data.toString('utf8', i1, i2+1);
					sock._userData.State = State;
					loop();

					function loop() {
						if(Fifo.length < 1)
							return;
						var q = Fifo.shift();
						if(q.Passport.Disp && q.Passport.Disp == 'Query')
							isQuery = true;
						else
							isQuery = false;
						that.send(q, Par.Link, reply);

						function reply(err, r) {
							if(isQuery) {
								r.Passport.Reply = true;
								str = JSON.stringify(r);
								let msg = Vlt.STX + str + Vlt.ETX;
								var res = sock.write(msg, 'utf8', loop);
							}
						}
					}
				});
			}).listen(port);
			console.log('Portal listening on port', port);
			if(fun)
				fun();
		}
	}

	//-----------------------------------------------------genClient
	function genClient(fun) {
		console.log('--genClient');
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		console.log('Par', JSON.stringify(Par, null, 2));
		var err;
		if(!('Name' in Par))
			err = 'No Name in Par';
		if(!('Plexus' in Par))
			err = 'No Plexus in Par';
		if(err) {
			if(fun)
				fun(err);
			return;
		}
		var q = {};
		q.Cmd = 'Subscribe';
		q.Name = Par.Name;
		q.Host = '127.0.0.1';
		if(Par.Name == 'Plexus') {
			q.Port = 27000;
			connect(null, q);
		} else {
			that.send(q, Par.Plexus, connect);
		}

		function connect(err, r) {
			if(err) {
				console.log(' ** ERR:' + err);
				console.log('    Proxy:' + Par.Name);
				if(fun)
					fun(err);
				return;
			}
			var net = require('net');
			var err;
			var tmp = new Buffer(2);
			var STX = 2;
			var ETX = 3;
			tmp[0] = 2;
			tmp[1] = 3;
			var str = tmp.toString();
			Vlt.STX = str.charAt(0);
			Vlt.ETX = str.charAt(1);
			Vlt.Buf = '';
			Vlt.State = 0;
			Vlt.Subscribed = false;
			var Msg;
			var port = r.Port;
			var host = r.Host;
			var sock = new net.Socket();
			Vlt.Server = false;
			sock.connect(port, host, function () {
				console.log('..Connection established');
			});

			sock.on('connect', function () {
				console.log('Proxy - Connected on host:' + host + ', port:' + port);
				Vlt.Sock = sock;
				if(fun)
					fun(null);
			});

			sock.on('error', (err) => {
				console.log(' ** ERR3:' + err);
				console.log('    Proxy:' + Par.Name);
				if(fun)
					fun('Connection declinded');
			});

			sock.on('data', function (data) {
				var nd = data.length;
				var i1= 0;
				var i2;
				var STX = 2;
				var ETX = 3;
				if(Vlt.State == 0)
					Vlt.Buf = '';
				for(let i=0; i<nd; i++) {
					switch(Vlt.State) {
						case 0:
							if(data[i] == STX) {
								Vlt.Buf = '';
								Vlt.State = 1;
								i1 = i+1;
							}
							break;
						case 1:
							i2 = i;
							if(data[i] == ETX)
								Vlt.State = 2;
							break;
					}
				}
				switch(Vlt.State) {
					case 0:
						break;
					case 1:
						Vlt.Buf += data.toString('utf8', i1, i2+1);
						break;
					default:
						Vlt.Buf += data.toString('utf8', i1, i2);
						Vlt.State = 0;
						var com = JSON.parse(Vlt.Buf);
						if('Reply' in com.Passport) {
							if(Vlt.Fun)
								Vlt.Fun(null, com);
						} else {
							that.send(com, Par.Link);
						}
						break;
				}
			});
		}
	}

	//-----------------------------------------------------Proxy
	function Proxy(com, fun) {
		console.log('--Proxy/Proxy', com.Cmd);
		var Par = this.Par;
		var Vlt = this.Vlt;
		if('Role' in Par) {
			switch(Par.Role) {
				case 'Plexus':
				case 'Client':
					client();
					break;
				case 'Server':
					server();
					break;
				default:
					break;
			}
		} else {
			var err = 'Proxy has no role';
			console.log(' ** ERR:' + err);
			console.log('    Proxy:' + Par.Name);
			if(fun)
				fun(err);
		}


		function server() {
			var msg = Vlt.STX + JSON.stringify(com) + Vlt.ETX;
			for(var i=0; i<Vlt.Socks.length; i++) {
				var sock = Vlt.Socks[i];
				sock.write(msg);
			}
			if(fun)
				fun(null, com);
		}

		function client() {
			var STX = 2;
			var ETX = 3;
			var sock = Vlt.Sock;
			if(!sock) {
				console.log(' ** ERR:Proxy not connected to server');
				console.log('    Proxy:' + Par.Name);
				if(fun)
					fun('Proxy not connected');
				return;
			}
			if(fun) {
				Vlt.Fun = fun;
				com.Passport.Disp = 'Query';
			} else {
				Vlt.Fun = null;
			}
			var str = JSON.stringify(com);
			var msg = Vlt.STX + JSON.stringify(com) + Vlt.ETX;
			sock.write(msg);
		}
	}
})();
