//# sourceURL=ServerProxy
(
	/**
	 * The ServerProxy Entity is the Apex and only Entity of the ServerProxy Module.
	 * 
	 * This Module should be deployed server-side and is used to communicate with Modules on the browser. 
	 */
	function ServerProxy() {

	var dispatch = {
		"*": Publish
	};

	return { dispatch };

	/**
	 * Any message received by this ServerProxy Module will immediately be sent to the WebViewer Module 
	 * and forwarded to any subscribed browser-side modules listening on that link.
	 * @param {Object} com   message object
	 * @param {Function=} fun   callback
	 */
	function Publish(com, fun = _=>_) {
		log.v(`Publishing from ${this.Par.Link} ServerProxy: ${com.Cmd}`);
		
		//set the destination on the browser side
		com.Forward = this.Par.Link;

		this.send(com, this.Par.Server, fun);
	}


})();