//# sourceURL=WebProxy
(function WebProxy() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Start,
		"*": Send
	};

	return {dispatch};

	function Start(com, fun) {
		log.v("--Router/Start");
		
		this.send({Cmd:"Subscribe", Pid:this.Par.Pid}, this.Par.Server);
		if (fun)
			fun(null, com);
	}

	function Send(com, fun){

	}

})();