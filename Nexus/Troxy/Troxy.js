(function Troxy() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		"*": Proxy
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		if (!(this.Par.Setup) && ("Start" in this.Par)){
			fun();
			return;
		}

		console.log('--Troxy/Setup', this.Par.Pid);
		if ("Name" in this.Par)
			console.log("Setup troxy --",this.Par.Name);
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

		switch (Par.Role){
			case "client": {
				if('Host' in Par) {
					if('Port' in Par) {
						client();
					} else {
						var err = 'No port for client proxy';
					}
				}
				break;
			}
			case "server":{
				if('Port' in Par) {
					if('Link' in Par)
						server();
					else
						err = 'No Link in server proxy';
				} else {
					var err = 'No port for server proxy';
				}
			}	break;


			default:{
				console.log("Not sure what your role is...");
			}
		}

		if(err)
			console.log(' ** ERR:' + err);
		if (!(Par.Role)) {
			console.log("No Role...");
			fun();
		}
		if (!("started" in this.Vlt))
			this.Vlt.started = false;
		setInterval(() => {
			if (this.Vlt.started) return;
			if (!this.Par.Optional) return;
			console.log('--Nexus/Troxy Connection timeout, moving on...');
			this.Vlt.started = true;
			fun(null, com);
		}, 3000);

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
			fun();
		}

		function client() {
			var sock = new net.Socket();
			var host = Par.Host;
			var port = Par.Port;
			sock.connect(port, host, function () {
				console.log('..Connection established');
			});

			sock.on('connect', function () {
				this.Vlt.started = true;
				console.log('Proxy - Connected on host:' + host + ', port:' + port);
				Vlt.Sock = sock;
				fun();
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
						if(Vlt.Fun[com.Passport.Pid])
							Vlt.Fun[com.Passport.Pid](null, com);
						break;
				}
			});
		}
	}




	function Start(com, fun) {
		if (!(this.Par.Start) && ("Setup" in this.Par)){
			fun();
			return;
		}
		console.log('--Troxy/Start', this.Par.Pid);

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

		console.log("processing Role", Par.Role);

		switch (Par.Role){
			case "client": {
				if('Host' in Par) {
					if ('Port' in Par) {
						client();
					}
				}
				else {
					var err = 'No known port for client proxy we must check if we can get it from Registry';
					console.log(err);
					if ("Registry" in Par || "Plexus" in Par) {
						let dest = Par.Registry || Par.Plexus;
						let cm = {"Cmd": "GetAddress", "Name": Par.Name};
						console.log("Sending to Registry", cm);
						this.send(cm, dest, done);

						function done(error, cm) {
							if (error)
								console.log("Error:" + error);
							console.log("Registry returned", cm);
							Par.Host = cm.Address.Host;
							Par.Port = cm.Address.Port;
							client();
						}
					}

				}
				break;
			}
			case "server":{
				if ('Port' in Par) {
					if ('Link' in Par) {
						server();
					}
					else {
						console.log('Error Message!');
						err = 'No Link in server proxy';
					}
				} else {
					err = 'No port for server proxy we must check if we can get it from Registry';
					console.log(err);
					if ("Registry" in Par || "Plexus" in Par){
						let dest = Par.Registry||Par.Plexus;
						let cm = {"Cmd":"PostAddress", "Name":Par.Name};
						console.log("Sending to Registry", cm);

						this.send(cm, dest, done);

						function done(error, cm){
							if (error)
								console.log("Error:"+error);
							console.log("Registry returned", cm);
							Par.Host = cm.Address.Host;
							Par.Port = cm.Address.Port;
							if ('Link' in Par)
								server();
						}
					}
				}
				break;

			}

			default:{
				console.log("Not sure what your role is...");
			}
		}


		if (err)
			console.log(' ** ERR:' + err);
		if (!(Par.Role)) {
			console.log("No Role...");
			fun();
		}
		if (!("started" in this.Vlt))
			this.Vlt.started = false;
		setInterval(() => {
			if (this.Vlt.started) return;
			if (!this.Par.Optional) return;
			console.log('--Nexus/Troxy Connection timeout, moving on...');
			this.Vlt.started = true;
			fun(null, com);
		}, 3000);

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
			fun();
		}

		function client() {
			var sock = new net.Socket();
			var host = Par.Host;
			var port = Par.Port;
			sock.connect(port, host, function () {
				console.log('..Connection established');
			});

			sock.on('connect', function () {
				this.Vlt.started = true;
				console.log('Troxy - Connected on host:' + host + ', port:' + port);
				Vlt.Sock = sock;
				fun();
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
						if(Vlt.Fun[com.Passport.Pid])
							Vlt.Fun[com.Passport.Pid](null, com);
						break;
				}
			});
		}
	}

	function Proxy(com, fun) {
		console.log('--Troxy/Proxy', com.Cmd);
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
		var msg = Vlt.STX + str + Vlt.ETX;
		sock.write(msg);
		if (!(Vlt.Fun))
			Vlt.Fun={};

		if(fun)
			Vlt.Fun[com.Passport.Pid] = fun;
		else
			Vlt.Fun[com.Passport.Pid] = null;
	}

})();
