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
					send(str);

					function send(str) {
						//	console.log('..Portal/send');
						var com = JSON.parse(str);
						//	console.log(JSON.stringify(com, null, 2));
						if (!com) {
							console.log(' ** ERR:Invalid portal message rcvd');
							return;
						}
						if ('Passport' in com) {
							that.Nxs.send(com, reply);
						} else {
							console.log(' ** ERR:Portal message no passport');
							return;
						}

						function reply() {
							//	console.log('..Portal/reply');
							com.Passport.Reply = true;
							str = JSON.stringify(com);
							Msg = STX + str + ETX;
							var res = sock.write(Msg, 'utf8', kapau);

							function kapau() {
							}
						}
					}
				});
			}).listen(Par.Port);
			console.log('Portal listening on port', Par.Port);
		}

		function client() {

		}
	}

	function Start(com, fun) {
		console.log('--Proxy/Start');
		if(fun)
			fun(null, com);
	}

	function Proxy(com, fun) {
		console.log('--Proxy/Proxy', com.Cmd);
		if(fun)
			fun(null, com);
	}

})();
