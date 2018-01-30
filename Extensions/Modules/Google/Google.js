(function Google() {
	class Google {
		GetClientCredentials(com, fun) {
			com.ClientID = this.Par.ClientID;
			com.ClientSecret = this.Par.ClientSecret;
			fun(null, com);
		}
	}

	return { dispatch: Google.prototype }
})();