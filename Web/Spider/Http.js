(function Http() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Http/Setup');
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Http/Start');
		var that = this;
		var http = require('http');
		var sockio = require('socket.io');
		var port;
		var Par = this.Par;
		var Vlt = this.Vlt;
		Vlt.Session = this.Nxs.genPid();
		if (Par.Authenticate) {
			var auth = require(Par.Authenticate).Auth;
			console.log('Auth:', auth);
		}
		if ('Port' in this.Par)
			port = this.Par.Port;
		else
			port = 80;
		var web = http.createServer(function (req, res) {
			console.log(req.method + ':' + req.url);
			switch (req.method) {
			case 'POST':
				if (Par.Authenticate) {
					Authenticate(req, res);
				}
				break;
			case 'GET':
				Get(that, req, res);
				break;
			}
		});
		web.listen(port);
		webSocket(web);
		console.log(' ** Spider listening on port', port);
		if(fun)
			fun();

		//---------------------------------------------------------webSocket
		function webSocket(web) {
			var listener = sockio.listen(web);
			var vlt = that.Vlt;
			vlt.Sockets = {};
			var Sockets = vlt.Sockets;

			listener.sockets.on('connection', function (socket) {
				console.log('sock/connection');
				var pid = that.Nxs.genPid();
				var pidsock = pid.substr(0, 24);
				var obj = {};
				obj.Socket = socket;
				if (that.Par.Authenticate && !com.Passport.User) {
					let q = {};
					q.Cmd = 'Authenticate';
					q.Token = com.Passport.Token;
				}
				obj.User = {};
				obj.User.Pid = '160D25754C01438388CE6A946CD4480C';
				Sockets[pidsock] = obj;
			//	var pid8 = that.Par.Pid.substr(24);
			//	that.Nxs.addRoute(pidsock, pid8);
				var cmd = {};
				cmd.Cmd = "SetPid";
				cmd.Pid24 = pidsock;
				var str = JSON.stringify(cmd);
				socket.send(str);

				socket.on('disconnect', function () {
					console.log(' >> Socket', pidsock, 'disconnected');
					delete Sockets[pidsock];
				//	that.Nxs.removeRoute(pidsock);
				});

				socket.on('error', function (err) {
					console.log(' >> Socket', pidsock, '**ERR:' + err);
					delete Sockets[pidsock];
				//	that.Nxs.removeRoute(pidsock);
				});

				socket.on('message', function (msg) {
					var com = JSON.parse(msg);
					console.log('>>Msg:' + com.Cmd);
					console.log(com);
					if (!com) {
						console.log(' ** onMessage: Invalid message');
						return;
					}
					if (!('Passport' in com)) {
						console.log(' ** ERR:No Passport in routed msg');
						return;
					}

					com.Passport.User = obj.User;
					if ('Reply' in com.Passport && com.Passport.Reply) {
						that.Nxs.send(com);
						return;
					}
					that.send(com, reply);

					function reply(err, cmd) {
						if (cmd) {
							com = cmd;
						}
						com.Passport.Reply = true;
						var str = JSON.stringify(com);
						socket.send(str);
					}
				});
			});
		}
	}

	//-------------------------------------------------------Get
	// Process GET request including authentication and
	// validation if required. If anything looks fishy, simply
	// ignore the request to confuse the hackers.
	function Get(that, req, res) {
		console.log('--Get');
		var Par = that.Par;
		var url = req.url;
		if (url.charAt(0) == '/')
			url = url.substr(1);
		if(!Par.Url || url != Par.Url) {
			get();
			return;
		}
		console.log(Par);
		if(!Par.Page) {
			console.log(' **ERR:No page generator provided');
			return;
		}
		let q = {};
		q.Cmd = 'GenPage';
		let gen = Par.Page;
		console.log('Par.Page', gen);
		that.send(q, gen, html);

		function html(err, com) {
			if (err || !('Html' in com)) {
				var err = 'Page <' + url + '> not available';
				console.log('ERR:' + err);
				res.writeHead(404);
				res.end(err);
				return;
			}
			var page = com.Html;
			console.log('Page...\n', JSON.stringify(page, null, 2));
			res.setHeader('Content-Type', 'text/html');
			res.end(page);
		}

		//.................................................authenticate
		function authenticate(next) {
			console.log('..autenticate');
			if(!('Login' in Par)) {
				next();
				return;
			}
			var q = {};
			q.Cmd = 'GenPage';
			console.log(JSON.stringify(q, null, 2));
			that.send(q, Par.Login, html);

			function html(err, q) {
				if(err) {
					next(err);
					return;
				}
				if(!('Html' in q)) {
					next('No HTML');
					return;
				}
				var page = q.Html;
				res.setHeader('Content-Type', 'text/html');
				res.end(page);
			}
		}

		function pau() {
		}

		//.................................................get
		function get() {
			var path = that.Nxs.genPath(url);
			console.log('genPath', url, '->', path);
			fs.readFile(path, done);

			function done(err, data) {
				if (err) {
					console.log(path);
					var err = ' ** File <' + url + '> not available **';
					console.log(err);
					res.writeHead(404);
					res.end(err);
					return;
				}
				var mime;
				var parts = url.split('.');
				if (parts.length > 1) {
					type = parts[parts.length - 1];
					switch (type) {
						case 'html':
							mime = 'text/html';
							break;
						case 'css':
							mime = 'text/css';
							break;
						case 'js':
							mime = 'text/javascript';
							break;
						case 'ico':
							mime = 'image/x-icon';
							break;
						case 'jpg':
							mime = 'image/jpeg';
							break;
						case 'png':
							mime = 'image/png';
							break;
						case 'json':
						case 'map':
							mime = 'application/json';
							break;
					}
				} else {
					var err = ' ** No file <' + url + '> **';
					console.log(err);
					res.writeHead(401);
					res.end(err);
					return;
				}
				if (!mime) {
					var err = ' ** Unknown mime type <' + type + '> **';
					console.log(err);
					res.writeHead(401);
					res.end(err);
					return;
				}
				console.log('..Sending', url, mime);
				res.setHeader('Content-Type', mime);
				res.end(data);
			}
		}

	}

	//-------------------------------------------------------genHtml
	function genHtml(req, res) {
		var url = req.url;
		if (url.charAt(0) == '/')
			url = url.substr(1);
		var pid8 = this.Nxs.getLocal(url);
		if (pid8 != null) {

		}
		var pid = Pid24 + Root.SymTab[url];
		var com = {};
		com.Cmd = 'GenPage';
		getEntity(pid, done);

		function done(err, ent) {
			if (err) {
				console.log(' ** ERR:' + err);
				return;
			}
			ent.dispatch(com, genpage);
		}

		function genpage() {
			if (!('Html' in com)) {
				console.log(' ** ERR:No page created');
				return;
			}
		}
	}

})();
