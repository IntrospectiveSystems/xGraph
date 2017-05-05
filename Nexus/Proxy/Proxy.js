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
		console.log('--Proxy/Setup');
		var that = this;
		var net = require('net');
		var err;
		var Par = this.Par;
		var Vlt = this.Vlt;
		var tmp = new Buffer(2);
		tmp[0] = 2;
		tmp[1] = 3;
		var str = tmp.toString();
		Vlt.STX = str.charAt(0);
		Vlt.ETX = str.charAt(1);
		Vlt.Buf = '';
		Vlt.State = 0;
		Vlt.Subscribed = false;
		if('Host' in Par) {
			if('Port' in Par) {
				client();
			} else {
				var err = 'No port for client proxy';
			}
		} else {
			if('Port' in Par) {
				if('Child' in Par)
					server();
				else
					err = 'No Child in server proxy';
			} else {
				var err = 'No port for server proxy';
			}
		}
		if(err)
			console.log(' ** ERR:' + err);
		fun(err);

		function server() {
			var STX = 2;
			var ETX = 3;
			var Msg;
			Vlt.Server = true;
			Vlt.Socks = [];
			net.createServer(function(sock) {
				console.log('#### Portal connection from',
					sock.remoteAddress + ':' + sock.remotePort);
				var Buf = '';
				var State = 0;
				Vlt.Socks.push(sock);

				sock.on('error', (err) => {
					console.log(' ** ERR:' + err);
				});

				// Process data received from socket. The messages are
				// bracketed by STX(02) and ETX(03). Note that messages
				// may not be complete spanning multiple sends, or the
				// data content may contain multiple messages
				// TBD: Implement more flexible buffering policy
				sock.on('data', function (data) {
					TBD: Need to allow for concatenated messages here
					var nd = data.length;
					if(data[0] != STX || data[nd-1] != ETX) {
						console.log(' ** ERR: Proxy/server - improper framing');
						return;
					}
					var str = data.toString('utf8', 1, nd-1);
					var com = JSON.parse(str);
					if (!com) {
						console.log(' ** ERR:Invalid portal message rcvd');
						return;
					}
					if(com.Passport.Disp && com.Passport.Disp == 'Query')
						sock.isQuery = true;
					else
						sock.isQuery = false;
					that.send(com, Par.Child, reply);

					function reply(err, com) {
						console.log('..Proxy/reply');
						if(sock.isQuery) {
							com.Passport.Reply = true;
							str = JSON.stringify(com);
							let msg = Vlt.STX + str + Vlt.ETX;
							var res = sock.write(msg, 'utf8', kapau);
						}

						function kapau() {
						}
					}
				});
			}).listen(Par.Port);
			console.log('Portal listening on port', Par.Port);
		}

		function client() {
			var sock = new net.Socket();
			var host = Par.Host;
			var port = Par.Port;
			Vlt.Server = false;
			sock.connect(port, host, function () {
				console.log('..Connection established');
			});

			sock.on('connect', function () {
				console.log('Proxy - Connected on host:' + host + ', port:' + port);
				Vlt.Sock = sock;
			});

			sock.on('error', (err) => {
				console.log(' ** ERR:' + err);
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
						that.send(com, Par.Parent);
					}
					break;
				}
			});
		}
	}

	//.....................................................Start
	function Start(com, fun) {
		console.log('--Proxy/Start');
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------Proxy
	function Proxy(com, fun) {
		console.log('--Proxy/Proxy', com.Cmd);
		var Vlt = this.Vlt;
		if(Vlt.Server)
			server();
		else
			client();

		function server() {
			if(!Vlt.Subscribed) {
				if(fun)
					fun();
				return;
			}

		}

		function client() {
			var STX = 2;
			var ETX = 3;
			var sock = Vlt.Sock;
			if(!sock) {
				console.log(' ** ERR:Proxy not connected to server');
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
