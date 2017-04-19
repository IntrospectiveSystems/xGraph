(function Proxy() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		"*":Proxy
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Proxy/Setup');
		var q = {};
		q.Cmd = 'GetGlobal';
		q.Symbol = this.Par.Proxy;
		this.send(q, '$Host', done);

		function done(err, q) {
			if(err) {
				console.log(' ** ERR:' + err);
				if(fun) {
					fun('Cannot retrieve Global value');
				}
				return;
			}
			console.log('Proxy reply', JSON.stringify(q, null, 2));
			if(fun)
				fun(null, q);
		}
	}

	function Start(com, fun) {
		console.log('--Proxy/Start');
		if(fun)
			fun(null, com);
	}

	function Proxy(com, fun) {
		console.log('--Proxy/Proxy', com.Cmd);
		if(fun)
			fun(null, com);
	}

})();
