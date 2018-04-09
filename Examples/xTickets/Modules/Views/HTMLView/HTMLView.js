// #sourceURL=HTMLView.js
(function HTMLView() {
	class HTMLView {
		/**
		 * @description Create the entire DOM, parsing `Par.HTML`, and put
		 * children where they need to go.
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof HTMLView
		 */
		Render(com, fun) {
			// debugger;
			let str = (' ' + this.Par.HTML).substr(1); // force deep copy string
			let subs = this.Par.HTML.match(/<\$[A-Za-z]*>/g) || []; // get things we need to substitute, like <$Title>
			for(let i = 0; i < subs.length; i ++) { // Run through subs
				let key = subs[i].substr(2, subs[i].length - 3); // extract Par key
				if(subs[i] != '<$Child>' && key in this.Par) // if we have that key, and its not a child view
					str = str.replace(subs[i], this.Par[key]); // replace dat
			}

			// str.replace();

			for(let i = 0; str.indexOf('<$Child>') > -1; i ++) {
				let before = str.substr(0, str.indexOf('<$Child>'));
				let after = str.substr(str.indexOf('<$Child>') + 8); 
				str = before + "<div style =\"position:relative;height:100%;width:100%\"id=\"" + this.Par.Pid.substr(24) + "-" + i + "\"></div>" + after;
			}

			this.Vlt.div.children().detach();

			this.Vlt.div.append($(str));

			let i = 0;
			for(let item of this.Vlt.viewDivs) {
				let div = $('#' + this.Par.Pid.substr(24) + "-" + i);
				if(div.length != 0) {
					// debugger;
					div.append(item);
				}
				i ++;
			}

			this.super(com, (err, cmd) => {
				fun(null, com);
			});
		}
	}

	return Viewify(HTMLView, "3.4");
})();