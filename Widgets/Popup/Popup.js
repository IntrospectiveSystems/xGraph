//# sourceURL=Popup.js
//jshint esversion: 6
(function Popup() {

	/*
        The PopupView class is a Root Container View.
        PopupView attaches itself to the DOM, rendering on top of the existing page.

     */
	class Popup {

        //-----------------------------------------------------Setup
		Setup(com, fun) {
			this.super(com, (err, com)=>{
				console.log("Viewify/Setup");
				if(!('View' in this.Par)) {
					fun('Par.View not set', com);
					this.deleteEntity(this.Par.Pid)
					return;
				}

				this.Vlt.popup = DIV();
				let popup = this.Vlt.popup;
				popup.draggable();
				popup.resizable();
				popup.css('width', (this.Par.Width || 800) + 'px');
				popup.css('height', (this.Par.Height || 600) + 'px');
				popup.css('background-color', 'white');
				popup.css('position', 'fixed');
				popup.css('border-radius', '3px');
				popup.css('box-shadow', 'rgba(0, 0, 0, 0.698039) 0px 5px 17px');
				popup.css('top', (this.Par.Top||(($(document.body).height() / 2) - 150)) + 'px');
				popup.css('left', (this.Par.Left||(($(document.body).width() / 2) - 200)) + 'px');

				this.Vlt.popup.append(this.Vlt.root);
				document.body.appendChild(this.Vlt.popup[0]);

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
						par.Par[key] = val;
					}
				}

				//debugger;
				//alert(JSON.stringify(par, null, 2));
				this.genModule(par, (err, pid) => {
					//debugger;
					this.send({Cmd:"AddView", View: pid}, this.Par.Pid, (err, cmd)=>{
						// debugger;
						this.send({Cmd: 'DOMLoaded'}, pid, (err, cmd) => {
							
						});
						
					});
				});
			});
		}

		async Render(com,fun){
			
			if(this.Vlt.viewDivs.length == 0) {
				await this.ascend('Destroy');
				return fun(null, com);
			}

			let that = this;

			if (this.Vlt.viewDivs.length>0)
				this.Vlt.viewDivs[0].detach();
			
			this.Vlt.div.children().remove();
			
			let topBarDiv = DIV();
			topBarDiv.css('height','20px');
			topBarDiv.css("border-bottom", "1px solid var(--view-border-color-light)");
			topBarDiv.css('background-color', 'var(--view-lighter)');
			
			let contentDiv = DIV();
			contentDiv.css('height','calc(100% - 21px)');
			contentDiv.append(this.Vlt.viewDivs[0]);

			let closeButton =  DIV();
			closeButton.html("🗙");
			closeButton.css("float", "right");
			closeButton.css("cursor", "pointer");
			closeButton.css("line-height", "14px");
			closeButton.css('height','16px');				
			closeButton.css("padding", "2px");
			closeButton.css('background-color', 'var(--accent-error)');

			closeButton.on("click",(function () {
				// debugger;
				that.send({Cmd:"Destroy"}, that.Par.Pid, (err, cmd)=>{});
			}));

			topBarDiv.append(closeButton);

			this.Vlt.div.append(topBarDiv);
			this.Vlt.div.append(contentDiv);
			
			this.super(com, (err,cmd)=>{
				fun(err, com);
			});
		}

		Cleanup(com, fun){
			console.log("--Popup/Cleanup");
			this.Vlt.popup.remove();
			fun(null, com);
		}
	}

	return Viewify(Popup, '3.3');

})();