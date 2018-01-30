//# sourceURL=Router
(function Router() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Start,
		Subscribe,
		"*": Send
	};

	return {dispatch};

	function Start(com, fun) {
		console.log("--Router/Start");
		
		this.send({Cmd:"Subscribe", Pid:this.Par.Pid}, this.Par.Server);
		if (fun)
			fun(null, com);
	}

	function Subscribe(com, fun){
		if (!this.Par.Table)
			this.Par.Table = {}
		
		this.Par.Table.push(com.Pid);

		if (fun)
			fun(null, com);
	}

	async function Send(com, fun){
		//console.log("Router/Send - ", com.Cmd);
		for(let pid of this.Par.Table) {
			await new Promise((resolve) => {
				this.send(com, pid, _ => {
					resolve();
				});
			});
		}

		fun(null, com);
	}

})();