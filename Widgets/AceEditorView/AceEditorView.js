//# sourceURL=AceEditorView.js
(function AceEditorView() {

	let dispatch = {
		Setup,
		"*": APILookup
	};

	//Using views we must inject basic functionality via the viewify script.
	//We no longer need to build divs in our view class just access the existing
	//div from this.Vlt.div. The div is already appended to the body.
	return Viewify(dispatch, "3.1");

	function Setup(com, fun) {
		log.v("-Ace/Setup");
		//we hoist the setup command to View.js in the viewif script.
		this.super(com, (err, cmd) => {

			this.Vlt.editor = ace.edit(this.Vlt.div[0]);
			this.Vlt.editor.$blockScrolling = Infinity;

			this.getFile('theme-monokai.js', (err, file) => {
				if (err) { log.e(err); return; }
				eval(file);
				this.Vlt.editor.setTheme("ace/theme/monokai");
			});

			this.getFile("mode-javascript.js", (err, file) => {
				if (err) { log.e(err); return; }
				eval(file);
				this.Vlt.editor.getSession().setMode("ace/mode/javascript");
			});
			fun(null, com);

			setTimeout(() => {
				log.d(this.Par.Entity);
				this.getFile(this.Par.Entity, (err, file) => {
					if (err) { log.e(err); return; }
					this.send({ Cmd: "setValue", Args: [file] }, this.Par.Pid);
				});
			}, 1000);
		});
	}

	function APILookup(com, fun = _ => _) {
		if (!("editor" in this.Vlt) || !(com.Cmd in this.Vlt.editor)) {
			log.d(`${com.Cmd} not in Ace API`);
			fun(null, com);
			return;
		}

		log.v(`--Ace/APILookup: ${com.Cmd} Args: ${com.Args}`);
		this.Vlt.editor[com.Cmd](...com.Args);
		fun(null, com);
	}

})();
