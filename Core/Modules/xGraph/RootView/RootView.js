(
    /**
	 * @param {string=} this.Par.Layout 			The view that will be built and rendered by RootView.
	 * @param {string=} this.Par.Layout.View 		The view module that will be RootView's direct child.
	 * @param {array=} this.Par.Layout.Children 	If the view module specified in the "View" parameter can load
	 * 													child views, list he child views here.
     * @constructor
     */
	function RootView() {

	class RootView {

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
		 * 4) Propagates a Render, Resize, DOMLoaded, Resize, in that order.
		 * @param {object} com
		 * @callback fun
		 * @memberof RootView
		 */
		async Start(com, fun) {
			log.v(`--RootView::Start`);
			let that = this;


            let apexPid = await parseView(this.Par.Layout);

			async function parseView(view) {
				if (typeof view == 'string') {
					return view;
				} else {
					let basePid = view.View;

					for (let item of view.Children) {
						let pid = await parseView(item);
						log.v(pid);
						await that.ascend("AddView", { View: pid }, basePid);
					}
					return basePid;
				}
			}


			this.send({ Cmd: "GetViewRoot" }, apexPid, callback);

            function callback(err, com){

                let apexDiv = com.Div;
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
                    fun(null, com);
                });
            }


		}
	}

	return Viewify(RootView, "3.4");

})();