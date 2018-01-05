(function CommandAuthenticator() {
	class CommandAuthenticator {
		Authenticate(com, fun) {
			com.Passport.Authentication = {
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