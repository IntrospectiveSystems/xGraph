(function Http() {
	var fs = require('fs');
	var async = require('async');
	var jszip = require("jszip");

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetModule: GetModule
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
		var fs = require('fs');
		var http = require('http');
		var sockio = require('socket.io');
		var port;
		var Par = this.Par;
		var Vlt = this.Vlt;
		console.log('Module', Par.Module);
		Vlt.Session = this.Nxs.genPid();
		if ('Port' in this.Par)
			port = this.Par.Port;
		else
			port = 80;
		var web = http.createServer(function (req, res) {
			console.log(req.method + ':' + req.url);
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
		fs.readFile('browser.json', function(err, data) {
			if(err) {
				console.log(' ** ERR::Cannot read browser config');
				fun(err);
				return;
			}
			Vlt.Browser = JSON.parse(data.toString());
			getscr();
		});

		function getscr() {
			fs.readFile('scripts.json', function(err, data) {
				if(err) {
					console.log(' ** ERR:Cannot read script.json');
					fun(err);
					return;
				}
				Vlt.Browser.Scripts = JSON.parse(data.toString());
				getnxs();
			})
		}

		function getnxs() {
		//	var path = genPath(Par.Nxs);
			var path = genPath(Par.Module + '/Nxs.js');
			console.log('Nxs path', path);
			fs.readFile(path, function(err, data) {
				if(err) {
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
				console.log('sock/connection');
				var pidsock = ''
				for(var i=0; i<3; i++)
					pidsock += that.Nxs.genPid().substr(24);
				var obj = {};
				obj.Socket = socket;
				obj.User = {};
				obj.User.Pid = '160D25754C01438388CE6A946CD4480C';
				Sockets[pidsock] = obj;

				var cfg = Vlt.Browser;
				cfg.Pid24 = pidsock;
				cfg.PidServer = Par.Pid;
				if('Apex' in Par)
					cfg.Apex = Par.Apex;
				var str = JSON.stringify(cfg);
				socket.send(str);

				socket.on('disconnect', function () {
					console.log(' >> Socket', pidsock, 'disconnected');
					delete Sockets[pidsock];
				});

				socket.on('error', function (err) {
					console.log(' >> Socket', pidsock, '**ERR:' + err);
					delete Sockets[pidsock];
				});

				socket.on('message', function (msg) {
					var com = JSON.parse(msg);
					console.log('>>Msg:' + com.Cmd);
					console.log(com);
					if (!com) {
						console.log(' ** onMessage: Invalid message');
						return;
					}
					if(com.Cmd == 'GetFile') {
						getfile();
						return;
					}
					if (!('Passport' in com)) {
						console.log(' ** ERR:No Passport in routed msg');
						return;
					}

					com.Passport.User = obj.User;
					if ('Reply' in com.Passport && com.Passport.Reply) {
						that.Nxs.send(com, com.Passport.To);
						return;
					}
					that.send(com, com.Passport.To, reply);

					function reply(err, cmd) {
						if (cmd) {
							com = cmd;
						}
						com.Passport.Reply = true;
						var str = JSON.stringify(com);
						console.log('####Send:' + str.length);
						socket.send(str);
					}

					//.....................................getfile
					/// Read file from local directory
					function getfile() {
						var path = com.File;
						fs.readFile(path, function(err, data) {
							if(err) {
								console.log(' ** ERR', err);
								return;
							}
							com.Data = data.toString('utf8');
							var str = com.Data;
							if('Passport' in com)
								com.Passport.Reply = true;
							var str = JSON.stringify(com);
							socket.send(str);
						});
					}

					//-----------------------------------------------------getModule
					// Retrieve module from module server
					// For now is retrieved from local file system
					function getodule(com, fun) {
						console.log('--Page/getModule');
						console.log(JSON.stringify(com));
						var that = this;
						var zip = new jszip();
						var dir = that.Nxs.genPath(com.Module);
						var man = [];
						console.log('dir', dir);
						fs.readdir(dir, function(err, files) {
							if(err) {
								console.log(' ** ERR:Cannot read module directory');
								if(fun)
									fun('Cannot read module directlry');
								return;
							}
							async.eachSeries(files, build, ship);
						})

						function build(file, func) {
							var path = dir + '/' + file;
							fs.readFile(path, add);

							function add(err, data) {
								var str = data.toString();
								zip.file(file, str);
								man.push(file);
								func();
							}
						}

						function ship() {
							zip.file('manifest.json', JSON.stringify(man));
							zip.generateAsync({type:'base64'}).then(function(data) {
								com.Zip = data;
								fun(null, com);
							});
						}
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
		console.log('--Get', req.url);
		var fs = require('fs');
		var Par = that.Par;
		var url = req.url;
		if (url.charAt(0) == '/')
			url = url.substr(1);
		var path = './' + url + '.html';
		console.log('path', path);
		fs.exists(path, html);

		function html(yes) {
			console.log('..html', yes);
			if(!yes) {
				res.writeHead(404);
				res.end('You are out of your verbial guord');
				return;
			}
			fs.readFile(path, ship);
		}

		function ship(err, data) {
			if(err) {
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
		console.log('--Page/getModule');
		console.log(JSON.stringify(com));
		var that = this;
		var zip = new jszip();
		var dir = that.Nxs.genPath(com.Module);
		var man = [];
		console.log('dir', dir);
		fs.readdir(dir, function(err, files) {
			if(err) {
				console.log(' ** ERR:Cannot read module directory');
				if(fun)
					fun('Cannot read module directlry');
				return;
			}
			async.eachSeries(files, build, ship);
		})

		function build(file, func) {
			var path = dir + '/' + file;
			fs.readFile(path, add);

			function add(err, data) {
				var str = data.toString();
				zip.file(file, str);
				man.push(file);
				func();
			}
		}

		function ship() {
			zip.file('manifest.json', JSON.stringify(man));
			zip.generateAsync({type:'base64'}).then(function(data) {
				com.Zip = data;
				fun(null, com);
			});
		}
	}

})();
