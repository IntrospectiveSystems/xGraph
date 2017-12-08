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
			this.super(com, (err, cmd) => {

				let that = this;
				// debugger;
				function parseView(view, fun) {
					if (typeof view == 'string') {
						// console.log('PID ' + view);
						fun(view);
					} else {
						let basePid = view.View;
						async.each(view.Children, function(item, next) {
							parseView(item, (pid) => {
								that.send({
									Cmd: "AddView",
									View: pid
								}, basePid, () => {
									next();
								});
							});
						}, function() {
							//done adding children
							// console.log('PID ' + basePid);
							// console.log('DAT WAY');
							fun(basePid);
						});
					}
				}

				parseView(this.Par.Layout, (apexPid) => {
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
			});


		}
	}

	return Viewify(RootView, "3.1");

})();


