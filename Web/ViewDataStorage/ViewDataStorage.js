//# sourceURL=ViewDataStorage
(function ViewDataStorage() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup,
		Update,
		GetData
	};

	return {dispatch};

	function Setup(com, fun) {
		console.log("--ViewDataStorage/Setup");

		//subscribe to server
		this.send({"Cmd": "Subscribe", "Pid":this.Par.Pid}, this.Par.Server);
		this.Vlt.Data = {}
		this.Vlt.Subscriptions = {};
		/*
			Subscriptions object will be of the form 
			{
				channel:[
					{
						func: "FunctionToCallAsCmd"
						pid: "thePidOfTheSubscriber"
					}
				]
			}
		*/
		this.send({Cmd:"UploadBrowserData", Pid:this.Par.Pid}, this.Par.Source, (err, com)=>{
			let Data = this.Vlt.Data;
			let Update = com.Data;
			for (chan in Update){
				Data[chan] = Update[chan];
			}

			
			if (fun)
				fun(null, com);
		});
	}

	function Update(com, fun){
		// console.log("--ViewDataStorage/Update");
		let Data = this.Vlt.Data;
		let Update = com.Data;
		for (chan in Update){
			Data[chan] = Update[chan];

			//send update to subscribed views
			if (chan in this.Vlt.Subscriptions){
				// if (chan =="Units")debugger;
				for (let index = 0; index<this.Vlt.Subscriptions[chan].length;index++){
					let listener = this.Vlt.Subscriptions[chan][index];
					this.send({
						Cmd:listener.func, 
						Data: Data[chan]
					}, listener.pid);
				}
			}
		}
	}

	function GetData(com,fun){
		// console.log("--ViewDataStorage/GetData");
		let Channels = com.DataChannels;
		let Data = this.Vlt.Data;
		let err;
		
		com.Data = {};
		for (let index = 0; index < Channels.length; index++){
			let query = Channels[index];
			if (query.Channel in Data){
				com.Data[query.Channel] = Data[query.Channel];
			}else{
				com.Data[query.Channel] = "ChannelNotPublished";
				if (!err)
					err = `**ERR: ${query.Channel}-Channel has not been Published`;
			}
			if (query.Flow && (query.Flow =="Push")){
				if (!("Handler" in query) || !("Pid" in com)){
					err += "Handler and Pid must be defined to subscribe to pushed data";
					fun(err, com);
					return;
				} else {
					if (!(query.Channel in this.Vlt.Subscriptions)){
						this.Vlt.Subscriptions[query.Channel]=[];
					}
					this.Vlt.Subscriptions[query.Channel].push(
						{
							func: query.Handler,
							pid: com.Pid
						}
					)				
				}
			}
		}
		if (fun)
			fun(err, com);
	}

})();