(function GoogleLoginRefresher() {
	class GoogleLoginRefresher {
		async Setup() {
			let client_id = await new Promise (resolve => {
				this.send({Cmd: 'GetCredentials'}, this.Par.Google, (err, cmd) => {
					resolve(cmd.ClientID);
				});
			});
			await new Promise (resolve => {
				gapi.load('auth2', _ => resolve());
			});
			gapi.auth2.init({ client_id });

			let expire = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().expires_in / 60;
			if(expire < 15) { // if we have less than 15 minutes left
				alert('')
			}


		}
	}

	return { dispatch: GoogleLoginRefresher.prototype };
})();



//gapi.load('auth2'); gapi.auth2.init({client_id: '64625955515-8vbvvu1hqve2iq66r11i60h46vtfbq5j.apps.googleusercontent.com'}); gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().expires_in / 60