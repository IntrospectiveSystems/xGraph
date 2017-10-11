//# sourceURL='Proxy.js'
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
		var Par = this.Par;
		if((Par.Chan == 'Plexus')||(!("Plexus" in Par))) {
			console.log('--Proxy/Setup ', this.Par.Pid);
			if ("Plexus" in Par)
				console.log("--     Proxy-Chan", (Par.Chan));
			//console.log('Par', JSON.stringify(Par, null, 2));
			switch(Par.Role) {
			case 'Server':
				genServer.call(this, fun);
				return;
			case 'Client':
				genClient.call(this, fun);
				return;
			default: 
				let err= ""+Par.Role+ " is not an acceptible Role"
				if(fun)
					fun(err, com);
				return;
			}
		}
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------Start
	function Start(com, fun) {
		var Par = this.Par;
		if(Par.Chan != 'Plexus'&& "Plexus" in Par) {
			console.log('--Proxy/Start', this.Par.Pid);
			console.log("--     Proxy-Chan", (Par.Chan));
			//console.log('Par', JSON.stringify(Par, null, 2));
			switch(Par.Role) {
			case 'Server':
				genServer.call(this, fun);
				return;
			case 'Client':
				genClient.call(this, fun);
				return;
			default: 
				let err= ""+Par.Role+ " is not an acceptible Role"
				if(fun)
					fun(err, com);
				return;
			}
		}
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------genServer
	function genServer(fun) {
		//console.log('--genServer');
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		//console.log('Par', JSON.stringify(Par, null, 2));
		var err;

		if ("Plexus" in Par){
			if(!('Chan' in Par))
				err = 'No Chan in Par';
			// if(!('Plexus' in Par))
			// 	err = 'No Plexus in Par';
			if(!('Link' in Par))
				err = 'No Link in Par';
			if(err) {
				if(fun)
					fun(err);
				return;
			}
			var q = {};
			q.Cmd = 'Publish';
			if('Name' in Par)
				q.Name = Par.Name;
			else
				q.Name = 'Nemo';
			q.Chan = Par.Chan;
			q.Host = '127.0.0.1';
			this.send(q, Par.Plexus, connect);
		}else{
			if(!('Port' in Par))
				err = 'No Port in Par';
			if(err) {
				if(fun)
					fun(err);
				return;
			}
			var q = {};
			q.Port = Par.Port;
			
			connect(null, q);
		}

		function connect(err, r) {
			if(err) {
				console.log(' ** ERR:' + err);
				if (fun)
					fun(err);
				return;
			}
			console.log('..connect', r);
			var net = that.require('net');
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

				// var msg = Vlt.STX + JSON.stringify({Cmd:"SomethingCool",Passport:{}}) + Vlt.ETX;
				// sock.write(msg);

				sock.on('error', (err) => {
					console.log(' ** ERR2:' + err);
					if ("Chan" in Par)
						console.log('    Proxy:' + Par.Chan);
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
								let str = data.toString();
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
		//console.log('--genClient');
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		//console.log('Par', JSON.stringify(Par, null, 2));
		var err;
		if ("Plexus" in Par){
			if(!('Chan' in Par))
				err = 'No Chan in Par';
			if(err) {
				console.log("ERROR in PROXY genClient"+err);
				if(fun)
					fun(err);
				return;
			}
			var q = {};
			q.Cmd = 'Subscribe';
			if('Name' in Par)
				q.Name = Par.Name;
			else
				q.Name = 'Nemo';
			q.Chan = Par.Chan;
			q.Host = '127.0.0.1';
			if(Par.Chan == 'Plexus') {
				q.Port = 27000;
				connect(null, q);
			} else {
				this.send(q, Par.Plexus, connect);
			}
		}else{
			if(!('Port' in Par))
				err = 'No Port in Par';
			if(!('Host' in Par))
				err = 'No Host in Par';
			if(err) {
				console.log("ERROR in PROXY genClient"+err);
				if(fun)
					fun(err);
				return;
			}
			var q = {};
			q.Host = Par.Host;
			q.Port = Par.Port;

			connect(null, q);
		}

		function connect(err, r) {
			if(err) {
				console.log(' ** ERR:' + err);
				console.log('    Proxy:' + Par.Chan);
				if(fun)
					fun(err);
				return;
			}
			var net = that.require('net');
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
			connectLoop();
			function connectLoop(){
				sock.removeAllListeners();
				sock.connect(port, host, function () {console.log("trying to connect")});

				sock.on('connect', function () {
					if ("Chan" in Par){
						console.log('Proxy - Connected to '+Par.Chan+ ' on host:' + host + ', port:' + port);
					}else{
						console.log('Proxy - Connected to server on host:' + host + ', port:' + port);
					}
					Vlt.Sock = sock;
					if (!("Replied" in Vlt)||Vlt.Replied ==false){
						Vlt.Replied = true;
						if(fun)
							fun(null);
					}
				});

				sock.on('error', (err) => {
					console.log(' ** ERR3:' + err);
					if ("Chan" in Par)
						console.log('    Name:' + Par.Name, 'Chan:', Par.Chan, 'Hose:' + host, 'Port:' + port);
					if (Par.Poll){
						if (!("Timer" in Vlt) && "Timeout" in Par){
							//console.log("\n\n setting timer for timeout \n\n");
							Vlt.Timer = setTimeout(()=>{
								that.log("Error: Proxy "+Par.Pid+ " connection timeout. Last Attempt.");
								Par.Poll = false;
							},Par.Timeout);
						}
						that.log("Proxy "+Par.Pid+ " is Polling");
						if ("Sock" in Vlt)
							delete Vlt["Sock"];
						setTimeout(connectLoop,3000);
						//Vlt.Polling = true;
						if (!("Replied" in Vlt)||Vlt.Replied ==false){
							Vlt.Replied = true;
							if(fun)
								fun(null);
						}
					}else{
						//Return a hard fail. Should be only called once.
						if (!("Replied" in Vlt)||Vlt.Replied ==false){
							Vlt.Replied = true;
							if(fun)
								fun("Connection Declined");
						}
					}
				});

				sock.on('disconnect', (err) => {
					console.log(' ** Socket disconnected:' + err);
					
					if (Par.Poll){
						//that.log("Proxy "+Par.Pid+ " is Polling");
						if ("Sock" in Vlt)
							delete Vlt[Sock];
						setTimeout(connectLoop,3000);
						
					}else{


						//this code needs to be worked on... 
						//not sure what happens on disconnected


						//Return a hard fail. Should be only called once.
						if (!("Replied" in Vlt)||Vlt.Replied ==false){
							Vlt.Replied = true;
							if(fun)
								fun("Connection Declined");
						}
					}
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
								if(Vlt.Fun[com.Passport.Pid])
									Vlt.Fun[com.Passport.Pid](null, com);
							} else {
								//console.log('**Proxy/client', Par.Link, JSON.stringify(com, null, 2));


								//do we really want links in clients?
								that.send(com, Par.Link);
							}
							break;
					}
				});
			}
		}
	}



	//-----------------------------------------------------Proxy
	function Proxy(com, fun) {
		let that = this;
		//console.log('--Proxy/Proxy', com.Cmd);
		var Par = this.Par;
		//console.log('  Name:' + Par.Name, 'Chan:' + Par.Chan);
		var Vlt = this.Vlt;
		if('Role' in Par) {
			switch(Par.Role) {
				case 'Client':
					client();
					break;
				case 'Server':
					server();
					break;
				default:
					console.log('Par', JSON.stringify(Par, null, 2));
					var err = 'Proxy role is unknown';
					console.log(' ** ERR:' + err);
					if ("Chan" in Par)
						console.log('    Proxy:' + Par.Chan);
					if(fun)
						fun(err);
					return;
			}
		} else {
			console.log('Par', JSON.stringify(Par, null, 2));
			var err = 'Proxy has no role';
			console.log(' ** ERR:' + err);
			if ("Chan" in Par)
				console.log('    Proxy:' + Par.Chan);
			if(fun)
				fun(err);
		}


		function server() {
			var msg = Vlt.STX + JSON.stringify(com) + Vlt.ETX;
			for(var i=0; i<Vlt.Socks.length; i++) {
				var sock = Vlt.Socks[i];
				sock.write(msg);
			}

			if (!(Vlt.Fun))
				Vlt.Fun={};

			if(fun) {
				Vlt.Fun[com.Passport.Pid] = fun;
				com.Passport.Disp = 'Query';
			}
			else {
				Vlt.Fun[com.Passport.Pid] = null;
			}

		}

		function client() {
			var STX = 2;
			var ETX = 3;
			var sock = Vlt.Sock;2
			if(!sock) {
				that.log('No Socket');
				//we are purposely withholding the callback we should call it back once the socket is formed but we need an event listener for this
				// if(fun)
				// 	fun('Proxy not connected');
				return;
			}
			if (!(Vlt.Fun))
				Vlt.Fun={};

			if(fun) {
				Vlt.Fun[com.Passport.Pid] = fun;
				com.Passport.Disp = 'Query';
			}
			else {
				Vlt.Fun[com.Passport.Pid] = null;
			}
			var str = JSON.stringify(com);
			var msg = Vlt.STX + JSON.stringify(com) + Vlt.ETX;
			sock.write(msg);
		}
	}
})();
