//# sourceURL=RootView.js
//jshint esversion: 6
//test change
(function RootView() {

	/*
		The RootView class is the most basic Root Container View.
		RootView is a view that attaches itself to the DOM.
	 */
	class RootView {

        //-----------------------------------------------------Setup
		/*
			On Setup, Viewify builds the base class and shares it's context
			 with the sub-class, through this.super().
		 */
		Setup(com, fun) {
			this.super(com, (err, cmd) => {
				fun(null, com);
			});
		}

        //-----------------------------------------------------Start
		/*
			On Start, RootView expects a child View found in this.Par.Layout.
			this.Par.Layout should be an Object representation of a View,
			loaded from the page.json file.
			Start takes the object found in this.Par.Layout and builds the
			 View and it's children.
		 */
		Start(com, fun) {

			this.super(com, (err, cmd) => {

				let that = this;

				// on start, parse the view found in this.Par.Layout
				// then send
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

				/*
					parseView takes an object, 'view', which expects the properties
					 view.View as the View that attaches to the root view and view.Children
					 as an array of Views to be attached to the view.View.
				 */
                function parseView(view, fun) {
                    if (typeof view == 'string') {
                        console.log('PID ' + view);
                        fun(view);
                    } else {
                        let basePid = view.View;
                        async.each(view.Children,
                            function(item, next) {
                                parseView(item, (pid) => {
                                    that.send({
                                        Cmd: "AddView",
                                        View: pid
                                    }, basePid, () => {
                                        next();
                                    });
                                });
                            },
                            function() {
                                //done adding children
                                console.log('PID ' + basePid);
                                console.log('DAT WAY');
                                fun(basePid);
                            });
                    }
                }

			});
		}
	}

	return Viewify(RootView);

})();


