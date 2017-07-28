//# sourceURL=LayoutInitializer.js
//jshint esversion: 6
//test change
(function LayoutInitializer() {

	class LayoutInitializer {
		Setup(com, fun) {
			// debugger;
			fun(null, com);
		}
		Start(com, fun) {
			let that = this;
			// debugger;
			function parseView(view, fun) {
				if (typeof view == 'string') {
					console.log('PID ' + view);
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
						console.log('PID ' + basePid);
						console.log('DAT WAY');
						fun(basePid);
					});
				}
			}

			parseView(this.Par.Layout, (apexPid) => {
				// debugger;
				this.send({ Cmd: "GetViewRoot" }, apexPid, (err, com) => {
					// debugger;
					$(document.body).append(com.Div);

					this.send({ Cmd: "ShowHierarchy" }, apexPid, () => { });

					this.send({ Cmd: "Render" }, apexPid, () => { });

					$(window).resize(() => {
						this.send({ Cmd: "Resize" }, apexPid, () => { });
					});

					this.send({ Cmd: "DOMLoaded" }, apexPid, (err, com) => {
						fun(null, com);
					});
				});
			});
		}
	}

	return {
		dispatch: LayoutInitializer.prototype
	};

})();


