//# sourceURL=Popup.js
//jshint esversion: 6
(function Popup() {

	/*
	* The PopupView class is a Root Container View.
	* PopupView attaches itself to the DOM, rendering on top of the existing page.
	*/
	class Popup {

		//-----------------------------------------------------Setup

		/**
		 * @description 
		 * Creates Module instance based on
		 * this.Par.View and this.Par.Par.
		 * 
		 * Adds generated View to Popup via AddView
		 * 
		 * Then Propogates a Resize and DOMLoaded
		 * @param {object} com
		 * @param {any} fun
		 * @override
		 * @memberof RootView
		 */
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


			
				this.Vlt.topBarDiv = DIV();
				this.Vlt.topBarDiv.css('height','20px');
				this.Vlt.topBarDiv.css("border-bottom", "1px solid var(--view-border-color-light)");
				this.Vlt.topBarDiv.css('background-color', 'var(--view-lighter)');
				
				this.Vlt.contentDiv = DIV();
				this.Vlt.contentDiv.css('height','calc(100% - 21px)');
				
				this.Vlt.closeButton =  DIV();
				this.Vlt.closeButton.html("🗙");
				this.Vlt.closeButton.css("float", "right");
				this.Vlt.closeButton.css("cursor", "pointer");
				this.Vlt.closeButton.css("line-height", "14px");
				this.Vlt.closeButton.css('height','16px');				
				this.Vlt.closeButton.css("padding", "2px");
				this.Vlt.closeButton.css('background-color', 'var(--accent-error)');
				
				this.Vlt.closeButton.on("click", () => {
					// debugger;
					this.send({Cmd:"Destroy"}, this.Par.Pid, (err, cmd)=>{});
				});

				this.Vlt.topBarDiv.append(this.Vlt.closeButton);
				
				this.Vlt.div.append(this.Vlt.topBarDiv);
				this.Vlt.div.append(this.Vlt.contentDiv);

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
					this.send({Cmd:"AddView", View: pid}, this.Par.Pid, (err, cmd)=>{
						this.send({Cmd: 'Resize'}, pid, (err, cmd) => {
							this.send({Cmd: 'DOMLoaded'}, pid, (err, cmd) => {
							});
						});
					});
				});
			});
		}


		/**
		 * @description create the DOM of the popup
		 * and add its children. 
		 * @param {any} com 
		 * @param {any} fun 
		 * @override 
		 * @memberof Popup
		 */
		async Render(com,fun){
			if(this.Vlt.viewDivs.length == 0) {
				await this.ascend('Destroy');
				return fun(null, com);
			}

			// debugger;

			this.Vlt.contentDiv.children().detach();
			this.Vlt.contentDiv.append(this.Vlt.viewDivs[0]);

			this.super(com, (err,cmd)=>{
				fun(err, com);
			});
		}

		/**
		 * @description Before Garbage collection,
		 * remove our elements from the DOM.
		 * @param {any} com 
		 * @param {any} fun 
		 * @override
		 * @memberof Popup
		 */
		Cleanup(com, fun){
			console.log("--Popup/Cleanup");
			this.Vlt.popup.remove();
			fun(null, com);
		}
	}

	return Viewify(Popup, '3.3');

})();