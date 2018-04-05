//# sourceURL=WebViewer.js
(
	/**
	 * The WebViewer entity is the Apex and only entity of the WebViewer Module.
	 * This entity requires its Setup and Start functions to be invoked during the Nexus startup.
	 * This entity starts up an http server and, on connection, a webserver for interfacing a browsers based xGraph
	 * systems to one that is server based. Communication between these two systems is done by the ServerProxy module
	 * on the server and the WebProxy on the browser. Both of these modules interface with the WebViewer programmatically.
	 */
	function WebViewer() {

		// /**
		//  * the set of functions that are accessible from the this.send function of an entity
		//  */
		var dispatch = {
			Setup: Setup,
			Stop: Stop,
			'*': Broadcast
		};

		return {
			dispatch: dispatch
		};

		async function Stop(com, fun) {
			// this.Vlt.sockio.close();
			this.Vlt.server.close();
			delete this.Vlt.sockio;

			log.i('HTTP Server Closed...');

			fun(null, com);
		}

		/**
		 * Setup the required servers and sockets and define all functions that are required to handle browers 
		 * communications
		 * @param {Object} com 
		 * @param {Function} fun 
		 * @return {com}
		 */
		function Setup(com, fun) {
			log.v('--WebViewer/Setup');
			var that = this;
			var http = this.require('http');
			var sockio = this.Vlt.sockio = this.require('socket.io');


			// setTimeout(_ => {
			// 	log.d('restarting');
			// 	this.exit(72);
			// }, 2000);
			
			//Port is set in the Par or defaults to 8080; 
			var port = this.Par.Port || 8080;
			if (!this.Par.ApexList) this.Par.ApexList={};
			var Par = this.Par;
			var Vlt = this.Vlt;

			// Setup the webserver and dispatch requests
			var web = Vlt.server = http.createServer(function (req, res) {
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

			// Load the Scripts.json from the server. These are the scripts required by Nxs (Web version of Nexus).
			function getscripts() {
				that.getFile('scripts.json', function (err, data) {
					if (err) {
						log.e(' ** ERR:Cannot read script.json');
						fun(err);
						return;
					}
					Vlt.Browser.Scripts = data;
					getnxs();
				})
			}

			// Load Nxs.js. The browser side version of Nexus.js
			function getnxs() {
				that.getFile('Nxs.js', function (err, data) {
					if (err) {
						log.e('Cannot read Nxs file');
						return;
					}
					Vlt.Browser.Nxs = data;
					fun();
				});
			}

			// /**
			//  * Define what to do when a websocket is created
			//  * @param {Object} web The application layer of the tcp socket connection
			//  */
			function webSocket(web) {
				let listener = sockio.listen(web);
				let Sockets = Vlt.Sockets || (Vlt.Sockets = {});

				listener.sockets.on('connection', function (socket) {
					let obj = {};
					obj.Socket = socket;
					obj.User = {};
					obj.User.Pid = that.genPid();
					obj.User.Publish = {};
					Sockets[obj.User.Pid] = obj;

					socket.on('disconnect', function () {
						delete Sockets[obj.User.Pid];
					});

					socket.on('error', function (err) {
						delete Sockets[obj.User.Pid];
					});

					socket.on('message', function (msg) {
						let err, com = JSON.parse(msg);

						//Parse the message to see if it was sent with an error
						if (Array.isArray(com))
							[err, com] = com; // deconstruct the array in com, if it is one.

						// make sure a message was sent
						if (!com || !com.Cmd) {
							log.e(' ** onMessage: Invalid message');
							return;
						}

						//are we trying to get a file from the server? Only Nxs.js should be doing this
						if (com.Cmd == 'GetFile') {
							getfile();
							return;
						}

						//are we subscribing to the server
						if (com.Cmd == 'Subscribe') {
							if (!("Link" in com)){
								log.w(`A Browser module tried to subscribe, but a Link (com.Link) was not provided.`);
								return;
							}
							if (!("Pid" in com)){
								log.w(`A Browser module tried to subscribe, but a Pid (com.Pid) was not provided.`);
								return;
							}
							log.v(`${com.Link} subscribed at ${com.Pid}`);
							obj.User.Publish[com.Link] = com.Pid;
							reply(null, com);
							return;
						}

						//Load the appropriate configuration file for the requested browser system
						if (com.Cmd == 'GetConfig') {
							getConfig();
							return;
						}

						//The message came from a module make sure there is a message Passport defined
						if (!('Passport' in com)) {
							log.e('No Passport in routed message');
							return;
						}

						//If this is a reply from a previously sent message call it's stored callback
						if ('Reply' in com.Passport && com.Passport.Reply) {
							if ('messages' in that.Vlt && com.Passport.Pid in that.Vlt.messages) {
								that.Vlt.messages[com.Passport.Pid](err, com);
								return;
							}
							return;
						}

						//We can only send messages to modules in the ApexList of the server;
						if (com.Passport.To in that.Par.ApexList)
							com.Passport.To = that.Par.ApexList[com.Passport.To];
						else {
							reply(`${com.Passport.To} is not a known destination on the server (ApexList key)`);
							return;
						}

						that.send(com, com.Passport.To, reply);

						//Send the reply back to the browser
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
									log.e(err);
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

						// /**
						//  * Load up the config that was requested
						//  * @param {String} com.Path the Name of the requested Configuration file
						//  */
						function getConfig() {
							var path = com.Path;
							let page;
							path = path.charAt(0).toUpperCase() + path.slice(1);

							var cfg = Vlt.Browser;
							cfg.Pid = obj.User.Pid;
							cfg.PidServer = Par.Pid;

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


		/**
		 * Broadcasts to all appropriately subscribed browser side modules.
		 * Only one message is sent per socket (browser xGraph instance) per Broadcast.
		 * @param {Object}		com
		 * @param {String}		com.Forward		the string which identifies to which modules to broadcast to
		 * 											this is stored as the key of Vlt.Sockets[idx].User.Publish
		 * @param {Function}	fun				The callback to be stored until the message returns. Be careful using
		 * 											Multiple browsers as modules typically only expect a single callback.
		 */
		function Broadcast(com, fun) {
			var Vlt = this.Vlt;
			var socks = Vlt.Sockets;
			var keys = Object.keys(socks);

			//iterate over all sockets 
			for (var i = 0; i < keys.length; i++) {
				let obj = socks[keys[i]];
				let sock = obj.Socket;
				let user = obj.User;

				if ('Forward' in com) {
					if (!(com.Forward in user.Publish)){
						err = `Browser destination ${com.Forward} is not defined in a socket`;
						log.w(err);
						fun(err, com);
						continue;
					}
					com.Passport.To = user.Publish[com.Forward];
					if (fun) {
						com.Passport.Disp = 'Query';
						if (!('messages' in this.Vlt)) this.Vlt.messages = {};
						this.Vlt.messages[com.Passport.Pid] = fun;
					}
					var str = JSON.stringify(com);
					sock.send(str);
				} else {
					let err = 'Forward not set -- be sure to use a ServerProxy module to' +
						' communicate with browser side modules';
					log.w(err);
					fun(err, com);
				}
			}
		}



		// /**
		//  * Process GET request If anything looks fishy, simply 
		//  * ignore the request to confuse the hackers.
		//  * Any HTTP Get accessible files should be stored in a ./static/ directory
		//  * @param {Object} that 	The entity context for accessing Par, Vlt, etc
		//  * @param {Object} req 		The request
		//  * @param {Object} res 		The response
		//  */
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

				// /**
				//  * Recursive object search
				//  * @param {Object} ar 		An array of requested files (requested file separated by '/')
				//  * @param {Object} st 		The directory we're searching in 
				//  */
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
				if (url.startsWith(Par.Url))
					ship(null, Par.HTML);
				else {
					res.writeHead(404);
					res.end('Not Found Error');
					return;
				}
			}

			// /**
			//  * Respond to the get request
			//  * @param {String} err 
			//  * @param {String} data 
			//  */
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
