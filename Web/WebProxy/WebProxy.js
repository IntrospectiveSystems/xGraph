//# sourceURL=WebProxy
(
	/**
	 * The WebProxy Entity is the Apex and only Entity of the WebProxy Module.
	 * 
	 * This Module should be deployed browser-side and is used to communicate with Modules on the server. 
	 */
	function WebProxy() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		"*": Publish
	};

	return { dispatch };

	/**
	 * Any message received by this WebProxy Module will immediately be sent to the WebViewer Module 
	 * and forwarded to any subscribed server-side modules listening on that link.
	 * @param {Object} com   message object
	 * @param {Function=} fun   callback
	 */
	function Publish(com, fun = _=>_) {
		let that = this;
		log.v(`Publishing from ${this.Par.Link} WebProxy: ${com.Cmd}`);

		//set the destination on the server side
		com.Passport.To = this.Par.Link;

		this.Par.sendSock(com, async (err, com) => {

			if(com.PidInterchange) {
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