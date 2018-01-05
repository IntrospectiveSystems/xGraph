(function CommandAuthenticator() {
	class CommandAuthenticator {
		AuthCommand(com, fun) {
			com.Passport.User = {
				_id: Cookies('xGraph-Id'),
				DisplayName: Cookies('DisplayName'),
				Email: Cookies('Email'),
				Provider: Cookies('Provider'),
				Passport: Cookies('UserPassport')
			};
			fun(null, com);
		}
	}
})();