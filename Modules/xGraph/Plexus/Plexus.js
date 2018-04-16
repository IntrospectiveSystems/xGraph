//# sourceURL=Plexus.js
(
	/**
	 * The Plexus entity is the Apex and only entity of the Plexus Module.
	 * This entity requires its Setup function invoked during the Setup phase of Nexus startup.
	 * The main capability of this entity is to act as a dynamic router that not only routes connections, but
	 * assigns the port to servers requesting publication.
	 */
	function Plexus() {

		// the set of functions that are accessible from the this.send function of an entity
		let dispatch = {
			Setup,
			Publish,
			Subscribe
		};

		return {
			dispatch: dispatch
		};

		/**
		 * Setup the required vault variables
		 * @param {Object} com 
		 * @param {Function} fun 
		 * @return {com}
		 */
		//Setup will be depricated in version 2.0
		function Setup(com, fun) {
			log.v('--Plexus/Setup');

			//set by publish
			if ((!this.Vlt.Ports))
				this.Vlt.Ports = [];	
			//the list of taken ports

			//set by publish
			if (!(this.Vlt.Servers))
				this.Vlt.Servers = {};
			//	{<channel>:<{	
			//		Host: com.Host,
			//		Port: port}>}

			fun(null, com);
		}

		/**
			* Publish a Proxy (server) to the Plexus
		 * @param {Object}	com
		 * @param {String}	com.Chan	the channel that the server will be supporting
		 * @param {String}	com.Host	the host that the server will be listening on
		 * @param {Function} fun			(err, com) 
		 * @return {com.Port}					the port that the server shall listen at
			*/
		function Publish(com, fun) {
			log.v('--Plexus/Publish');
			let Vlt = this.Vlt;
			let port, err = '';

			if (!(Vlt.Ports)) Vlt.Ports = [];
			if (!(Vlt.Servers)) Vlt.Servers = {};

			//check for an error in the request
			if (!('Chan' in com))
				err += 'No channel defined in com (com.Chan) ';
			if (!('Host' in com))
				err += 'No host defined in com (com.Host) ';
			if (com.Chan in Vlt.Servers)
				err += `Server <${com.Chan}> already assigned `;

			if (err) {
				log.e(err);
				fun(err, com);
				return;
			}

			log.v(JSON.stringify(Vlt.Ports, null, 2), "is the set of taken ports");

			//The plexus server should always be set first (during setup) and is given the port 27000
			if (com.Chan == 'Plexus') {
				port = 27000;
			} else {
				//loop through the set of ports to find the next available
				let iport = 27001;
				while (Vlt.Ports.indexOf(iport) > -1) {
					log.v("Port", iport, " is taken");
					iport++;
				}
				port = iport;
			}

			var srv = {};
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

		/**
		 * A Proxy (client) can request the data of a Proxy server
		 * @param {Object}	com
		 * @param {String}	com.Chan	the channel that the client will be connecting to
		 * @param {Function} fun (err, com) 	
		 * @return {com.Host}		The host for the client to connect on
		 * @return {com.Port}		The port for the client to connet to
		 */
		function Subscribe(com, fun) {
			log.v('--Plexus/Subscribe');
			let err;

			//access the registered server
			if (this.Vlt.Servers && (com.Chan in this.Vlt.Servers)) {
				let srv = this.Vlt.Servers[com.Chan];
				com.Host = srv.Host;
				com.Port = srv.Port;
			} else {
				err = `Channel <${com.Chan}> not registered`;
			}

			fun(err || null, com);
		}

	})();
