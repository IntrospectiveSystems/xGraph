//# sourceURL=Keras.js
(function Keras() {
	class Keras {
		async Setup(com, fun) {
			com = await this.asuper(com);















			fun(null, com);
		}

		async Start(com, fun) {
			//com = await this.asuper(com);
			fun(null, com);
		}
	}

	/**
	 * Provides open access to the Keras API
	 * @param {Object} com 
	 * @param {String} com.Cmd 	the command we're calling in the Ace API
	 * @param {Function=} fun 
	 */
	Keras.prototype['*'] = (com, fun = _ => _) => {
		if (!("editor" in this.Vlt) || !(com.Cmd in this.Vlt.editor)) {
			log.v(`${com.Cmd} not in Keras API`);
			fun(null, com);
			return;
		}
		let err = "";
		com.Arguments = com.Arguments || [];
		log.v(`--Keras/APILookup: ${com.Cmd} Arguments: ${com.Arguments.map((v) => v.substr(0, Math.min(v.length, 60)))}`);
		try {
			com.Data = this.Vlt.editor[com.Cmd](...com.Arguments);
		} catch (e) {
			if (e) {
				err = e;
				log.e(e);
			}
		}
		fun(err || null, com);
	};

	return Viewify(Keras.prototype, "4.2");
})();