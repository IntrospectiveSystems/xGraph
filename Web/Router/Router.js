//# sourceURL=Router
(function Router() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		"*":Send
	};

	return {dispatch};

	function Setup(com, fun) {
		console.log("--Router/Setup");
		
		this.send({Cmd:"Subscribe", Pid:this.Par.Pid}, this.Par.Server);
		if (fun)
			fun(null, com);
	}

	function Send(com, fun){
		//console.log("Router/Send - ", com.Cmd);
		this.send(com, this.Par.Table[com.Destination], fun);
	}

})();