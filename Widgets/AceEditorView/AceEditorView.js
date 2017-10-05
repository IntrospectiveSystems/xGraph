//# sourceURL=AceEditorView.js
//Makes a texteditor view. 


/****************************
We will likely need to provide access to the other script files in the build

*/
(function AceEditorView() {

	let dispatch = {
		Setup: Setup,
		Start: Start
	};

	//Using views we must inject basic functionality via the viewify script.
	//We no longer need to build divs in our view class just access the existing
	//div from this.Vlt.div. The div is already appended to the body.
	return Viewify(dispatch, "3.1");

	function Setup(com, fun) {
		console.log("-Ace-code-editor/Setup");
		//we hoist the setup command to View.js in the viewif script.
		this.super(com, (err, cmd) => {
			//we access the existing div
			let div = this.Vlt.div[0];
			let Vlt = this.Vlt;

			var editor = ace.edit(div);
			editor.setTheme("ace/theme/monokai");
			editor.getSession().setMode("ace/mode/javascript");

			if (fun) {
				fun(null, com);
			}
		});
	}

	function Start(com, fun) {
		console.log("--Ace/Start");
		
		if (fun)
			fun(null, com);
	}
})();
