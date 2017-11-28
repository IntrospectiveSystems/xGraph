//# sourceURL=ServerProxy
(function ServerProxy() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		"*": Publish
	};

	return { dispatch };

	//-------------------------------------------------------Publish
	// This is called when message needs to be sent to all
	// browsers that have subscribed
	function Publish(com, fun) {
		//log.d(`Publishing from ${this.Par.Link} ServerProxy: ${JSON.stringify(com, null, 2)}`);

		//set the destination on the server side
		com.Forward = this.Par.Link;

		this.send(com, this.Par.Server, fun);
	}


})();