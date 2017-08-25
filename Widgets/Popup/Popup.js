//# sourceURL=Popup.js
//jshint esversion: 6
(function Popup() {

	class Popup {
		Setup(com, fun) {
			console.log("Viewify/Setup");
			if(!('View' in this.Par)) {
				fun('Par.View not set', com);
				this.deleteEntity(this.Par.Pid)
			}

			let par = {
				Module: this.Par.View
			};
			// aight, lemme 'splain
			// this.par is the par that you gen'd
			// this module with. this.Par.Par is the
			// pars to pass to the module we're 
			// generating.
			if('Par' in this.Par) {
				par.Par = {};
				for(key in this.Par.Par) {
					let val = this.Par.Par[key];
					par[key] = val;
				}
			}

			//alert(JSON.stringify(par, null, 2));
			this.genModule(par, (err, pid) => {
				let popup = DIV();
				popup.draggable();
				popup.resizable();
				popup.css('width', (this.Par.Width || 800) + 'px');
				popup.css('height', (this.Par.Height || 600) + 'px');
				popup.css('background-color', 'white');
				popup.css('position', 'fixed');
				popup.css('border-radius', '3px');
				popup.css('box-shadow', 'rgba(0, 0, 0, 0.698039) 0px 5px 17px');
				popup.css('top', (($(document.body).height() / 2) - 150) + 'px');
				popup.css('left', (($(document.body).width() / 2) - 200) + 'px');
				
				
				
				let topBarDiv = DIV();
				topBarDiv.css('height','20px');
				topBarDiv.css("border-bottom", "1px solid var(--view-border-color-light)");
				topBarDiv.css('background-color', 'var(--view-lighter)');
				
				let contentDiv = DIV();
				contentDiv.css('height','calc(100% - 21px)');

				let closeButton =  DIV();
				closeButton.html("🗙");
				closeButton.css("float", "right");
				closeButton.css("cursor", "pointer");
				closeButton.css("line-height", "14px");
				closeButton.css('height','16px');				
				closeButton.css("padding", "2px");
				closeButton.css('background-color', 'var(--accent-error)');

				closeButton.on("click",(function () {
					popup.remove();
				}));

				topBarDiv.append(closeButton);
				popup.append(topBarDiv);
				popup.append(contentDiv);
				


				if ('Resizable' in com && com.Resizable) {
					//make it Resizable somehow idk
					// TODO - - - - - - - - - - - - -
				}
				


				document.body.appendChild(popup[0]);

				this.send({
					Cmd: 'UpdateUI'
				}, pid, (err, cmd) => {
					this.send({
						Cmd: 'DOMLoaded'
					}, pid, (err, cmd) => {
						this.send({
							Cmd: 'GetViewRoot'
						}, pid, (err, cmd) => {
							// debugger;
							contentDiv.append(cmd.Div);
						});
					});
				});

			});
		}
	}

	return {
		dispatch: Popup.prototype
	};

})();