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
					log.i('Users Database Loaded');
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
	
			AddUser(com, fun) {

				let createUser = (userid, email, name) => {
					log.v("User does not exist yet...");
					let Pids = {};

					async.each(this.Par.LinkedModules, (item, next) => {
						log.v("Creating Linked " + item.Key);
						//create Linked Entities
						let par = {
							Module: item.Module,
							Par: item.Par
						};
						par.Par.User = userid;
						this.genModule(par, (err, apex) => {
							Pids[item.Key] = apex;
							log.v(item.Key + " => " + apex);
							next();
						});
					}, (err, cmd) => {
						let user = {
							userid: userid,
							email: email,
							name: name,
							search: `${name.toUpperCase()} ${email.toUpperCase()}`
						};

						for (let key in Pids) {
							user[key] = Pids[key];
						}
						// debugger;
						this.Vlt.Users.find({
							userid: userid
						}, (err, docs) => {
							if (docs.length == 0) {
								this.Vlt.Users.insert(user, (err, doc) => {
									com._id = doc._id;
									com.Valid = true;
									fun(null, com);
								});
							} else if (docs.length == 1) {
								com._id = docs[0]._id;
								com.Valid = true;
								fun(null, com);
							}
						});
					});
				};

				if ('Authentication' in com.Passport && com.Passport.Authentication.Valid) {
					let email = com.Passport.Authentication.Email;
					let displayName = com.Passport.Authentication.DisplayName;
					createUser(this.genPid(), email, displayName);
				} else {
					log.w("Unauthenticated AddUserCall");
					log.v(JSON.stringify(com, null, 2));
					// log.v()
				}

				fun(null, com);
			}

			GetClientCredentials(com, fun) {
				com.ClientID = this.Par.ClientID;
				com.ClientSecret = this.Par.ClientSecret;
				fun(null, com);
			}

			// this will search for a key in database and return a pid
			// com.Module in, com.Module out
			GetLinkedModule(com, fun) {

				log.v(" |> Authentication::GetLinkedModule ", com.Module);
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
							log.v("returning thingy");
						}
						return fun(err, com);
					}
					// log.v("Valid?", cmd.Valid);
					if(cmd.Valid && !err) {
						//no error and the user checks out
						this.Vlt.Users.find({
							userid: com.UserID
						}, (err, docs) => {
							if(docs.length == 1 && com.Module in docs[0]) {
								log.v("Returning Linked " + com.Module + " => " + docs[0][com.Module]);
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
				log.v('com.Search', com.Search);
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