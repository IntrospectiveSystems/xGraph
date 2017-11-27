//# sourceURL='TestBroker.js'
(function TestBroker() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Start
	};

	return {
		dispatch: dispatch
	};

	function Start(com, fun) {
		log.v('--TestBroker/Start');
		let Vlt = this.Vlt;
		let Par = this.Par;
		let that = this;
		var q = {};
		q.Port = this.Par.Port;
		
		connect(null, q);
	
		function connect(err, r) {
			if(err) {
				log.e(err);
				if (fun)
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
			Vlt.Server = true;
			Vlt.Socks = [];
			net.createServer(function(sock) {
				log.v('####  connection from',
					sock.remoteAddress + ':' + sock.remotePort);
				Vlt.Socks.push(sock);
				sock._userData = {};
				sock._userData.Buf = '';
				sock._userData.State = 0;

				// var msg = Vlt.STX + JSON.stringify({Cmd:"SomethingCool",Passport:{}}) + Vlt.ETX;
				// sock.write(msg);

				sock.on('error', (err) => {
					log.e(err);
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
									log.d(`added to the Fifo ${Buf}, ${typeof obj}`);
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
						log.d(q)
						let err, com=q;
						if (Array.isArray(q))
							[err, com] = q; // deconstruct the array in com, if it is one.

						if (!com) {
							log.e(' ** onMessage: Invalid message');
							return;
						}

						if (!("Cmd" in com)) {
							log.e("No command (Cmd) in com");
						}

						switch (com.Cmd) {
							case 'GetModule': {
								getfile();
								return;;
							}
							default: {
								log.w(`Broker does not respond to ${com.Cmd} requests`);
							}
						}

						function getfile() {
							
							GetModule(com.Module, function (err, data) {
								if (err) {
									log.e(err);
									return;
								}
								com.Module = data;
								
								var str = JSON.stringify(com);
								sock.write(str, 'utf8', loop);						});
						}

						function GetModule(modnam, fun) {
							log.d('##GetModule', modnam);

							var ModName = modnam.replace(/\:/, '.').replace(/\//g, '.');
							var dir = ModName.replace('.', ':').replace(/\./g, '/');
							var ModPath = genPath(dir);
							log.d(`modpath is ${ModPath}`);
							var mod = {};

							fs.readdir(ModPath, function (err, files) {
								if (err) {
									log.e('Module <' + ModPath + '? not available');
									fun(err);
									return;
								}
								var nfile = files.length;
								var ifile = -1;
								scan();

								function scan() {
									ifile++;
									if (ifile >= nfile) {
										mod.ModName = ModName;
										fun(null, mod);
										return;
									}
									var file = files[ifile];
									var path = ModPath + '/' + file;
									fs.lstat(path, function (err, stat) {
										if (stat) {
											if (!stat.isDirectory()) {
												fs.readFile(path, function (err, data) {
													if (err) {
														fun(err);
														return;
													}
													mod[file] = data.toString();
													scan();
													return;
												});
												return;
											}
										}
										scan();
									})
								}
							});


						}

						//---------------------------------------------------------genPath
						function genPath(filein) {
							//	EventLog('!!genPath', filein);
							if (!filein) {
								EventLog(' ** ERR:Invalid file name');
								return '';
							}
							var cfg = Config;
							var path;
							var parts;
							var file = filein;
							if (Config.Redirect) {
								if (file in Config.Redirect)
									file = Config.Redirect[file];
							}
							if (file.charAt(0) == '/')
								return file;
							if (file.charAt(0) == '{') { // Macro
								parts = file.split('}');
								if (parts.length != 2) {
									return;
								}
								var name = parts[0].substr(1);
								if (name in cfg) {
									path = cfg[name] + '/' + parts[1];
									return path;
								} else {
									EventLog(' ** ERR:File <' + file + '> {' + name + '} not found');
									return;
								}
							}
							parts = file.split(':');
							if (parts.length == 2) {
								if (parts[0] in cfg) {
									path = cfg[parts[0]] + '/' + parts[1];
								} else {
									EventLog(' ** ERR:File <' + file + '> prefix not defined');
									return;
								}
							} else {
								path = file;
							}
							return path;
						}
					}
				});
			}).listen(port);
			log.i('Portal listening on port', port);
			fun();	
		}
	}
})();
