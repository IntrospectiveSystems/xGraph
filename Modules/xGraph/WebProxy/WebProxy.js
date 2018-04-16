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
		"*": Publish,
		Subscribe
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
		//log.v(`Publishing from ${this.Par.Link} WebProxy: ${com.Cmd}`);

		//set the destination on the server side
		com.Passport.To = this.Par.Link;

		this.Par.sendSock(com, async (err, com) => {
			
			if(com.PidInterchange) {
				let table = [];
				com = await recurse(com);
				// console.table(table);

				async function recurse(obj) {
					if('Format' in obj
					&& 'Value' in obj
					&& typeof obj.Value == 'string'
					&& obj.Format == 'is.xgraph.webproxytag') {
						let tag = obj.Value;
						obj.Value = await new Promise(resolve => {
							that.genModule({
								Module: that.Par.Module,
								Par: {
									Link: obj.Value
								}
							}, (err, apx) => {
								table.push({Tag: tag, Apex: apx});
								resolve(apx);
							});
						});
						obj.Format = 'is.xgraph.pid';
						obj.toString = function() {
							return this.Value;
						}
						return obj;
					}
					for(let key in obj) {
						if(typeof obj[key] == 'object')
							obj[key] = await recurse(obj[key]);
					}
					return obj;
				}
			}

			fun(err, com);
		});
	}
/**
	 * `Subscribe` messages received by this WebProxy Module will immediately be
	 * sent to the Server and register the sender/`com.Pid` to recieve messages
	 * broadcasted on this `Par.Link`
	 * 
	 * @param {Object} com   message object
	 * @param {Function=} fun   callback
 */
async function Subscribe(com, fun) {
		com.Link = com.Link || this.Par.Link;
		com.Pid = com.Pid || com.Passport.From;
		this.Par.sendSock(com, async _ => {
			// debugger;
			fun(null, com);
		});
	}


}) ();