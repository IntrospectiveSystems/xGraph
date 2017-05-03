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
		if('Host' in Par) {
			if('Port' in Par) {
				client();
			} else {
				var err = 'No port for client proxy';
			}
		} else {
			if('Port' in Par) {
				if('Link' in Par)
					server();
				else
					err = 'No Link in server proxy';
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
			net.createServer(function(sock) {
				console.log('#### Portal connection from',
					sock.remoteAddress + ':' + sock.remotePort);
				var Buf = '';
				var State = 0;
				// TBD: Need to allow for max sockets or timeout

				sock.on('error', (err) => {
					console.log(' ** ERR:' + err);
				});

				// Process data received from socket. The messages are
				// bracketed by STX(02) and ETX(03). Note that messages
				// may not be complete spanning multiple sends, or the
				// data content may contain multiple messages
				// TBD: Implement more flexible buffering policy
				sock.on('data', function (data) {
					var nd = data.length;
					if(data[0] != STX || data[nd-1] != ETX) {
						console.log(' ** ERR: Proxy/server - improper framing');
						return;
					}
					var str = data.toString('utf8', 1, nd-1);
					console.log('MSG:[' + str + ']');
					var com = JSON.parse(str);
					//	console.log(JSON.stringify(com, null, 2));
					if (!com) {
						console.log(' ** ERR:Invalid portal message rcvd');
						return;
					}
					that.send(com, Par.Link, reply);

					function reply(err, com) {
						console.log('..Proxy/reply');
						com.Passport.Reply = true;
						str = JSON.stringify(com);
						let msg = Vlt.STX + str + Vlt.ETX;
						var res = sock.write(msg, 'utf8', kapau);

						function kapau() {
							console.log('.. kapau');
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
				console.log('data[0]', data[0], Vlt.STX);
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
				console.log('i1, i2, nd', i1, i2, nd, Vlt.State);
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
						console.log('Returning', com.Cmd);
						if(Vlt.Fun)
							Vlt.Fun(null, com);
						break;
				}
			});
		}
	}

	function Start(com, fun) {
		console.log('--Proxy/Start');
		if(fun)
			fun(null, com);
	}

	function Proxy(com, fun) {
		console.log('--Proxy/Proxy', com.Cmd);
		var STX = 2;
		var ETX = 3;
		var Vlt = this.Vlt;
		var sock = Vlt.Sock;
		if(!sock) {
			console.log(' ** ERR:Proxy not connected to server');
			if(fun)
				fun('Proxy not connected');
			return;
		}
		var str = JSON.stringify(com);
		var msg = Vlt.STX + JSON.stringify(com) + Vlt.ETX;
		sock.write(msg);
		if(fun)
			Vlt.Fun = fun;
		else
			Vlt.Fun = null;
	}

})();
