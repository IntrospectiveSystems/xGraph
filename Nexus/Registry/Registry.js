(function Registry() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup:Setup,
		Start,Start,
		PostAddress:PostAddress,
		GetAddress:GetAddress
	};


	return {
		dispatch: dispatch
	};


	function Setup(com, fun) {
		console.log('--Registry/Setup');
		let Vlt = this.Vlt;

		Vlt.Registry={};
		Vlt.Waiting={};

		
		if(fun)
			fun(null, com);
	}

	function Start(com, fun) {
		console.log('--Registry/Start');
		if(fun)
			fun(null, com);
	}



	function PostAddress(com, fun) {
		console.log('--Registry/PostAddress', com.Name);
		let Vlt=this.Vlt;
		let err = null;

		if (com.Name in Vlt.Registry){
			err = "Registry warning = = = About to overwrite an address";
			console.log("Registry warning = = = About to overwrite an address");
		}

		if ("Address" in com) {
			if ("Host" in com.Address &&  "Port" in com.Address) {
				Vlt.Registry[com.Name]= {"Host": com.Address.Host, "Port": com.Address.Port};
			} else {
				err = "Missing required address parameters";
			}
		} else {
			console.log("we will assign a port on the local host 127.0.0.1");
			let port = 2700 + Object.keys(Vlt.Registry).length+1;
			Vlt.Registry[com.Name]= {"Host":"127.0.0.1","Port":port};
			com.Address = Vlt.Registry[com.Name];

			if(com.Name in Vlt.Waiting) {
				console.log("Ahhh Jedi '"+com.Name+"', we've been eagerly awaiting your arival");
				com.PendingClients =Vlt.Waiting[com.Name];
			}

			console.log("returning", com);
		}


		if (fun)
			fun(err,com);
	}



	function GetAddress(com, fun) {
		console.log('--Registry/GetAddress', com.Name);
		let Vlt = this.Vlt;

		if (com.Name in Vlt.Registry) {
			let link = Vlt.Registry[com.Name];
			com.Address = {"Host": link.Host, "Port": link.Port};
		}else {
			let err = "**Err: that system is not registered yet";
			if (Par.RegAsPending) {
				let port = 2700 + Object.keys(Vlt.Registry).length + 1;
				Vlt.Registry[com.Name] = {"Host": "127.0.0.1", "Port": port};
				com.Host = Vlt.Registry[com.Name].Host;
				com.Port = Vlt.Registry[com.Name].Port;
			}
		}

		if (fun)
			fun(err,com);
	}

})();
