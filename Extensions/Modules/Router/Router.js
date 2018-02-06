//# sourceURL=Router
(function Router() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		'*': Incomming,
		Subscribe,
		Broadcast: Send,
		Setup
	};

	return {dispatch};

	async function Setup(com, fun) {
		this.save(_ => fun(null, com));
	}

	async function Incomming(com, fun) {
		this.send(com, this.Par.Extends, fun)
		// fun(null, com);
	}

	function Subscribe(com, fun){
		log.d('scrub scribble');
		if (!this.Par.Table)
			this.Par.Table = []

		this.Par.Table.push(com.Pid);

		if (fun)
			fun(null, com);
	}

	async function Send(com, fun){
		if (!this.Par.Table)
			this.Par.Table = []


		//console.log("Router/Send - ", com.Cmd);
		log.v(`Broadcast ${com.Command.Cmd}`);
		log.v(`${this.Par.Table}`);
		for(let pid of this.Par.Table) {
			log.v(` |> ${pid}`);
			await new Promise((resolve) => {
				this.send(com.Command, pid, _ => {
					resolve();
				});
			});
		}
		fun(null, com);

	}

})();