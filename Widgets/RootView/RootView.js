//# sourceURL=RootView.js
//jshint esversion: 6
//test change
(function RootView() {

	class RootView {
		Setup(com, fun) {
			this.super(com, (err, cmd) => {
				log.v(`--RootView::Setup`);
				//debugger;
				fun(null, com);
			});
		}

		/**
		 * @description
		 * 1) Reads in the Layout parameter
		 * 
		 * 2) Sends Correct AddView messages
		 * down the Layout to construct the
		 * hierarchy
		 * 
		 * 3) Appends itself to the DOM
		 * 
		 * 4) Propogates a Render, Resize, DOMLoaded, Resize, in that order.
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof RootView
		 */
		Start(com, fun) {
			log.v(`--RootView::Start`);
			this.super(com, async (err, cmd) => {

				let that = this;
				// debugger;
				async function parseView(view) {
					if (typeof view == 'string') {
						// console.log('PID ' + view);
						return view;
					} else {
						let basePid = view.View;

						for(let item of view.Children) {
							let pid = await parseView(item);
							log.v(pid);
							await that.ascend("AddView", {View: pid}, basePid);
						}
						return basePid;
					}
				}

				let apexPid = await parseView(this.Par.Layout);
				// debugger;
				this.send({ Cmd: "GetViewRoot" }, apexPid, (err, com) => {
					// debugger;

					let apexDiv = com.Div;
					// apexDiv.css('opacity', '0.0');
					$(document.body).append(apexDiv);
					
					this.send({ Cmd: "ShowHierarchy" }, apexPid, () => { });

					this.send({ Cmd: "Render" }, apexPid, () => { });

					$(window).resize(() => {
						this.send({ Cmd: "Resize" }, apexPid, () => { });
					});

					$(document.body).find('.removeOnLoad').remove();

					this.send({ Cmd: "DOMLoaded" }, apexPid, (err, com) => {
						$(window).resize(() => {
							this.send({ Cmd: "Resize" }, apexPid, () => { });
						});
						// apexDiv.css('opacity', '1.0');
						fun(null, com);
					});
				});
			});


		}
	}

	return Viewify(RootView, "3.4");

})();


