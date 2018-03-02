//# sourceURL=ViewDataStorage
(function ViewDataStorage() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup,
		Update,
		GetData
	};

	return { dispatch };

	function Setup(com, fun) {
		console.log("--ViewDataStorage/Setup");

		//subscribe to server
		this.send({ "Cmd": "Subscribe", "Pid": this.Par.Pid }, this.Par.Server);
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
		this.send({ Cmd: "UploadBrowserData", Pid: this.Par.Pid }, this.Par.Source, (err, com) => {
			let Data = this.Vlt.Data;
			let Update = com.Data;
			for (chan in Update) {
				Data[chan] = Update[chan];
			}


			if (fun)
				fun(null, com);
		});
	}

	function Update(com, fun) {
		// console.log("--ViewDataStorage/Update");
		let Data = this.Vlt.Data;
		let Update = com.Data;
		for (chan in Update) {
			Data[chan] = Update[chan];

			//send update to subscribed views
			if (chan in this.Vlt.Subscriptions) {
				// if (chan =="Units")debugger;
				for (let index = 0; index < this.Vlt.Subscriptions[chan].length; index++) {
					let listener = this.Vlt.Subscriptions[chan][index];
					this.send({
						Cmd: listener.func,
						Data: Data[chan]
					}, listener.pid);
				}
			}
		}
	}

	/**
	 * 
	 * @param {Object} com
	 * @param {String} com.Pid
	 * @param {Object} com.DataChannels
	 * @param {Object} com.DataChannels.0
	 * @param {String} com.DataChannels.0.Channel
	 * @param {String} com.DataChannels.0.Flow
	 * @param {String} com.DataChannels.0.Handler
	 * @param {Function} fun 
	 */
	function GetData(com, fun) {
		// console.log("--ViewDataStorage/GetData");

		//Data Channels are of the form
		/**
		 *	 "DataChannels": [
					{
						"Channel": "string name of channel",
						"Flow": "Push - if updates to the channel should be pushed to the requester",
						"Handler": "DrawObjects - the string function name that should handle pushed data"
					}
				]
		 */
		let Channels = com.DataChannels;
		let Data = this.Vlt.Data;
		let err = "";

		com.Data = {};
		for (let index = 0; index < Channels.length; index++) {
			let query = Channels[index];
			if (query.Channel in Data) {
				com.Data[query.Channel] = Data[query.Channel];
			} else {
				com.Data[query.Channel] = "ChannelNotPublished";
				err += `**ERR: ${query.Channel}-Channel has not been Published\n`;
			}
			if (query.Flow && (query.Flow == "Push")) {
				if (!("Handler" in query) || !("Pid" in com)) {
					err += `Channel: ${query.Channel}, Handler and Pid must be defined to subscribe to pushed data\n`;
				} else {
					if (!(query.Channel in this.Vlt.Subscriptions)) {
						this.Vlt.Subscriptions[query.Channel] = [];
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