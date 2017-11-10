//# sourceURL=server/http
(function Http() {
	let jszip;

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		'*': Publish
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		log.v('--Http/Setup');
		jszip = this.require("jszip");
		fun();
	}

	function Start(com, fun) {
		log.v('--Http/Start');
		var that = this;
		var http = this.require('http');
		var sockio = this.require('socket.io');
		var port = this.Par.Port || 8080;
		var Par = this.Par;
		var Vlt = this.Vlt;

		var web = http.createServer(function (req, res) {
			log.i('[HTTP] ' + req.url);
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

		log.v(' ** Spider listening on port', port);
		Vlt.Browser = {};

		getscripts();

		function getscripts() {
			that.getFile('scripts.json', function (err, data) {
				if (err) {
					log.e(' ** ERR:Cannot read script.json');
					fun(err);
					return;
				}
				Vlt.Browser.Scripts = data.toString();
				getnxs();
			})
		}

		function getnxs() {
			that.getFile('Nxs.js', function (err, data) {
				if (err) {
					log.e(' ** ERR:Cannot read Nxs file');
					return;
				}
				Vlt.Browser.Nxs = data.toString();
				fun();
			});
		}

		//---------------------------------------------------------webSocket
		function webSocket(web) {
			let listener = sockio.listen(web);

			let Sockets = Vlt.Sockets || (Vlt.Sockets = {});

			listener.sockets.on('connection', function (socket) {
				let obj = {};
				obj.Socket = socket;
				obj.User = {};
				obj.User.Pid = that.genPid();
				Sockets[obj.User.Pid] = obj;

				socket.on('disconnect', function () {
					delete Sockets[obj.User.Pid];
				});

				socket.on('error', function (err) {
					delete Sockets[obj.User.Pid];
				});

				socket.on('message', function (msg) {
					let err, com = JSON.parse(msg);
					if (Array.isArray(com))
						[err, com] = com; // deconstruct the array in com, if it is one.

					if (!com) {
						log.e(' ** onMessage: Invalid message');
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
					if (com.Cmd == 'GetConfig') {
						getConfig();
						return;
					}
					if (!('Passport' in com)) {
						console.log(' ** ERR:No Passport in routed msg');
						return;
					}

					if ('Reply' in com.Passport && com.Passport.Reply) {
						if ('messages' in that.Vlt && com.Passport.Pid in that.Vlt.messages) {
							that.Vlt.messages[com.Passport.Pid](err, com);
							return;
						}
						return;
					}

					that.send(com, com.Passport.To, reply);

					function reply(err, cmd) {

						if (cmd) {
							com = cmd;
						}
						com.Passport.Reply = true;
						var str = JSON.stringify([err, com]);
						socket.send(str);
					}

					//.....................................getfile
					/// Read file from local directory
					function getfile() {
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

					function getConfig() {
						var path = com.Path;
						let page;
						path = path.charAt(0).toUpperCase() + path.slice(1);

						var cfg = Vlt.Browser;
						cfg.Pid = obj.User.Pid;
						cfg.PidServer = Par.Pid;
						cfg.ApexList = Par.ApexList || {};
						
						if (path in Par) {
							page = Par[path];
						} else {
							log.w(`The page you're looking for (${page}) can't be found.`);
							return;
						}

						for (let key in page) cfg[key] = page[key];

						var str = JSON.stringify(cfg);

						socket.send(str);
					}
				});
			});
		}
	}

	//-------------------------------------------------------Publish
	// This is called when message needs to be sent to all
	// browsers that have subscribed
	function Publish(com, fun) {
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

})();
