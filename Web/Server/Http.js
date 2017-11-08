//# sourceURL=server/http
(function Http() {
	let jszip;

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetModule: GetModule,
		'*': Publish
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		log.v('--Http/Setup');

		jszip = this.require("jszip");



		if (fun)
			fun();
	}

	function Start(com, fun) {
		log.v('--Http/Start');
		var that = this;
		var http = this.require('http');
		var sockio = this.require('socket.io');
		var port;
		var Par = this.Par;
		var Vlt = this.Vlt;
		Vlt.Session = this.genPid();
		if ('Port' in this.Par)
			port = this.Par.Port;
		else
			port = 8080;
		var web = http.createServer(function (req, res) {
			//	console.log(req.method + ':' + req.url);
			switch (req.method) {
				case 'POST':
					break;
				case 'GET':
					Get(that, req, res);
					break;
			}
		});
		web.listen(port);
		webSocket(web);
		console.log(' ** Spider listening on port', port);
		if ('Config' in this.Par) {
			readBrowser(null, this.Par.Config);
		} else {
			readBrowser('Config not in Par', null);
		}

		function readBrowser(err, data) {
			if (err) {
				console.log(' ** ERR::Cannot read browser config');
				fun(err);
				return;
			}
			Vlt.Browser = JSON.parse(data.toString());
			getscripts();
		}

		function getscripts() {
			that.getFile('scripts.json', function (err, data) {
				if (err) {
					console.log(' ** ERR:Cannot read script.json');
					fun(err);
					return;
				}
				Vlt.Browser.Scripts = JSON.parse(data.toString());
				getnxs();
			})
		}

		function getnxs() {

			that.getFile('Nxs.js', function (err, data) {
				if (err) {
					console.log(' ** ERR:Cannot read Nxs file');
					return;
				}
				Vlt.Browser.Nxs = data.toString();
				fun();
			});
		}

		//---------------------------------------------------------webSocket
		function webSocket(web) {
			var listener = sockio.listen(web);
			Vlt.Sockets = {};
			var Sockets = Vlt.Sockets;

			listener.sockets.on('connection', function (socket) {
				// console.log('sock/connection');
				var pidsock = '';
				for (var i = 0; i < 3; i++)
					pidsock += that.genPid().substr(24);
				var obj = {};
				obj.Socket = socket;
				obj.User = {};
				obj.User.Pid = '160D25754C01438388CE6A946CD4480C';
				Sockets[pidsock] = obj;

				var cfg = Vlt.Browser;
				cfg.Pid24 = pidsock;
				cfg.PidServer = Par.Pid;
				cfg.ApexList = Par.ApexList || {};
				var str = JSON.stringify(cfg);
				socket.send(str);

				socket.on('disconnect', function () {
					// console.log(' >> Socket', pidsock, 'disconnected');
					delete Sockets[pidsock];
				});

				socket.on('error', function (err) {
					// console.log(' >> Socket', pidsock, '**ERR:' + err);
					delete Sockets[pidsock];
				});

				socket.on('message', function (msg) {
					//debugger;
					var com = JSON.parse(msg);
					//console.log('>>Msg:' + JSON.stringify(com));
					if (!com) {
						console.log(' ** onMessage: Invalid message');
						return;
					}
					if (com.Cmd == 'GetFile') {
						getfile();
						return;
					}
					if (com.Cmd == 'Subscribe') {
						obj.User.Publish = com.Pid;
						return;
					}
					if (!('Passport' in com)) {
						console.log(' ** ERR:No Passport in routed msg');
						return;
					}

					// debugger;
					//	com.Passport.User = obj.User;
					if ('Reply' in com.Passport && com.Passport.Reply) {
						// debugger;
						if (com.Passport.Pid in that.Vlt.messages) {
							that.Vlt.messages[com.Passport.Pid](null, com);
							delete that.Vlt.messages[com.Passport.Pid];
						}
						return;
					}
					//debugger;
					that.send(com, com.Passport.To, reply);

					function reply(err, cmd) {
						// console.log("--HttpReply");
						// console.log(JSON.stringify(cmd));
						// console.log(JSON.stringify(com));
						if (cmd) {
							com = cmd;
						}
						com.Passport.Reply = true;
						var str = JSON.stringify(com);
						socket.send(str);
					}

					//.....................................getfile
					/// Read file from local directory
					function getfile() {
						//debugger;
						var path = com.File;
						that.getFile(path, function (err, data) {
							if (err) {
								console.log(' ** ERR', err);
								return;
							}
							com.Data = data.toString('utf8');
							var str = com.Data;
							if ('Passport' in com)
								com.Passport.Reply = true;
							var str = JSON.stringify(com);
							socket.send(str);
						});
					}
				});
			});
		}
	}

	//-------------------------------------------------------Publish
	// This is called when message needs to be sent to all
	// browsers that have subscribed
	function Publish(com, fun) {
		//debugger;
		// console.log('--Publish', com.Cmd);
		fun = fun || (() => { });
		var Vlt = this.Vlt;
		var socks = Vlt.Sockets;
		var keys = Object.keys(socks);
		for (var i = 0; i < keys.length; i++) {
			var obj = socks[keys[i]];
			var sock = obj.Socket;
			var user = obj.User;
			if ('Publish' in user) {
				com.Passport.To = user.Publish;
				if (fun) {
					com.Passport.Disp = 'Query';
				}
			}
			if ('Forward' in com) {
				com.Passport.To = com.Forward;
				if (fun) {
					if (!('messages' in this.Vlt)) this.Vlt.messages = {};
					this.Vlt.messages[com.Passport.Pid] = fun;
				}
			}
			var str = JSON.stringify(com);
			sock.send(str);
		}
	}

	//-------------------------------------------------------Get
	// Process GET request including authentication and
	// validation if required. If anything looks fishy, simply
	// ignore the request to confuse the hackers.

	//any HTTP Get accessible files should be stored in a ./static/ directory
	function Get(that, req, res) {
		log.v('--Get', req.url);
		var Par = that.Par;
		var url = req.url;
		let path = null;

		if (url.split(".").length > 1) {
			let arr = url.split('/');
			arr = arr.slice(1);

			let store = Par.Static || {};

			ship(...subSearch(arr, store));

			function subSearch(ar, st) {
				if (ar[0] in st) {
					if (ar.length == 1) {
						return [null, st[ar[0]]];
					}
					else {
						return subSearch(arr.slice(1), st[ar[0]]);
					}
				} else {
					let err = `${url} does not exist in Par.Static`;
					log.w(err);
					return [err];
				}
			}

		} else {
			if (url.charAt(0) == '/')
				url = url.substr(1);
			if (url == Par.Url)
				ship(null, Par.HTML);
			else {
				res.writeHead(404);
				res.end('You are out of your verbial guord');
				return;
			}
		}

		function ship(err, data) {
			if (err) {
				res.writeHead(404);
				res.end(err);
				return;
			}
			var page = data.toString();
			res.setHeader('Content-Type', 'text/html');
			res.end(page);
		}
	}

	//-----------------------------------------------------getModule
	// Retrieve module from module server
	// For now is retrieved from local file system
	function GetModule(com, fun) {
		log.v('--Http/GetModule', com.Module);
		//console.log(JSON.stringify(com));
		var that = this;
		var zip = new jszip();
		//var dir = that.genPath(com.Module);
		var man = [];
		GetModule(com.Module, function (err, mod) {
			if (err) {
				console.log(' ** ERR:Cannot read module directory');
				if (fun)
					fun('Cannot read module directlry');
				return;
			}

			var str = JSON.stringify(mod);
			//console.log("mod is ", Object.keys(mod));
			zip.file('module.json', str, {
				date: new Date("December 25, 2007 00:00:01")
				//the date is required for zip consistency
			});
			man.push('module.json');
			zip.file('manifest.json', JSON.stringify(man), {
				date: new Date("December 25, 2007 00:00:01")
				//the date is required for zip consistency
			});
			zip.generateAsync({ type: 'base64' }).then(function (data) {
				com.Zip = data;
				fun(null, com);
			});
		});


		/**
		 * For loading modules
		 * Modules come from a defined broker, or disk depending on the module definition
		 * @param {Object} modRequest 
		 * @param {String} modRequest.Module the dot notation of the module name
		 * @param {String} modRequest.Source the source Broker or path reference for the module 
		 * @param {Function} fun  the callback has form (error, module.json)
		 */
		async function GetModule(modRequest, fun) {
			let modnam = modRequest.Module;
			let source = modRequest.Source;
			let mod = null;
			let ModName = modnam.replace(/\:/, '.').replace(/\//g, '.');

			//get the module from module.json if it has already been retrieved
			mod = await new Promise((resolve, reject) => {
				that.getFile(ModName, (err, modzip) => {
					if (err) return reject(null);
					resolve(modzip);
				});
			});
			if (mod !== null) return fun(null, ModCache[ModName]);

			//get the module from the defined broker
			if (typeof source == "object") return loadModuleFromBroker();

			//get the module from file system
			loadModuleFromDisk()


			////////////////////////////////////////////////////////////////////////////////////////////////
			//
			// Only Function Definitions Beyond This Point
			//
			//

			/**
			 * open up a socket to the defined broker and access the module
			 */
			function loadModuleFromBroker() {
				const { Socket } = require('net');
				const sock = new Socket();
				const port = source.Port;
				const host = source.Host;
				let State;
				let Buf;
				sock.connect(port, host, function () { console.log("trying to connect") });
				sock.on('connect', function () {
					let cmd = {};
					cmd.Cmd = "GetModule";
					cmd.Module = modnam;
					let msg = `\u0002${JSON.stringify(cmd)}\u0003`;
					sock.write(msg);
					log.v(`Requested Module ${modnam} from Broker \n${JSON.stringify(source, null, 2)}`);
				});

				sock.on('error', (err) => {
					log.w(' ** Socket error:' + err);
				});

				sock.on('disconnect', (err) => {
					log.v(' ** Socket disconnected:' + err);
				});

				sock.on('data', function (data) {
					let nd = data.length;
					let i1 = 0;
					let i2;
					let STX = 2;
					let ETX = 3;
					if (State == 0)
						Buf = '';
					for (let i = 0; i < nd; i++) {
						switch (State) {
							case 0:
								if (data[i] == STX) {
									Buf = '';
									State = 1;
									i1 = i + 1;
								}
								break;
							case 1:
								i2 = i;
								if (data[i] == ETX)
									State = 2;
								break;
						}
					}
					switch (State) {
						case 0:
							break;
						case 1: {
							Buf += data.toString('utf8', i1, i2 + 1);
							break;
						}
						default: {
							Buf += data.toString('utf8', i1, i2);
							State = 0;
							let response = JSON.parse(Buf);
							module.paths = [Path.join(Path.resolve(CacheDir), 'node_modules')];
							const jszip = require("jszip");
							const zipmod = new jszip();

							zipmod.loadAsync(response.Module, { base64: true }).then(function (zip) {
								var dir = zipmod.file(/.*./);

								zip.file('module.json').async('string').then(function (str) {
									mod = JSON.parse(str);
									ModCache[ModName] = mod;
									fun(null, ModCache[ModName]);
								});
							});
						}
					}
				});
			}

			/**
			 * load module from disk
			 */
			function loadModuleFromDisk() {
				let dir = ModName.replace('.', ':').replace(/\./g, '/');
				let ModPath = genPath(dir);
				//read the module from path in the local file system
				//create the Module.json and add it to ModCache
				fs.readdir(ModPath, function (err, files) {
					if (err) {
						err += ' ** ERR:Module <' + ModPath + '? not available'
						log.e(err);
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
							if ('schema.json' in mod) {
								var schema = JSON.parse(mod['schema.json']);
								if ('Apex' in schema) {
									var apx = schema.Apex;
									if ('$Setup' in apx)
										mod.Setup = apx['$Setup'];
									if ('$Start' in apx)
										mod.Start = apx['$Start'];
									if ('$Save' in apx)
										mod.Save = apx['$Save'];
								}
							}
							ModCache[ModName] = mod;
							fun(null, ModCache[ModName]);
							return;
						}
						var file = files[ifile];
						var path = ModPath + '/' + file;
						fs.lstat(path, function (err, stat) {
							if (stat) {
								if (!stat.isDirectory()) {
									fs.readFile(path, function (err, data) {
										if (err) {
											log.e(err);
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
						});
					}
				});
			}
		}
	}

})();
