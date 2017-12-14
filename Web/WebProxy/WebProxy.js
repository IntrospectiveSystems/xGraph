//# sourceURL=WebProxy
(function WebProxy() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		"*": Publish
	};

	return { dispatch };


	//-------------------------------------------------------Publish
	// This is called when message needs to be sent to all
	// browsers that have subscribed
	function Publish(com, fun) {
		let that = this;
		log.v(`Publishing from ${this.Par.Link} webProxy: ${JSON.stringify(com, null, 2)}`);

		//set the destination on the server side
		com.Passport.To = this.Par.Link;

		this.Par.sendSock(com, async (err, com) => {

			if(com.PidInterchange) {
				// log.d('read pid interchange!');
				com = await recurse(com);

				async function recurse(obj) {
					if('Format' in obj
					&& 'Value' in obj
					&& typeof obj.Value == 'string'
					&& obj.Format == 'is.xgraph.webproxytag') {
						let tag = obj.Value;
						obj.Value = await new Promise(resolve => {
							that.genModule({
								Module: 'xGraph.Web.WebProxy',
								Par: {
									Link: obj.Value
								}
							}, (err, apx) => {
								resolve(apx);
							});
						});
						obj.Format = 'is.xgraph.pid';
						return obj;
					}
					for(let key in obj) {
						if(typeof obj[key] == 'object')
							obj[key] = await recurse(obj[key]);
					}
					return obj;
				}
			}

			fun(null, com);
		});
	}


}) ();