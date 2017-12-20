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
		
		this.Par.Table[com.Name]= com.Pid;

		if (fun)
			fun(null, com);
	}

	function Send(com, fun){
		//console.log("Router/Send - ", com.Cmd);
		this.send(com, this.Par.Table[com.Destination], fun);
	}

})();