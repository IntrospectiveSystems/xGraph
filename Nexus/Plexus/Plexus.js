(function Proxy() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		Publish: Publish,
		Subscribe: Subscribe
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------Setup
	function Setup(com, fun) {
		console.log('--Proxy/Setup');
		var that = this;
		var net = require('net');
		var err;
		var Par = this.Par;
		var Vlt = this.Vlt;
		Vlt.Ports = [];
		Vlt.Servers = {};
		if(fun)
			fun(null, com);
	}

	//.....................................................Start
	function Start(com, fun) {
		console.log('--Proxy/Start');
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------Publish
	function Publish(com, fun) {
		//	console.log('--Plexus/Publish);
		var Par = this.Par;
		var Vlt = this.Vlt;
		var err;
		if(!('Name' in com))
			err = 'No Name in com';
		if(!('Host' in com))
			err = 'No Host in com';
		// TBD: This should be err after cleanup implemented correctly
		if(com.Name in Servers)
			console.log(' ** ERR"Server <' + com.Name + '> already assigned');
		if(err) {
			if(fun)
				fun(err);
			return;
		}
		var port;
		for(var iport=27001; iport<27099; iport++) {
			if(iport in Vlt.Ports)
				continue;
			port = iport;
			break;
		}
		if(!port) {
			err = 'No ports available';
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
			return;
		}
		var srv = {};
		srv.Host = com.Host;
		srv.Port = port;
		Vlt.Servers[com.Name] = srv;
		Vlt.Ports.push(port);
		com.Port = port;
		console.log(com.Name, 'assigned to port', port);
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------Publish
	function Subscribe(com, fun) {
		//	console.log('--Plexus/Publish);
		var Par = this.Par;
		var Vlt = this.Vlt;
		if(fun)
			fun(null, com);
	}

})();
