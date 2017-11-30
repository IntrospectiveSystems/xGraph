//# sourceURL=Plexus.js
(function Plexus() {

	//-----------------------------------------------------dispatch
	// the set of functions that are accessible from the this.send function of an entity
	let dispatch = {
		Setup,
		Publish,
		Subscribe
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------Setup
	function Setup(com, fun) {
		log.v('--Plexus/Setup');

		//set by publish
		this.Vlt.Ports = [];	//the list of taken ports

		//set by publish
		this.Vlt.Servers = {};	//{<channel>:<{	
		//	Name: com.Name,
		//	Host: com.Host,
		//	Port: port}>}

		if (fun)
			fun(null, com);
	}

	//-----------------------------------------------------Publish
	//post address to plexus (get a port assignment)
	function Publish(com, fun) {
		log.v('--Plexus/Publish');
		let Vlt = this.Vlt;
		let port, err = '';

		//check for an error in the request
		if (!('Chan' in com))
			err += 'No channel defined in com (com.Chan) ';
		if (!('Host' in com))
			err += 'No host defined in com (com.Host) ';
		if (com.Chan in Vlt.Servers)
			err += `Server <${com.Chan}> already assigned `;

		if (err) {
			log.e(err);
			fun(err);
			return;
		}

		log.v(Vlt.Ports, "is the set of taken ports");

		//The plexus server should always be set first (during setup) and is given the port 27000
		if (com.Chan == 'Plexus') {
			port = 27000;
		} else {
			//loop through the set of ports to find the next available
			let iport = 27001;
			while (Vlt.Ports.indexOf(iport++) > -1) {
				log.d("Port", iport, " is taken");
				iport++;
			}
			port = iport;
		}

		var srv = {};
		srv.Name = com.Name;
		srv.Host = com.Host;
		srv.Port = port;

		//store the server info
		Vlt.Servers[com.Chan] = srv;
		Vlt.Ports.push(port);

		log.v('Servers', JSON.stringify(Vlt.Servers, null, 2));

		//add port to the reply message
		com.Port = port;
		log.v(com.Chan, 'assigned to port', port);
		
		fun(null, com);
	}

	//-----------------------------------------------------Subscribe
	//get address from plexus
	function Subscribe(com, fun) {
		log.v('--Plexus/Subscribe');
		let err;

		//access the registered server
		if (com.Chan in this.Vlt.Servers) {
			let srv = this.Vlt.Servers[com.Chan];
			com.Host = srv.Host;
			com.Port = srv.Port;
		} else {
			err = `Channel <${com.Chan}> not registered`;
		}

		fun(err||null, com);
	}

})();
