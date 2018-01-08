// #sourceURL=GoogleLoginProvider.js
(function GoogleLoginProvider() {
	
		let nedb,async, md5; 
		// let 
	
		class GoogleLoginProvider {
			
			async ValidateUser(com, fun) {
				// first, verify against google.
				log.d('-----------------------\n' + JSON.stringify(com, null, 2));
				let token = com.User.IDToken;
				let CLIENT_ID = this.Par.ClientID;

				log.v(" |> GoogleLoginProvider::ValidateUser");
				
				// debugger;
				let GoogleAuth = this.require('google-auth-library');
				let auth = new GoogleAuth;
				let client = new auth.OAuth2(CLIENT_ID, '', '');
				client.verifyIdToken(token, CLIENT_ID, (e, login) => {
					// log.v(`ERROR?!?!?!?!?!? "${e}"`);
					if(e) {
						let needsRefresh = e.message.startsWith("Token used too late");
						if(true) {

							log.v(token.substr(0, 11) + " + " + com.User.UserID.substr(0, 10));
							log.v("Maybe Valid, Token needs to refresh, try again...");

							// log.v('setting refresh...');
							com.Refresh = 'Refresh' in com ? com.Refresh + 1 : 1;
							// log.v('setting error...');
							com.Err = 'refresh auto';
							// log.v(JSON.stringify(com, null, 2));
							// log.v('calling back...');
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
					if (userid != com.User.UserID) {
						com.Valid = false;
						log.v(name, "=> Imposter!!");
						log.v(userid + " != " + com.User.UserID);
						fun('INVALID ID TOKEN OR USER ID', com);
						return;
					}

					log.v(name, "=> Authenticated!");
					fun(null, com);
					
				});



				/// -------------------------------------------------------------
				// this.Vlt.Users.find({
				// 	userid: userid
				// }, (err, docs) => {
				// 	//if they arent in the system
				// 	if (docs.length == 0) {
				// 		createUser(userid, email, name);
				// 		return;
				// 	} else if (docs.length == 1) {
				// 		com._id = docs[0]._id;
				// 		com.Valid = true;
				// 		fun(null, com);
				// 	}
				// });
				// let createUser = (userid, email, name) => {
				// 	log.v("User does not exist yet...");
				// 	let Pids = {};
					
				// 	async.each(this.Par.LinkedModules, (item, next) => {
				// 		log.v("Creating Linked " + item.Key);
				// 		//create Linked Entities
				// 		let par = {
				// 			Module: item.Module,
				// 			Par: item.Par
				// 		};
				// 		par.Par.User = userid;
				// 		this.genModule(par, (err, apex) => {
				// 			Pids[item.Key] = apex;
				// 			log.v(item.Key + " => " + apex);
				// 			next();
				// 		});
				// 	}, (err, cmd) => {
				// 		let user = {
				// 			userid: userid,
				// 			email: email,
				// 			name: name,
				// 			search: `${name.toUpperCase()} ${email.toUpperCase()}`
				// 		};
						
				// 		for(let key in Pids) {
				// 			user[key] = Pids[key];
				// 		}
				// 		// debugger;
				// 		this.Vlt.Users.find({
				// 			userid: userid
				// 		}, (err, docs) => {
				// 			if(docs.length == 0) {
				// 				this.Vlt.Users.insert(user, (err, doc) => {
				// 					com._id = doc._id;
				// 					com.Valid = true;
				// 					fun(null, com);
				// 				});
				// 			} else if(docs.length == 1) {
				// 				com._id = docs[0]._id;
				// 				com.Valid = true;
				// 				fun(null, com);
				// 			}
				// 		});
				// 	});
				// };
			}
		}
	
		return { dispatch: GoogleLoginProvider.prototype };
	
	})();