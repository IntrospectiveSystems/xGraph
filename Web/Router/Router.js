//# sourceURL=Router
(function Router() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Start: Start,
		"*": Send
	};

	return {dispatch};

	function Start(com, fun) {
		console.log("--Router/Start");
		
		this.send({Cmd:"Subscribe", Pid:this.Par.Pid}, this.Par.Server);
		if (fun)
			fun(null, com);
	}

	function Send(com, fun){
		//console.log("Router/Send - ", com.Cmd);
		this.send(com, this.Par.Table[com.Destination], fun);
	}

})();