exports.Auth = (function() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Login: Login
	};

	return {
		dispatch: dispatch
	};

	function authenticate(authData, fun) {
		if (!authData.Username && !authData.Password) {
			fun('No Username or Password', null);
			return;
		}

		__Fs3.readFile(__Config.Users + authData.Username + '.json', function(err, data) {
			if (err) {
				console.log(err);
				fun('Invalid Username', null);
			} else {
				let userData = JSON.parse(data);
				console.log('UserData:', userData);
				console.log('AuthData:', authData);
				if (authData.Password == userData.Password) {
					let q = {};
					q.UserPid = userData.Pid;
					q.Username = authData.Username;
					q.Password = authData.Password;
					fun(null, q);
				} else {
					fun('Invalid Password', null);
				}
			}

		});
	}
})();
