//# sourceMappingURL="HTTP.js"
(function Http() {
	var fs,async,jszip,path,lodash;

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetModule: GetModule,
		AddRoute,
		'*': Publish
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		log.v('--Http/Setup');
		if(fun)
			fun();
	}

	function Start(com, fun) {
		log.v('--Http/Start');
		var sockio = this.require('socket.io');

		let that = this;
		fs = this.require('fs');
		async = this.require('async');
		jszip = this.require("jszip");
		path = this.require("path");
		lodash = this.require('lodash')
		this.Vlt.SSLRedirect = false;
		let attemptSSL = 'SSL' in this.Par && 'Domain' in this.Par.SSL && 'Email' in this.Par.SSL && 'Port' in this.Par.SSL;
		let server = null;

		let getCertificate = (le) => {
			log.v('attempting to retrieve certificates...')


			let next = (certs) => {
				// log.i('OKAY SOMETHING HAPPENED');
				// Note: you must have a webserver running
				// and expose handlers.getChallenge to it
				// in order to pass validation
				// See letsencrypt-cli and or letsencrypt-express
				// console.error('[Error]: node-letsencrypt/examples/standalone');
				// console.error(err.stack);
				setupHttps();
			}

			                                                            // checks :conf/renewal/:hostname.conf
			le.register({                                               // and either renews or registers
				domains: [this.Par.SSL.Domain],                           // CHANGE TO YOUR DOMAIN
				email: this.Par.SSL.Email,                                // CHANGE TO YOUR EMAIL
				agreeTos: true,                                           // set to true to automatically accept an agreement
				rsaKeySize: 2048                                          // which you have pre-approved (not recommended)
			}).then(next);


		};

		let setupHttp = () => {
			let http = this.require('http');
			
			let LE = this.require('greenlock');
			// var LE = this.require('../');
			let db = {};
	
			let leHttpChallenge = this.require('le-challenge-fs').create({
				webrootPath: path.join(process.cwd(), 'LE/'),                      // or template string such as 
				// debug: true                                            // '/srv/www/:hostname/.well-known/acme-challenge' 
			});
			let leSniChallenge = this.require('le-challenge-sni').create({
				// debug: true
			});
			let leDnsChallenge = this.require('le-challenge-dns').create({
				// debug: true
			});
	
			let config = {
				// server: LE.stagingServerUrl,                               
				server: LE.productionServerUrl,
	
				configDir: 'LE',      // or /etc/letsencrypt or wherever
	
				privkeyPath: 'SSL/privkey.pem',         //
				fullchainPath: 'SSL/fullchain.pem',     // Note: both that :config and
				certPath: 'SSL/cert.pem',               //       will be templated as expected
				chainPath: 'SSL/chain.pem',             //
	
				challenges: {
					'http-01': leHttpChallenge,
					'http-02': leHttpChallenge,
					'tls-sni-01': leSniChallenge,
					'tls-sni-02': leSniChallenge,
					'dns-01': leDnsChallenge,
					'dns-02': leDnsChallenge
				},
	
				rsaKeySize: 2048,
	
				// debug: true
			};
	
			let handlers = {
				setChallenge: function (opts, hostname, key, val, cb) {   // called during the ACME server handshake, before validation
	
					log.i('[SET_CHALLENGE]', opts, hostname, key, val, cb, '\n');
	
	
					db[key] = {
						hostname: hostname,
						key: key,
						val: val
					};
	
					cb(null);
				},
				removeChallenge: function (opts, hostname, key, cb) {     // called after validation on both success and failure
					// db[key] = null;
					cb(null);
				},
				getChallenge: function (opts, hostname, key, cb) {        // this is special because it is called by the webserver
					cb(null, db[key].val);                                  // (see letsencrypt-cli/bin & letsencrypt-express/standalone),
																																	// not by the library itself
				},
				agreeToTerms: function (tosUrl, cb) {                     // gives you an async way to expose the legal agreement
					cb(null, tosUrl);                                       // (terms of use) to your users before accepting
				}
			};
	
			let le = LE.create(config, handlers);
			
			let httpServer = http.createServer(function (req, res) {
				log.v('[HTTP ] ' + req.url);

				if(!req.url.startsWith('.well-known/acme-challenge')) {
					// this probably isnt a challenge....
					if(that.Vlt.SSLRedirect) {
						// upgrade to SSL if we can
						res.writeHead(301, {Location: `https://${req.headers.host}${req.url}`});
					}else {
						// otherwise just handle it
						if (req.method == 'GET')
							Get(that, req, res);
						else (res.writeHead(404), res.end());
					}
				} else {
					//THIS IS A CHALLENGE. ALERT, THIS. IS. NOT. A. DRILL
					le.middleware()(req, res);
					log.v("responded to ACME challenge");
				}
			});
			// log.i(' ** Spider listening on port 8080');
			httpServer.listen(this.Par.Port || 8080);
			log.i(`Created HTTP/1.1 Server`);
			// log.i('WE LISTENIN HTTP');
			if(attemptSSL)
				getCertificate(le);
			else {
				server = httpServer;
				finish();
			}
			
		}

		let setupHttps = () => {
			log.i('\nCertificates Procured, proceeding to HTTPS/1.1 Setup...');
			var https = this.require('https');
	
			var port = this.Par.SSL.Port;
			var Par = this.Par;
			var Vlt = this.Vlt;
			Vlt.Session = this.genPid();

			//TODO renew every 7500000000 ms (2.8 ish months)
			var web = https.createServer({
				key: fs.readFileSync('SSL/privkey.pem'),
				cert: fs.readFileSync('SSL/cert.pem')
				// ca: fs.readFileSync('SSL/chain.pem')
			}, function (req, res) {
				log.i('[HTTPS] ' + req.url)
				
				switch (req.method) {
				case 'POST':
					break;
				case 'GET':
					Get(that, req, res);
					break;
				}
			});
			web.listen(3443);
			server = web;
			finish();
		};

		let finish = () => {
			var Par = this.Par;
			var Vlt = this.Vlt;

			//generate the routing table, pre combining pages within Vlt

			{
				if(!('RoutingTable' in this.Par) ) {
					log.w('No routing Table in Server Par, not starting server...');
					try {
						server.close();
					} catch(e) {
						log.e(e);
					}
				}

				this.Vlt.RoutingTable = {};
				for(let key in this.Par.RoutingTable) {
					if(key in this.Vlt) {
						log.w(`duplicate key in routing table <${key.toLowerCase()}>`)
						continue;
					}
					this.Vlt.RoutingTable[key.toLowerCase()] = this.Par.RoutingTable[key];
				}
			}
			
			webSocket(server);
			getscripts();
			
			function getscripts() {
				that.getFile('scripts.json', function(err, data) {
					if(err) {
						log.i(' ** ERR:Cannot read script.json');
						fun(err, com);
						return;
					}
					Vlt.Scripts = JSON.parse(data.toString());
					getnxs();
				})
			}
	
			function getnxs() {
				that.getFile('Nxs.js', function(err, data) {
					if(err) {
						log.i(' ** ERR:Cannot read Nxs file');
						return;
					}
					Vlt.Nxs = data.toString();
					fun();
				});
			}
	
			//---------------------------------------------------------webSocket
			function webSocket(web) {
				var listener = sockio.listen(web);
				Vlt.Sockets = {};
				var Sockets = Vlt.Sockets;
	
				listener.sockets.on('connection', function (socket) {
					var pidsock = '';
					for(var i=0; i<3; i++)
						pidsock += that.genPid();
					var obj = {};
					obj.Socket = socket;
					obj.User = {};
					obj.User.Pid = '160D25754C01438388CE6A946CD4480C';
					obj.User.Publish = {};
					Sockets[pidsock] = obj;
					let address = socket.handshake.address;
					// console.dir(socket);
	
					socket.on('disconnect', function () {
						// log.i(' >> Socket', pidsock, 'disconnected');
						delete Sockets[pidsock];
					});
	
					socket.on('error', function (err) {
						// log.i(' >> Socket', pidsock, '**ERR:' + err);
						delete Sockets[pidsock];
					});
	
					socket.on('message', async function (msg) {
						// debugger;
						let err, com = JSON.parse(msg);
						if(Array.isArray(com))
							[err, com] = com; // deconstruct the array in com, if it is one.

						// log.i(' |> Http::Msg:' + com.Cmd);
						// log.i(JSON.stringify(com, null, 2));
						if (!com) {
							log.i(' ** onMessage: Invalid message');
							return;
						}
						if(com.Cmd == 'GetFile') {
							getfile();
							return;
						}
						if(com.Cmd == 'Subscribe') {
							obj.User.Publish[com.Link] = com.Pid;
							reply(null, com);
							return;
						}
						if(com.Cmd == 'GetConfig') {
							getConfig();
							return;
						}
						if (!('Passport' in com)) {
							log.i(' ** ERR:No Passport in routed msg');
							return;
						}
	
						// debugger;
						//	com.Passport.User = obj.User;
						if ('Reply' in com.Passport && com.Passport.Reply) {
							if('messages' in that.Vlt && com.Passport.Pid in that.Vlt.messages) {
								that.Vlt.messages[com.Passport.Pid](err, com);
								return;
							}
							return;
						}
						if(com.Passport.To in that.Par.ApexList) com.Passport.To = that.Par.ApexList[com.Passport.To];
						else {
							reply(`${com.Passport.To} is not a known destination on the server.`);
							log.e(`${com.Passport.To} is not a known destination on the server.`);
							return;
						}
						
						
						if('Authentication' in com.Passport) {
							//if there is an authentication passport
							com.Passport.Authentication.Valid = false;
							// actually do validation here

							if(com.Passport.Authentication.Provider in (that.Par.Providers || [])) {
								// com.Passport.Authentication.DisplayName = 'Fake McFakerson';
								// okay so we have a provider, so lets unpack our validation passport.
								let User = JSON.parse(com.Passport.Authentication.Passport);
								let provider = that.Par.Providers[com.Passport.Authentication.Provider];
								let auth = await new Promise((resolve, reject) => {
									that.send({
										Cmd: 'ValidateUser',
										User
									}, provider, (err, cmd) => {
										if('Refresh' in com&& com.Refresh > 0) {
											// oh man, we need to refresh our login information.
										}
										resolve({valid: !err, DisplayName: cmd.DisplayName, Email: cmd.Email});
									});
								});
								com.Passport.Authentication.Valid = auth.valid;
							}

						}
						that.send(com, com.Passport.To, reply);
	
						async function reply(err, cmd) {
							// if(com.Passport.To == "10F9140BC9754B1DB92D26EE53CBEC96") debugger;
							if (cmd) {
								com = cmd;
							}


							// -------------------------- Pid interchange
							if(com.PidInterchange) {
								com = await recurse(com);

								async function recurse(obj) {
									if('Format' in obj 
										&& 'Value' in obj
										&& typeof obj.Value == 'string'
										&& obj.Value.match(/^[A-Z0-9]{32}$/) != null
										&& obj.Format == 'is.xgraph.pid') {
										let pid = obj.Value;
										let Tag = await new Promise(resolve => {
											that.send({
												Cmd: 'AddRoute',
												Pid: pid
											}, that.Par.Pid, (err, cmd) => {
												if('Tag' in cmd) resolve(cmd.Tag);
												else {
													log.w(err);
													resolve('noooooooope');
												}
											});
										});
										obj.Value = Tag;
										obj.Format = 'is.xgraph.webproxytag';
										log.i(`${pid} -> ${Tag}`);
										return obj;
									}
									for(let key in obj) {
										if(typeof obj[key] == 'object')
											obj[key] = await recurse(obj[key]);
									}
									return obj;
								}
							}




							com.Passport.Reply = true;
							var str = JSON.stringify([err, com]);
							socket.send(str);
						}
						
						
						function getConfig() {
							log.v(`${address} => ${com.Path}`);

							let cfg = {
								Nxs: that.Vlt.Nxs,
								Pid: obj.User.Pid,
								PidServer: that.Par.Pid,
								// ApexList: that.Par.ApexList,
								Scripts: Vlt.Scripts
							}

							if (com.Path.toLowerCase() in that.Vlt.RoutingTable)
								for (let key in that.Vlt.RoutingTable[com.Path.toLowerCase()])
									cfg[key] = that.Vlt.RoutingTable[com.Path.toLowerCase()][key];
							else {
								cfg.Error = 404;
							}

							socket.send(JSON.stringify(cfg, null, 2));
						}
	
						//.....................................getfile
						/// Read file from local directory
						function getfile() {
							var path = com.File;
							that.getFile(path, function(err, data) {
								if(err) {
									log.i(' ** ERR', err);
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
					});
				});
			}
		};
		
		setupHttp();

	}

	async function AddRoute(com, fun) {
		let tag;

		//hey. bad.
		if('Tag' in com) log.w('Passing Tag to Addroute is deprecated. Tag is autogenerated and passed back.');
		

		//do we already have this route?
		let duplicate = (lodash.findKey(this.Par.ApexList, lodash.partial(lodash.isEqual, com.Pid)));
		if(duplicate) {
			tag = duplicate;
		}else {
			tag = "";
			for(let i = 0; i < 128; i ++) tag += 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890+=-_,<.>/?;:!@#$%^&*()[]{}'.charAt(((Math.random() * 10e6)%1)*58);
		}
		
		log.v(`converted <${com.Pid}> to ${tag}`)
		this.Par.ApexList[tag] = com.Pid;
		com.Tag = tag;

		this.save(_ => fun(null, com));
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

			if ('Forward' in com) {
				com.Passport.To = user.Publish[com.Forward];
				if (fun) {
					com.Passport.Disp = 'Query';
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
	// validation if Prequired. If anything looks fishy, simply
	// ignore the request to confuse the hackers.
	function Get(that, req, res) {
		let type = 'text/html';

		if(req.url == '/manifest.json' && 'Manifest' in that.Par) {
			res.writeHead(200); 
			res.end(JSON.stringify(that.Par.Manifest, null, 2));
			return;
		}

		if(req.url.split('.').length > 1) {
			let arr = req.url.split('/');
			arr = arr.slice(1);


			let store = that.Par.Static || {};

			return ship(...subSearch(arr, store));

			function subSearch(ar, st) {
				log.v(arr.join(', '));
				if (ar[0] in st) {
					if (ar.length == 1){
						switch(ar[0].substr(ar[0].lastIndexOf('.') + 1)) {
							case 'css': type = '	text/css'; break;
							default: /* no */ break;
						}
						return [null, st[ar[0]]];
					}
					else {
						return subSearch(arr.slice(1), st[ar[0]]);
					}
				}else{
					let err = `${req.url} does not exist in Par.Static`;
					log.w(err);
					return [err];
				}
			}
		}

		ship(...('HTML' in that.Par ? [null, that.Par.HTML] : ['HTML not in MultipageServer Par', null]))

		function ship(err, data) {
			if(err) {
				res.writeHead(404);
				res.end(JSON.stringify(err));
				return;
			}
			var page = data.toString();

			// log.v(`shipping ${path}`);
			res.setHeader('Content-Type', type);
			res.end(page);
		}
	}

	//-----------------------------------------------------getModule
	// Retrieve module from module server
	// For now is retrieved from local file system
	function GetModule(com, fun) {
		// log.i('--Http/GetModule', com.Module);
		//log.i(JSON.stringify(com));
		var that = this;
		var zip = new jszip();
		//var dir = that.genPath(com.Module);
		var man = [];
		this.getModule(com.Module, function(err, mod) {
			if(err) {
				log.i(' ** ERR:Cannot read module directory');
				if(fun)
					fun('Cannot read module directlry');
				return;
			}
			
			var str = JSON.stringify(mod);
			//log.i("mod is ", Object.keys(mod));
			zip.file('module.json', str);
			man.push('module.json');
			zip.file('manifest.json', JSON.stringify(man));
			zip.generateAsync({type:'base64'}).then(function(data) {
				com.Zip = data;
				fun(null, com);
			});
		});
	}

})();
