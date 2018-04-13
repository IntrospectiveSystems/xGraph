//# sourceURL=Ticket
(function BottomSheet() {

	let stack = [];

	class BottomSheet {
		async Setup(com, fun) {
			// debugger;
			com = await this.asuper(com);

			if(!('View' in this.Par)) {
				log.w('Bottom Sheet Par.View not set');
				fun('Par.View not set', com);
				this.deleteEntity(this.Par.Pid)
				return;
			}

			



			this.Vlt.sheet = $(`<div style="
				display: inline-block;
				background: white;
				box-sizing: border-box;
				transition: bottom 200ms, opacity 200ms;
				transition-timing-function: cubic-bezier(0.32,1,0.23,1);
				border-bottom: none;
				position: fixed;
				bottom: -75%;
				height: 75%;
				box-shadow: rgba(0, 0, 0, 0.3) 0px 6px 15px, rgba(0, 0, 0, 0.3) 0px 2px 5px;
			"></div>`);


			this.Vlt.root.css('position', 'fixed');
			$(document.body).append(this.Vlt.root);
			this.Vlt.div.append(this.Vlt.sheet);
			// console.log('soooo... i added it.');
			

			$(window).resize(_ => this.ascend('Resize'));
			
			

			let par = {
				Module: this.Par.View
			};
			if('Par' in this.Par) {
				par.Par = {};
				for(let key in this.Par.Par) {
					let val = this.Par.Par[key];
					par.Par[key] = val;
				}
			}
// debugger;
			this.genModule(par, (err, pid) => {
				this.send({Cmd:"AddView", View: pid}, this.Par.Pid, async (err, cmd) => {
					await this.ascend('Resize');
					await this.ascend('DOMLoaded');
					fun(null, com);
				});
			});
			// debugger;
			
			// debugger;
		}

		async SetLayer(com, fun) {
			if(com.Layer > 3) {
				return fun(null, com);
			}
		}

		async Resize(com, fun) {

			
			let x = $(document.body).width();
			let innerWidth = Math.min(800, x);
			
			let outterWidth = $(document.body).width();
			let left = (outterWidth - innerWidth) / 2;
			this.Vlt.sheet.css('width', `${innerWidth}px`);
			this.Vlt.sheet.css('left', `${left}px`);

			await this.asuper(com);
			fun(null, com);
		}

		async Render(com, fun) {
			// console.log('asdf', this.Vlt.viewDivs.length);

			if(this.Vlt.viewDivs.length == 0) {
				// debugger;
				await this.ascend('Destroy');
				return fun(null, com);
			}

			// console.log('so i do get here tho...');

			// if (this.Vlt.viewDivs.length>0)
			// 	this.Vlt.viewDivs[0].detach();
			
			// this.Vlt.div.children().remove();
			
			// let contentDiv = DIV();
			// contentDiv.css('height','100%');
			this.Vlt.sheet.children().remove();
			this.Vlt.sheet.append(this.Vlt.viewDivs[0]);


			await this.asuper(com);
			fun(null, com);
		}

		async DOMLoaded(com, fun) {
			// then set me to transition in

			setTimeout(_ => {
				// console.log('transition');
				// debugger;
				this.Vlt.sheet.css('bottom', '0%');
			}, 200);

			await this.asuper(com);
			fun(null, com);
		}
		
		async Cleanup(com, fun) {
			// console.log(" -- BottomSheet/Cleanup");
			this.Vlt.sheet.remove();
			
			await this.asuper(com);
			fun(null, com);
		}

	}

	return Viewify(BottomSheet, '3.4');
})();