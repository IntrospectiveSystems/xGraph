(function Proxy() {


	var dispatch = {
		Setup: Setup,
		SetPublicKey,
		"*": Proxy
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
		log.i('--Proxy/Setup: \n', JSON.stringify(this.Par, null, 2));
		var Par = this.Par;
		var Vlt = this.Vlt;
		var that = this;
		var net = this.require('net');
		var NodeRSA = this.require('node-rsa');
		var plx;
		var tmp = new Buffer(2);
		tmp[0] = 2;
		tmp[1] = 3;
		var str = tmp.toString();
		Vlt.STX = str.charAt(0);
		Vlt.ETX = str.charAt(1);
		var STX = 2;
		var ETX = 3;
		var cmd = {};
		if ('Chan' in Par)
			cmd.Chan = Par.Chan;
		cmd.Passport = {};
		cmd.Passport.Disp = 'Query';
		switch (Par.Role.toLowerCase()) {
			case 'server':
				cmd.Cmd = 'Publish';
				var ip = this.require('ip');
				cmd.Host = ip.address();
				plexus(server);
				break;
			case 'client':
				cmd.Cmd = 'Subscribe';
				plexus(client);
				break;
			default:
				var err = 'Invalid role';
				log.e(err);
				if (fun)
					fun(err);
				return;
		}

		function plexus(connect) {
			if (!('Chan' in Par)) {
				connect(Par.Host || '127.0.0.1', parseInt(Par.Port || 27000));
				return;
			}

			var plex = Par.Plexus || '127.0.0.1:27000';

			//pull the plexus host and port form the process args
			var args = process.argv;
			for (var i = 1; i < args.length; i++) {
				var arg = args[i];
				var parts = arg.split('=');
				if (parts.length != 2)
					continue;
				if (parts[0] != 'Plexus')
					continue;
				plex = parts[1];
				break;
			}

			var parts = plex.split(':');
			var host = that.Par.Host || parts[0];
			var port = that.Par.Port || parts[1] || 27000;
			if (typeof port != "number")
				port = parseInt(port);
			var sock = new net.Socket();

			connectLoop();

			function connectLoop() {
				sock.removeAllListeners();

				sock.connect(port, host, function () {
					log.i('Proxy - Plexus: Attempting Connection (' + host + ', ' + port + ')');
				});

				sock.on('connect', function () {
					log.i('Proxy - Plexus: Connection Succeeded');
					var msg = Vlt.STX + JSON.stringify(cmd) + Vlt.ETX;
					// log.v('Sending <' + msg + '> to Plexus');
					sock.write(msg);
				});

				sock.on('data', function (data) {
					var n = data.length;
					var str = data.toString('utf8', 1, n - 1);
					// log.v('Proxy - Plexus: Data <' + str + '>');
					str = JSON.parse(str);
					if (Array.isArray(str)) [err, str] = str;
					var r = str;
					sock.destroy();
					if ('Host' in r && 'Port' in r) {
						log.i(`Proxy - Plexus: Connection Complete`);
						if (Vlt.Timer)
							clearTimeout(Vlt.Timer);
						connect(r.Host, r.Port);
					}
					else {
						var err = `Proxy - the requested channel ${Par.Chan || ""} is not yet available in Plexus`;
						log.i('Proxy - Plexus: ' + err);
						// if ("Chan" in Par)
						// 	log.w('  Chan:', Par.Chan, 'Host:' + host, 'Port:' + port);
						if (!("Timer" in Vlt)) {
							Vlt.Timer = setTimeout(() => {
								log.e("Error: Proxy " + Par.Pid + " connection timeout. Last Attempt.");
								Par.EndPoll = true;
							}, Par.Timeout || 10000);
						}
						log.v("Proxy " + Par.Pid + " is Polling");
						if (!Par.EndPoll)
							setTimeout(connectLoop, 1000);
						else process.exit(1);
					}
				});

				sock.on('error', (err) => {
					log.w('Proxy - Plexus: ' + err);
					if ("Chan" in Par)
						log.w('  Chan:', Par.Chan, 'Host:' + host, 'Port:' + port);
					if (!("Timer" in Vlt)) {
						Vlt.Timer = setTimeout(() => {
							log.e("Error: Proxy " + Par.Pid + " connection timeout. Last Attempt.");
							Par.EndPoll = true;
						}, Par.Timeout || 10000);
					}
					log.v("Proxy " + Par.Pid + " is Polling");
					if (!Par.EndPoll)
						setTimeout(connectLoop, 1000);
					else process.exit(1);
				});
			}
		}

		function server(host, port) {
			let publicKey = null;
			if (!port) {
				var err = 'Proxy - server requires port assignment';
				log.e(err);
				fun(err);
				return;
			}
			if (!('Link' in Par)) {
				var err = 'Proxy servers require a Link parameter';
				log.e(err);
				log.e(JSON.stringify(Par, null, 2));
				fun(err);
				return;
			}
			if ("Encrypt" in Par && (!Par.Encrypt)) {
				keyPair = null;
			}
			else {
				if (("PrivateKey" in Par) && (typeof Par.PrivateKey == "string")) {
					Vlt.RSAKey = new NodeRSA();
					Vlt.RSAKey.importKey(Par.PrivateKey, Par.PrivateKeyFormat || "private");
				} else {
					Vlt.RSAKey = new NodeRSA({ b: 512 });
					Vlt.PublicKey = Vlt.RSAKey.exportKey("public");
				}
			}
			Vlt.Buf = '';
			Vlt.State = 0;
			Vlt.Subscribed = false;
			Vlt.Server = true;
			Vlt.Socks = [];
			net.createServer(function (sock) {
				log.v('#### Portal connection from',
					sock.remoteAddress + ' :: ' + sock.remotePort);
				Vlt.Socks.push(sock);
				sock._userData = {};
				sock._userData.Buf = '';
				sock._userData.State = 0;

				if (!("Encrypt" in Par) || Par.Encrypt) {
					sock.write(Vlt.STX + JSON.stringify({
						Cmd: "SetPublicKey",
						Key: Vlt.PublicKey || null
					}) + Vlt.ETX);
				}

				sock.on('error', (err) => {
					if (err.code == "ECONNRESET")
						log.v("Proxy: socket closed by other party");
					else
						log.w("Proxy ", err);
					if ("Chan" in Par)
						log.w('		Proxy: Chan - ' + Par.Chan);
				});

				// Process data received from socket. The messages are
				// bracketed by STX(02) and ETX(03). Note that messages
				// may not be complete spanning multiple sends, or the
				// data content may contain multiple messages
				// TODO: Implement more flexible buffering policy
				sock.on('data', async function (data) {
					var Buf = sock._userData.Buf;
					var State = sock._userData.State;
					var Fifo = [];
					var isQuery;
					var nd = data.length;
					var i1 = 0;
					var i2 = nd - 1;
					// log.d(State, i1, i2, Buf.length, data.length, 'data <' + data + '>');
					for (let i = 0; i < nd; i++) {
						switch (State) {
							case 0:
								if (data[i] === STX) {
									Buf = '';
									State = 1;
									i1 = i + 1;
								}
								break;
							case 1:
								i2 = i;
								if (data[i] === ETX) {
									Buf += data.toString('utf8', i1, i2);
									if (Vlt.PublicKey) {

										Buf = Vlt.RSAKey.decrypt(Buf, 'utf8');
									}
									var obj = JSON.parse(Buf);
									Fifo.push(obj);
									State = 0;
								}
								break;
						}
					}
					if (State === 1)
						Buf += data.toString('utf8', i1, i2 + 1);
					sock._userData.State = State;
					sock._userData.Buf = Buf;
					await loop();

					async function loop() {
						if (Fifo.length < 1)
							return;
						var q = Fifo.shift();
						if (q.Passport.Disp && q.Passport.Disp === 'Query')
							isQuery = true;
						else
							isQuery = false;

						that.send(q, Par.Link, reply);

						async function reply(err, r) {
							if (isQuery) {
								r.Passport.Reply = true;

								// -------------------------- Pid interchange
								if (r.PidInterchange && 'Pool' in that.Par) {

									r = await recurse(r);

									async function recurse(obj) {
										if ('Format' in obj
											&& 'Value' in obj
											&& typeof obj.Value == 'string'
											&& obj.Value.match(/^[A-Z0-9]{32}$/) != null
											&& obj.Format == 'is.xgraph.pid') {
											let pid = obj.Value;
											let { Host, Port } = await new Promise(resolve => {
												that.send({
													Cmd: 'GetHostAndPort',
													Pid: pid
												}, that.Par.Pool, (err, cmd) => {
													if ('Host' in cmd && 'Port' in cmd) resolve({
														Host: cmd.Host,
														Port: cmd.Port
													});
													else {
														log.w(err);
														resolve('Connection refused');
													}
												});
											});
											obj.Value = { Host, Port };
											obj.Format = 'is.xgraph.proxyconnection';
											return obj;
										}
										for (let key in obj) {
											if (typeof obj[key] == 'object')
												obj[key] = await recurse(obj[key]);
										}
										return obj;
									}
								}
								// parse it into a message
								str = JSON.stringify([err, r]);
								if (Vlt.RSAKey) {
									str = Vlt.RSAKey.encryptPrivate(str, 'base64');
								}
								let msg = Vlt.STX + str + Vlt.ETX;
								var res = sock.write(msg, 'utf8', loop);
							}
						}
					}
				});
			}).listen(port);
			log.i(`${Par.Chan || ""} Portal listening on port ${port}`);
			fun();
		}

		function client(host, port) {
			if (!host) {
				var err = 'Proxy - client requires host';
				log.e(err);
				fun(err);
				return;
			}
			Vlt.Buf = '';
			Vlt.State = 0;
			Vlt.Subscribed = false;
			var sock = new net.Socket();
			Vlt.Server = false;

			connectLoop();

			function connectLoop() {
				sock.removeAllListeners();
				sock.connect(port, host, function () { log.i("Proxy:: trying to connect") });

				sock.on('connect', function () {
					if ("Chan" in Par) {
						log.v(com.Cmd, 'Proxy - Connected to ' + Par.Chan + ' on host:' + host + ', port:' + port);
					} else {
						log.v(com.Cmd, 'Proxy - Connected to server on host:' + host + ', port:' + port);
					}
					Vlt.Sock = sock;
					if (!("Replied" in Vlt) || Vlt.Replied == false) {
						Vlt.Replied = true;
						fun();
					}
				});

				sock.on('error', (err) => {
					log.e('ERR:Proxy:genClient: ' + err);
					if ("Chan" in Par)
						log.w('    Name:' + Par.Name, 'Chan:', Par.Chan, 'Host:' + host, 'Port:' + port);
					if (Par.Poll) {
						if (!("Timer" in Vlt) && "Timeout" in Par) {
							Vlt.Timer = setTimeout(() => {
								log.e("Error: Proxy " + Par.Pid + " connection timeout. Last Attempt.");
								Par.Poll = false;
							}, Par.Timeout);
						}
						log.v("Proxy " + Par.Pid + " is Polling");
						if ("Sock" in Vlt)
							delete Vlt["Sock"];
						setTimeout(connectLoop, 3000);
						if (!("Replied" in Vlt) || Vlt.Replied == false) {
							Vlt.Replied = true;
							fun();
						}
					} else {
						//Return a hard fail. Should be only called once.
						if (!("Replied" in Vlt) || Vlt.Replied == false) {
							Vlt.Replied = true;
							fun("Connection Refused");
						}
					}
				});

				sock.on('disconnect', (err) => {
					log.i(' ** Socket disconnected:' + err);

					if (Par.Poll) {
						if ("Sock" in Vlt)
							delete Vlt[Sock];
						setTimeout(connectLoop, 3000);

					} else {
						//Return a hard fail. Should be only called once.
						if (!("Replied" in Vlt) || Vlt.Replied == false) {
							Vlt.Replied = true;
							fun("Connection Declined");
						}
					}
				});


				sock.on('data', async function (data) {
					var nd = data.length;
					var i1 = 0;
					var i2;
					var STX = 2;
					var ETX = 3;
					if (Vlt.State == 0)
						Vlt.Buf = '';
					for (let i = 0; i < nd; i++) {
						switch (Vlt.State) {
							case 0:
								if (data[i] == STX) {
									Vlt.Buf = '';
									Vlt.State = 1;
									i1 = i + 1;
								}
								break;
							case 1:
								i2 = i;
								if (data[i] == ETX)
									Vlt.State = 2;
								break;
						}
					}
					switch (Vlt.State) {
						case 0:
							break;
						case 1:
							Vlt.Buf += data.toString('utf8', i1, i2 + 1);
							break;
						default:
							Vlt.Buf += data.toString('utf8', i1, i2);
							Vlt.State = 0;
							if (Vlt.PublicKey) {
								Vlt.Buf = Vlt.RSAKey.decryptPublic(Vlt.Buf, 'utf8');
							}
							let err, com = JSON.parse(Vlt.Buf);
							if (Array.isArray(com)) [err, com] = com;

							// -------------------------- Pid interchange
							if (com.PidInterchange) {
								// log.d('IM HERE!!!', com);

								com = await recurse(com);

								async function recurse(obj) {
									if ('Format' in obj
										&& 'Value' in obj
										&& typeof obj.Value == 'object'
										&& 'Host' in obj.Value
										&& 'Port' in obj.Value
										&& obj.Format == 'is.xgraph.proxyconnection') {
										let { Host, Port } = obj.Value;
										let pid = await new Promise(resolve => {
											that.genModule({
												Module: 'xGraph.Proxy',
												Par: {
													Role: 'Client',
													Host,
													Port
												}
											}, (err, apx) => {
												// log.d(`converted to ${apx}`);
												resolve(apx);
											});
										});
										log.i(`${Host}:${Port} -> ${pid}`);
										obj.Value = pid;
										obj.Format = 'is.xgraph.pid';
										obj.toString = function () {
											return this.Value;
										}
										return obj;
									}
									for (let key in obj) {
										if (typeof obj[key] == 'object')
											obj[key] = await recurse(obj[key]);
									}
									return obj;
								}
							}

							if (!com.Passport) {
								// log.d(`dispatching ${JSON.stringify(com, null, 2)}`);
								that.dispatch(com);
							} else if ('Reply' in com.Passport) {
								if (Vlt.Fun[com.Passport.Pid])
									Vlt.Fun[com.Passport.Pid](err || null, com);
									delete Vlt.Fun[com.Passport.Pid];
							} else {
								that.send(com, Par.Link);
							}
							break;
					}
				});
			}
		}

		if (this.Par.AutoSave)
			this.save(_ => _);
	}

	function SetPublicKey(com, fun) {
		log.i("Proxy/SetPublicKey");
		let NodeRSA = this.require('node-rsa');
		this.Vlt.PublicKey = com.Key;
		if (!this.Vlt.PublicKey) {
			if (("PublicKey" in this.Par) && (typeof this.Par.PublicKey == "string")) {
				this.Vlt.PublicKey = this.Par.PublicKey;
			}
		}
		log.v(`Socket Encrypted with public key: \n${this.Vlt.PublicKey}`);
		this.Vlt.RSAKey = new NodeRSA();
		this.Vlt.RSAKey.importKey(this.Vlt.PublicKey, this.Par.PublicKeyFormat || 'public');
		if (fun) fun(null, com);
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
		if ('Role' in Par) {
			switch (Par.Role.toLowerCase()) {
				case 'client':
					client();
					break;
				case 'server':
					server();
					break;
				default:
					log.i('Par', JSON.stringify(Par, null, 2));
					var err = 'Proxy role is unknown';
					log.w('ERR:Proxy/Proxy: ' + err);
					if ("Chan" in Par)
						log.w('    Proxy:' + Par.Chan);
					if (fun)
						fun(err);
					return;
			}
		} else {
			log.i('Par', JSON.stringify(Par, null, 2));
			var err = 'Proxy -  has no role';
			log.e(err);
			if ("Chan" in Par)
				log.w('    Proxy:' + Par.Chan);
			if (fun)
				fun(err);
		}


		function server() {
			//encrypt as base64 
			if (Vlt.RSAKey) {
				com = Vlt.RSAKey.encryptPrivate(com, 'base64');
			}
			else com = JSON.stringify(com);
			var msg = Vlt.STX + com + Vlt.ETX;
			for (var i = 0; i < Vlt.Socks.length; i++) {
				var sock = Vlt.Socks[i];
				sock.write(msg);
			}
		}

		async function client() {
			var sock = Vlt.Sock;
			if (!sock) {
				log.v('No Socket');
				//we are purposely withholding the callback we should call it back once the socket is formed but we need an event listener for this
				return;
			}
			if (!("Fun" in Vlt)) Vlt.Fun = {};
			
			if (fun) {
				Vlt.Fun[com.Passport.Pid] = fun;
				com.Passport.Disp = 'Query';
			}
			else {
				if (com.Passport.Pid in Vlt.Fun) delete Vlt.Fun[com.Passport.Pid];
			}
			if (!("Encrypt" in Par) || Par.Encrypt) {
				if (Vlt.RSAKey) {
					com = Vlt.RSAKey.encrypt(com, 'base64');
				} else {
					//we must wait until RSAKey exists
					com = await new Promise((res, rej) => {
						Vlt.RaceLoop = setInterval(() => {
							// log.d(`Race Loop`);
							if (Vlt.RSAKey) {
								res(Vlt.RSAKey.encrypt(com, 'base64'));
								clearInterval(Vlt.RaceLoop);
							}
						}, 500);
					});
				}
			} else com = JSON.stringify(com);
			var msg = Vlt.STX + com + Vlt.ETX;
			sock.write(msg);
		}
	}
})();
