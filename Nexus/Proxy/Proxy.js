(function Proxy() {


	var dispatch = {
		Setup: Setup,
		Start: Start,
		"*":Proxy
	};

	return {
		dispatch: dispatch
	};


	/**
	 * Determines which role Proxy is operating as (Client or Server). Role defined in Par.Role
	 * Starts Server or connects to defined external server as set in Par.
	 * @param {Object} com
	 * @param {function} fun Must be returned
	 */
	function Setup(com, fun) {
		var Par = this.Par;
		if((Par.Chan == 'Plexus')||(!("Plexus" in Par))) {
			log.i('--Proxy/Setup ', this.Par.Pid);
			if ("Plexus" in Par)
				log.i("--     Proxy-Chan", (Par.Chan));
			switch(Par.Role) {
			case 'Server':
				genServer.call(this, fun);
				return;
			case 'Client':
				genClient.call(this, fun);
				return;
			default: 
				let err= ""+Par.Role+ " is not an acceptable Role";
				log.w('ERR:Proxy:Setup: ', err);
				if(fun)
					fun(err, com);
				return;
			}
		}
		if(fun)
			fun(null, com);
	}


	/**
	 * Determines which role Proxy is operating as (Client or Server). Role defined in Par.Role
	 * Starts Server or connects to defined external server as set in Par.
	 * @param {Object} com
	 * @param {function} fun Must be returned
	 */
	function Start(com, fun) {
		var Par = this.Par;
		if(Par.Chan != 'Plexus'&& "Plexus" in Par) {
			log.i('--Proxy/Start', this.Par.Pid);
			log.i("--     Proxy-Chan", (Par.Chan));
			switch(Par.Role) {
			case 'Server':
				genServer.call(this, fun);
				return;
			case 'Client':
				genClient.call(this, fun);
				return;
			default: 
				let err= ""+Par.Role+ " is not an acceptable Role";
				log.w('ERR:Proxy:Start: ', err);
				if(fun)
					fun(err, com);
				return;
			}
		}
		if(fun)
			fun(null, com);
	}


	/**
	 * Run at Setup/Start if Proxy role is set to Server
	 * Creates a TCP server as defined by Par.Port and routes commands received to Module set in Par.Link
	 * @param {function} fun
	 */
	function genServer(fun) {
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		var err;

		if ("Plexus" in Par){
			if(!('Chan' in Par))
				err = 'No Chan in Par';
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
				log.w('ERR:Proxy:genServer: ' + err);
				if (fun)
					fun(err);
				return;
			}
			log.i('..connect', r);
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
			var port = r.Port;
			Vlt.Server = true;
			Vlt.Socks = [];

			net.createServer(function(sock) {
				log.i('#### Portal connection from',
					sock.remoteAddress + ':' + sock.remotePort);
				Vlt.Socks.push(sock);
				sock._userData = {};
				sock._userData.Buf = '';
				sock._userData.State = 0;

				sock.on('error', (err) => {
					log.w('ERR:Proxy:genServer:' + err);
					if ("Chan" in Par)
						log.w('		Proxy:Chan' + Par.Chan);
				});

				// Process data received from socket. The messages are
				// bracketed by STX(02) and ETX(03). Note that messages
				// may not be complete spanning multiple sends, or the
				// data content may contain multiple messages
				// TODO: Implement more flexible buffering policy
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
						Buf += data.toString('utf8', i1, i2+1); // Unused
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
			log.i('Portal listening on port', port);
			if(fun)
				fun();
		}
	}


	/**
	 * Run at Setup/Start if Proxy role is set to Client
	 * Creates a TCP socket connection to a host defined in Par.Host and Par.Port
	 * @param {function} fun
	 */
	function genClient(fun) {
		let that = this;
		let Par = this.Par;
		let Vlt = this.Vlt;
		var err;
		if ("Plexus" in Par){
			if(!('Chan' in Par))
				err = 'No Chan in Par';
			if(err) {
				log.w("ERR:Proxy:genClient: "+err);
				if(fun)
					fun(err);
				return;
			}
			let q = {};
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
				log.w("ERR:Proxy:genClient: "+err);
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
				log.w('ERR:Proxy:genClient: ' + err);
				log.w('    Proxy:' + Par.Chan);
				if(fun)
					fun(err);
				return;
			}
			var net = that.require('net');
			var err;
			var tmp = new Buffer(2);
			tmp[0] = 2;
			tmp[1] = 3;
			var str = tmp.toString();

			Vlt.STX = str.charAt(0);
			Vlt.ETX = str.charAt(1);
			Vlt.Buf = '';
			Vlt.State = 0;
			Vlt.Subscribed = false;
			var port = r.Port;
			var host = r.Host;
			var sock = new net.Socket();
			Vlt.Server = false;

			connectLoop();

			function connectLoop(){
				sock.removeAllListeners();
				sock.connect(port, host, function () {log.i("Proxy:: trying to connect")});

				sock.on('connect', function () {
					if ("Chan" in Par){
						log.i('Proxy - Connected to '+Par.Chan+ ' on host:' + host + ', port:' + port);
					}else{
						log.i('Proxy - Connected to server on host:' + host + ', port:' + port);
					}
					Vlt.Sock = sock;
					if (!("Replied" in Vlt)||Vlt.Replied ==false){
						Vlt.Replied = true;
						if(fun)
							fun(null);
					}
				});

				sock.on('error', (err) => {
					log.w('ERR:Proxy:genClient: ' + err);
					if ("Chan" in Par)
						log.w('    Name:' + Par.Name, 'Chan:', Par.Chan, 'Hose:' + host, 'Port:' + port);
					if (Par.Poll){
						if (!("Timer" in Vlt) && "Timeout" in Par){
							Vlt.Timer = setTimeout(()=>{
								log.e("Error: Proxy "+Par.Pid+ " connection timeout. Last Attempt.");
								Par.Poll = false;
							},Par.Timeout);
						}
						log.v("Proxy "+Par.Pid+ " is Polling");
						if ("Sock" in Vlt)
							delete Vlt["Sock"];
						setTimeout(connectLoop,3000);
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
					log.i(' ** Socket disconnected:' + err);
					
					if (Par.Poll){
						if ("Sock" in Vlt)
							delete Vlt[Sock];
						setTimeout(connectLoop,3000);
						
					}else{
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
							let com = JSON.parse(Vlt.Buf);
							if('Reply' in com.Passport) {
								if(Vlt.Fun[com.Passport.Pid])
									Vlt.Fun[com.Passport.Pid](null, com);
							} else {
								that.send(com, Par.Link);
							}
							break;
					}
				});
			}
		}
	}



	//-----------------------------------------------------Proxy
	/**
	 * Routes commands depending on role defined in Par.Role
	 * Client:: Routes to module defined in Par.Link.
	 * Server:: Routes to TCP connection defined in Par.Host and Par.Port.
	 * @param {Object} com Command to be sent through Proxy
	 * @param {function} fun Callback function returned after command is received and processed at it's destination.
	 */
	function Proxy(com, fun) {
		let that = this;
		var Par = this.Par;
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
					log.i('Par', JSON.stringify(Par, null, 2));
					var err = 'Proxy role is unknown';
					log.w('ERR:Proxy:Proxy: ' + err);
					if ("Chan" in Par)
						log.w('    Proxy:' + Par.Chan);
					if(fun)
						fun(err);
					return;
			}
		} else {
			log.i('Par', JSON.stringify(Par, null, 2));
			var err = 'Proxy has no role';
			log.w('ERR:Proxy:Proxy' + err);
			if ("Chan" in Par)
				log.w('    Proxy:' + Par.Chan);
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
			var sock = Vlt.Sock;
			if(!sock) {
				log.v('No Socket');
				//we are purposely withholding the callback we should call it back once the socket is formed but we need an event listener for this
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
			var msg = Vlt.STX + JSON.stringify(com) + Vlt.ETX;
			sock.write(msg);
		}
	}
})();
