(function LoginView() {

	class LoginView {
		Start(com, fun) {
			this.super(com, (err, cmd) => {

				fun(null, com);
			});
		}
		Setup(com, fun) {
			this.super(com, (err, cmd) => {
				this.Vlt.Name = $(document.createElement('h2'));
				this.Vlt.Email = $(document.createElement('h4'));
				// this.Vlt.
				fun(null, com);
			});
		}

		async ShowLogin(com, fun) {
			await new Promise ((resolve) =>  gapi.load('auth2', _ => resolve()));
			// debugger;
			let cmd = await new Promise (
				(resolve) => 
					this.send({Cmd: 'GetClientCredentials'}, this.Par.Google, (err, cmd) => 
					resolve(cmd)
				)
			);

			log.v('loaded auth2');

			this.Vlt.button = DIV('#google-signin');
			this.Vlt.button.css('width', '240px');
			this.Vlt.button.css('margin', '0px auto');
			this.Vlt.div.append($(`<h1>${this.Par.Text || `Log in or Sign up!`}</h1><hr/>`))
			this.Vlt.div.append(this.Vlt.button);

			gapi.auth2.init({ client_id: cmd.ClientID });

			log.v('init with ' + cmd.ClientID);

			let onSuccess = async (g) => {
				log.v('success');

				if(this.Par.Logout) {
					try {
						gapi.auth2.getAuthInstance().signOut();
						Cookies('xGraph-UserPassport', undefined);
						Cookies('xGraph-Provider', undefined);
						Cookies('xGraph-Email', undefined);
						Cookies('xGraph-DisplayName', undefined);
						Cookies('xGraph-Expires', undefined);
						Cookies('xGraph-Authenticated', undefined);
						Cookies('xGraph-UserPassport', undefined);
					}catch(e) {
						log.v('couldnt sign out google...')
					}
					location.href = this.Par.Redirect;
					return;
				}
				
				let Id = g.getId();
				let token_type = g.getAuthResponse().token_type;
				let token = g.getAuthResponse().id_token;

				// gapi.auth2.getAuthInstance().signOut()
				Cookies('xGraph-UserPassport', `{"IDToken": "${token}", "UserID": "${Id}"}`);
				Cookies('xGraph-Provider', 'google');
				Cookies('xGraph-Email', g.getBasicProfile().getEmail());
				Cookies('xGraph-DisplayName', g.getBasicProfile().getName());
				Cookies('xGraph-Expires', (g.getAuthResponse().expires_at));
				
				// after we log in, try and authenticate a command
				// so we can tell the auth server about us.
				try {
					await this.ascend('AddUser', await this.authenticate({}), this.Par.Server)
					Cookies('xGraph-Authenticated', true); // only truly authenticated once
					// we add ourselves to the database.
				} catch(e) {
					alert(`${e}\n-------------------\nPage should be refreshed.\nIf that doesnt solved the problem, contact support.`);
				}



				location.href = this.Par.Redirect;
				// console.log("Login succeeded");

				// let name = g.get
				// this.Vlt.Name.html('' + Id);

				this.Vlt.div.append(this.Vlt.Name);
				// console.log(Id, token_type, token);
				// this.send({
				// 	Cmd: 'ValidateUser',
				// 	IDToken: token,
				// 	UserID: Id
				// }, this.Par.Server, (err, cmd) => {
				// 	// debugger;
				// });
				// debugger;
			}

			let onFailure = (a, b, c) => {
				debugger;
			}

			this.Vlt.button.css('color', 'initial');
			await new Promise((resolve, reject) => {
				gapi.load('signin2', _ => {
					resolve();
				});
			});
			log.v('loaded signin2');

			gapi.signin2.render('google-signin', {
				'scope': 'profile email',
				'width': 240,
				'height': 50,
				'longtitle': false,
				// 'theme': 'dark',
				'onsuccess': onSuccess,
				'onfailure': onFailure
			});
			this.super({
				Cmd: 'Style',
				Selector: '.abcRioButtonContents > span',
				Rules: {
					color: 'initial'
				}
			}, (err, cmd) => {
				// debugger;
			});
			this.super({
				Cmd: 'Style',
				Selector: '#google-signin',
				Rules: {
					'margin-top': '24px !important'
				}
			}, (err, cmd) => {
				// debugger;
			});
			

			log.v('fin');
			fun(null, com);
		}

		DOMLoaded(com, fun) {
			this.dispatch({Cmd: 'ShowLogin'}, (err, cmd) => {});
			this.super(com, (err, cmd) => {
				fun(null, com);
			});
		}
	}

	return Viewify(LoginView, '3.5');

})();