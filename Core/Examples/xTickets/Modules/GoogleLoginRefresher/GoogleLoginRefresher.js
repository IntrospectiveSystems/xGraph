(function GoogleLoginRefresher() {
	class GoogleLoginRefresher {
		async Setup(com, fun) {
			// debugger;
			let client_id = await new Promise (resolve => {
				this.send({ Cmd: 'GetClientCredentials'}, this.Par.Google, (err, cmd) => {
					resolve(cmd.ClientID);
				});
			});
			await new Promise (resolve => {
				gapi.load('auth2', _ => resolve());
			});
			// debugger;
			await new Promise ((resolve, reject) => {
				gapi.auth2.init({ client_id }).then(_ => {
					resolve();
				}, _ => reject());
			});

			let expire = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().expires_in / 60;
			if(expire < 15) { // if we have less than 15 minutes left
				// alert('')
				// debugger;
			}
			let formatDuration = (ms) => {
				let pre = '';
				if (ms < 0) {
					ms = -ms;
					pre = '-';
				}
				let seconds = Math.floor(ms / 1000);
				let minutes = Math.floor(seconds / 60);
				let hours = Math.floor(minutes / 60);
				let days = Math.floor(hours / 24);
				let weeks = Math.floor(days / 7);
				let years = Math.floor(weeks / 52);

				if (years > 0) return `${pre}${years}y`;
				if (weeks > 3) return `${pre}${weeks}w`;
				if (days > 0) return `${pre}${days}d`;
				if (hours > 0) return `${pre}${hours}h`;
				if (minutes > 0) return `${pre}${minutes}m`;
				if (seconds > 0) return `${pre}${seconds}s`;
			};
			
			let refresh = _ => {
				// debugger;
				// alert('token refreshed');
				let authResponse = gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse()
				// alert(formatDuration(parseInt(Cookies('xGraph-Expires')) - new Date().getTime()) + ' left');
				Cookies('xGraph-UserPassport', JSON.stringify({ IDToken: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token, UserID: gapi.auth2.getAuthInstance().currentUser.get().getId() }));
				//ya woo
				let newExpires = (gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().expires_at);
				if (newExpires == newExpires) Cookies('xGraph-Expires', newExpires);

				let wait = (Cookies('xGraph-Expires') - new Date().getTime()) + 500;
				setTimeout(refresh, wait);
				// alert(`waiting ${formatDuration(wait)}`);
				// setTimeout(refresh, 120000);
			};

			let wait = (Cookies('xGraph-Expires') - new Date().getTime()) + 500;
			setTimeout(refresh, wait);
			// alert(`waiting ${formatDuration(wait)}`);
			// setTimeout(refresh, 120000);


			fun(null, com);
		}
	}

	return { dispatch: GoogleLoginRefresher.prototype };
})();