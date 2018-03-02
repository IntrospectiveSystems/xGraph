(function Button() {
	// options:
	// ModuleDefinition: generate and evoke apex
	// GenModuleSurrogate: send generate command, then evoke apex
	// Pointer: send an evoke to Pointer Pid,
	// Command & To: Send a command (Command) to entity (To)
	class Button {
		async Setup(com, fun) {
			com = await this.asuper(com);
			this.Vlt.div.css('text-align', 'center');
			this.asuper({
				Cmd: 'Style',
				Selector: 'div.button',
				Rules: {
					"padding": "8px 16px",
					"display": "inline",
					"cursor": "pointer",
					"border-radius": "3px",
					"min-width": "64px",
					"background": "rgba(0, 0, 0, 0)",
					"border": "none",
					"text-align": "center",
					"outline": "none",
					"text-transform": "capitalize",
			    "display": "inline-block"
				}
			});
			this.asuper({
				Cmd: 'Style',
				Selector: 'div.button:hover',
				Rules: {
					"cursor": "pointer",
					"background": "rgba(0, 0, 0, .08)",
					"text-transform": "capitalize"
				}
			});
			fun(null, com);
		}

		async Render(com, fun) {

			this.Vlt.button = this.Vlt.button || $(document.createElement('div'));
			this.Vlt.button.html(this.Par.Text || 'Untitled Button');
			this.Vlt.button.addClass('button')
			this.Vlt.button.remove();
			this.Vlt.div.append(this.Vlt.button);

			com = await this.asuper(com);
			fun(null, com);
		}

		async DOMLoaded(com, fun) {
			this.Vlt.div.on('click', 'div.button', async _ => {
				if('ModuleDefinition' in this.Par) {
					this.genModule(this.Par.ModuleDefinition, apx => {
						this.evoke(apx);
					});
				} else if ('GenModuleSurrogate' in this.Par) {
					// debugger;
					let response = await this.ascend('GenModule', {}, this.Par.GenModuleSurrogate);
					this.evoke(response.Pid);
				} else if ('Pointer' in this.Par) {
					this.evoke(this.Par.Pointer);
				} else if('Command' in this.Par && 'To' in this.Par) {
					this.send({Cmd: this.Par.Command}, this.Par.To, _=>_);
				} else {
					console.warn("Button must be Given Par.ModuleDefinition, Par.GenModuleSurrogate, or Par.Pointer");
				}
			});

			com = await this.asuper(com);
			fun(null, com);
		}
	}

	return Viewify(Button, '3.4');
})();