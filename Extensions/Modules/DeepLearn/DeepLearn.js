//# sourceURL=DeepLearn.js
(function DeepLearn() {
	class DeepLearn {

		async Setup(com, fun) {
			if ('body' in windown || process) {
				var xhr = new XMLHttpRequest();
				
				xhr.onreadystatechange = () => {
					if (xhr.readyState == XMLHttpRequest.DONE) {
						eval(xhr.responseText);
						this.Vlt.dl = deeplearn;
						log.v(`set deeplearn to this.Vlt.dl`);
						fun(null, com);
					}
				}
				xhr.open('GET', "https://cdn.jsdelivr.net/npm/deeplearn@latest", true);
				xhr.send(null);
			} else {
				this.Vlt.dl = this.require('deeplearn');
				fun(null, com);
				log.v(`set deeplearn to this.Vlt.dl`);
			}
		}

		Start(com, fun) {

			fun(null, com);
		}
	}

	/**
	 * Provides open access to the DeepLearn API
	 * @param {Object} com 
	 * @param {String} com.Cmd 	the command we're calling in the Ace API
	 * @param {Function=} fun 
	 */
	DeepLearn.prototype['*'] = (com, fun = _ => _) => {
		if (!("editor" in this.Vlt) || !(com.Cmd in this.Vlt.editor)) {
			log.v(`${com.Cmd} not in DeepLearn API`);
			fun(null, com);
			return;
		}
		let err = "";
		com.Arguments = com.Arguments || [];
		log.v(`--DeepLearn/APILookup: ${com.Cmd} Arguments: ${com.Arguments.map((v) => v.substr(0, Math.min(v.length, 60)))}`);
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

	return { dispatch: DeepLearn.prototype }
})();