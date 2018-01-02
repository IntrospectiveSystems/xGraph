// #sourceURL=Authentication.js
(function Authentication() {
	
		let nedb,async, md5; 
		// let 
	
		class Authentication {
			Setup(com, fun) {
				nedb = this.require('nedb');
				async = this.require('async');
				md5 = this.require('md5');
				this.Vlt.Users = new nedb({filename: 'Users.nedb'});
				this.Vlt.Users.loadDatabase((err) => {
					console.log('Users Database Loaded');
					fun(null, com);
				});
			}

			async Start(com, fun) {

				this.send({
					Cmd: 'GetClientCredentials'
				}, this.Par.Google, (err, cmd) => {
					
					fun(null, com);
				});
			}
	
			/// com.IDToken
			/// com.UserID
			/// 
			/// out:
			/// com.Valid
			ValidateUser(com, fun) {
				// first, verify against google.
				let token = com.IDToken;
				let CLIENT_ID = this.Par.ClientID;

				console.log(" |> Authentication::ValidateUser");
	
				// debugger;
				let GoogleAuth = this.require('google-auth-library');
				let auth = new GoogleAuth;
				let client = new auth.OAuth2(CLIENT_ID, '', '');
				client.verifyIdToken(token, CLIENT_ID, (e, login) => {
					// console.log(`ERROR?!?!?!?!?!? "${e}"`);
					if(e) {
						let needsRefresh = e.message.startsWith("Token used too late");
						if(true) {

							console.log(token.substr(0, 11) + " + " + com.UserID.substr(0, 10));
							console.log("Maybe Valid, Token needs to refresh, try again...");

							// console.log('setting refresh...');
							com.Refresh = 'Refresh' in com ? com.Refresh + 1 : 1;
							// console.log('setting error...');
							com.Err = 'refresh auto';
							// console.log(JSON.stringify(com, null, 2));
							// console.log('calling back...');
							fun('refresh auth', com);
						}

						return;
					}
					let payload = login.getPayload();
					let userid = payload.sub;
					let name = payload.name;
					let email = payload.email;
					
					//IDToken in, UserID out. userIDs match, we should be good to go,
					//because only a user will know both their ID and their current token.
					if(userid != com.UserID) {
						com.Valid = false;
						console.log(name, "=> Imposter!!");
						console.log(userid + " != " + com.UserID);
						fun('INVALID ID TOKEN OR USER ID', com);
						return;
					}

					console.log(name, "=> Authenticated!");
					
					//look up the user, now that we've validated them with googleTwitterReport
					this.Vlt.Users.find({
						userid: userid
					}, (err, docs) => {
						//if they arent in the system
						if(docs.length == 0) {
							createUser(userid, email, name);
							return;
						} else if(docs.length == 1) {
							com._id = docs[0]._id;
							com.Valid = true;
							fun(null, com);
						}
					});
				});
	
				let createUser = (userid, email, name) => {
					console.log("User does not exist yet...");
					let Pids = {};
					
					async.each(this.Par.LinkedModules, (item, next) => {
						console.log("Creating Linked " + item.Key);
						//create Linked Entities
						let par = {
							Module: item.Module,
							Par: item.Par
						};
						par.Par.User = userid;
						this.genModule(par, (err, apex) => {
							Pids[item.Key] = apex;
							console.log(item.Key + " => " + apex);
							next();
						});
					}, (err, cmd) => {
						let user = {
							userid: userid,
							email: email,
							name: name,
							search: `${name.toUpperCase()} ${email.toUpperCase()}`
						};
						
						for(let key in Pids) {
							user[key] = Pids[key];
						}
						// debugger;
						this.Vlt.Users.find({
							userid: userid
						}, (err, docs) => {
							if(docs.length == 0) {
								this.Vlt.Users.insert(user, (err, doc) => {
									com._id = doc._id;
									com.Valid = true;
									fun(null, com);
								});
							} else if(docs.length == 1) {
								com._id = docs[0]._id;
								com.Valid = true;
								fun(null, com);
							}
						});
					});
				};
			}
	
			GetUserDetails(com, fun) {
				let Id = com.UserID;

				this.Vlt.Users.find({
					userid: Id
				}, (err, docs) => {
					if(docs.length == 0) {
						fun('User not Found', com);
					} else if(docs.length == 1) {
						com.Email = docs[0].email;
						com.Name = docs[0].name;
						com.ProfilePicture = `https://www.gravatar.com/avatar/${md5(docs[0].email.toLowerCase()).toLowerCase()}`
						fun(null, com);
					}
				});
			}

			SaveData(com, fun) {
				this.send({Cmd: 'ValidateUser'}, this.Par.Pid, (err, cmd) => {
					
				});
			}
	
			GetClientCredentials(com, fun) {
				com.ClientID = this.Par.ClientID;
				com.ClientSecret = this.Par.ClientSecret;
				fun(null, com);
			}

			// this will search for a key in database and return a pid
			// com.Module in, com.Module out
			GetLinkedModule(com, fun) {

				console.log(" |> Authentication::GetLinkedModule ", com.Module);
				//first validate the user is real.
				this.send({
					Cmd: 'ValidateUser',
					UserID: com.UserID,
					IDToken: com.IDToken
				}, this.Par.Pid, (err, cmd) => {
					if(err) {
						if('Refresh' in cmd) {
							com.Refresh = cmd.Refresh;
							com.Err = err;
							console.log("returning thingy");
						}
						return fun(err, com);
					}
					// console.log("Valid?", cmd.Valid);
					if(cmd.Valid && !err) {
						//no error and the user checks out
						this.Vlt.Users.find({
							userid: com.UserID
						}, (err, docs) => {
							if(docs.length == 1 && com.Module in docs[0]) {
								console.log("Returning Linked " + com.Module + " => " + docs[0][com.Module]);
								com.Module = docs[0][com.Module];
								fun(null, com);
							} else {
								fun('what', com);
							}
						});
					}else {
						fun('no', com);
					}
				});
			}

			SearchUsers(com, fun) {

				// this.Vlt.Users.find({name: })

				com.Users = [];
				console.log('com.Search', com.Search);
				this.Vlt.Users.find({
					search: {
						$regex: new RegExp(`.*${com.Search.toUpperCase()}.*`)
					}
				}, (err, docs) => { // find all users for now
					if(err) return fun(err, com);
					for(let i = 0; i < docs.length; i ++)
						com.Users.push({
							UserID: docs[i].userid,
							Email: docs[i].email,
							Name: docs[i].name
						});
					return fun(null, com);
				});
			}
		}
	
		return { dispatch: Authentication.prototype };
	
	})();