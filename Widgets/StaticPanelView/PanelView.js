//# sourceURL=PanelView.js
//jshint esversion: 6
(function Panel() {
	class Panel {

		Setup(com, fun) {
			// debugger;
			console.time("Static Panel View");
			this.super(com, (err, com) => {
				this.Vlt.static = DIV();
				this.Vlt.dynamicDiv = DIV();
				this.Vlt.static.css('height', this.Par.Size);
				this.Vlt.dynamicDiv.css('height', `calc(100% - ${this.Par.Size}`);
				this.Vlt.div.append(this.Vlt.static, this.Vlt.dynamicDiv);

				console.timeEnd("Static Panel View");
				fun(null, com);
			});
		}

		Render(com, fun) {

			
			this.Vlt.static.children().remove();
			this.Vlt.dynamicDiv.children().remove();

			if(this.Vlt.viewDivs.length == 2) {
				this.Vlt.static.append(this.Vlt.viewDivs[0]);
				this.Vlt.dynamicDiv.append(this.Vlt.viewDivs[1]);
			}

			this.super(com, (err, cmd) => {
				fun(null, com)
			});
		}

		Resize(com, fun) {
			this.super(com, (err, cmd) => {
				fun(null, com);
			});
		}
	}

	return Viewify(Panel);

})();