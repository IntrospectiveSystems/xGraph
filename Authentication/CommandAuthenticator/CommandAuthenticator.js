(function CommandAuthenticator() {
	class CommandAuthenticator {
		Setup(com, fun) {
			window.CommandAuthenticator = this.Par.Pid;
			fun(null, com);
		}
		Authenticate(com, fun) {
			com.Command.Passport = com.Command.Passport || {}
			com.Command.Passport.Authentication = {
				_id: Cookies('xGraph-Id'),
				DisplayName: Cookies('xGraph-DisplayName'),
				Email: Cookies('xGraph-Email'),
				Provider: Cookies('xGraph-Provider'),
				Passport: Cookies('xGraph-UserPassport')
			};
			fun(null, com);
		}
	}

	return {dispatch: CommandAuthenticator.prototype };
})();