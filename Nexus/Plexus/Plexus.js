(function Proxy() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Publish: Publish,
		Subscribe: Subscribe
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------Setup
	function Setup(com, fun) {
		console.log('--Plexus/Setup');
		var that = this;
		var net = require('net');
		var err;
		var Par = this.Par;
		var Vlt = this.Vlt;
		Vlt.Ports = [];
		Vlt.Servers = {};
		Vlt.Clients = {};
		if(fun)
			fun(null, com);
	}


	//-----------------------------------------------------Publish
	function Publish(com, fun) {
		console.log('--Plexus/Publish');
		var Par = this.Par;
		var Vlt = this.Vlt;
		var err;
		if(!('Chan' in com))
			err = 'No Chan in com';
		if(!('Host' in com))
			err = 'No Host in com';
		// TBD: This should be err after cleanup implemented correctly
		if(com.Chan in Vlt.Servers)
			console.log(' ** ERR"Server <' + com.Chan + '> already assigned');
		if(err) {
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
			return;
		}
		var port;

		console.log(Vlt.Ports, "is the set of taken ports");
		if(com.Chan == 'Plexus') {
			port = 27000;
		} else {
			for(var iport=27001; iport<27099; iport++) {
				console.log("In Loop");
				if(Vlt.Ports.indexOf(iport)>-1){
					console.log("Port" , iport, " is taken");
					continue;
				}
				port = iport;
				break;
			}
		}
		if(!port) {
			err = 'No ports available';
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
			return;
		}
		var srv = {};
		srv.Name = com.Name;
		srv.Chan = com.Chan;
		srv.Host = com.Host;
		srv.Port = port;
		Vlt.Servers[com.Chan] = srv;
		Vlt.Ports.push(port);
		console.log('Servers', JSON.stringify(Vlt.Servers, null, 2));
		com.Port = port;
		console.log(com.Chan, 'assigned to port', port);
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------Publish
	function Subscribe(com, fun) {
		console.log('--Plexus/Subscribe');
		var Par = this.Par;
		var Vlt = this.Vlt;
		if(com.Chan in Vlt.Servers) {
			var srv = Vlt.Servers[com.Chan];
			com.Host = srv.Host;
			com.Port = srv.Port;
			if(fun)
				fun(null, com);
			return;
		}
		if(fun)
			fun(null, com);
	}

})();
