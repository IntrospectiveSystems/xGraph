//# sourceURL=AceEditorView.js
(
	/**
	 * The AceEditorView entity is the Apex and only entity of the AceEditorView Module. This entity requres its Setup function invoked during the Setup phase of Nexus startup.
	 * The main capability of this entity is to add and render an Ace Editor Session to the div of the Module. 
	 */
	function AceEditorView() {

	let dispatch = {
		Setup,
		"*": APILookup
	};

	//Using views we must inject basic functionality via the viewify script.
	//We no longer need to build divs in our view class just access the existing
	//div from this.Vlt.div. The div is already appended to the body.
	return Viewify(dispatch, "3.1");

	/**
	 * Set up the personal attributes including the editor session and add it to 
	 * the div.
	 * @param {Object} com 
	 * @param {Function} fun 
	 */
	function Setup(com, fun) {
		log.v("-Ace/Setup");
		//we hoist the setup command to View.js in the viewif script.
		this.super(com, (err, cmd) => {

			this.Vlt.editor = ace.edit(this.Vlt.div[0]);
			this.Vlt.editor.$blockScrolling = Infinity;

			//set the theme
			this.getFile('theme-monokai.js', (err, file) => {
				if (err) { log.e(err); return; }
				eval(file);
				this.Vlt.editor.setTheme("ace/theme/monokai");
			});

			//set the language mode
			this.getFile("mode-javascript.js", (err, file) => {
				if (err) { log.e(err); return; }
				eval(file);
				this.Vlt.editor.getSession().setMode("ace/mode/javascript");
			});

			if (this.Par.AutoSave && this.Par.Controller) {
				this.Vlt.editor.on("change", (evt) => {
					this.Vlt.file = this.Vlt.editor.getValue();
					this.send({ "Cmd": "Save", "Data": this.Vlt.file.toString() }, this.Par.Controller, (err, com) => {
						if (err) log.e(err)
					});
				});
			}
			fun(null, com);

			//Example of using the internal API thorugh an xGraph Command
			setTimeout(() => {
				log.d(this.Par.Entity);
				this.getFile(this.Par.Entity, (err, file) => {
					if (err) { log.e(err); return; }
					this.Vlt.file = file;
					this.send({ Cmd: "setValue", Arguments: [this.Vlt.file] }, this.Par.Pid);
				});
			}, 1000);
		});
	}

	/**
	 * Provides access to the Ace API, currently only access to the editor session is available and thus 
	 * only methods and attributes of the "EditSession" are available. 
	 * @param {Object} com 
	 * @param {String} com.Cmd 	the command we're hoping to try and call in the Ace API
	 * @param {Function=} fun 
	 */
	function APILookup(com, fun = _ => _) {
		if (!("editor" in this.Vlt) || !(com.Cmd in this.Vlt.editor)) {
			log.v(`${com.Cmd} not in Ace API`);
			fun(null, com);
			return;
		}
		let err = "";
		com.Arguments = com.Arguments ||[];
		log.v(`--Ace/APILookup: ${com.Cmd} Arguments: ${com.Arguments.map((v)=>v.substr(0,Math.min(v.length, 100)))}`);
		try {
			com.Data = this.Vlt.editor[com.Cmd](...com.Arguments);
		} catch (e) {
			if (e) {
				err = e;
				log.e(e);
			}
		}
		fun(err || null, com);
	}

})();
