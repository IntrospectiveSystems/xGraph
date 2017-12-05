//# sourceURL=PixiView.js
(
	/**
	 * The PixiView entity is the Apex and only entity of the PixiView Module.
	 * This entity requres its Setup function invoked during the Setup phase of Nexus startup.
	 * The main capability of this entity is to add and render a pixi stage on the div provided by 
	 * the Viewify class (its stored in this.Vlt.div). See Viewify documentation for more info on this.
	 */
	function PixiView() {

		let dispatch = {
			Setup,
			Start,
			DrawObjects,
			GetCanvas
		};

		//Using views we must inject basic functionality via the viewify script.
		//We no longer need to build divs in our view class just access the existing
		//div from this.Vlt.div. The div is already appended to the body.
		return Viewify(dispatch, "3.1");

		/**
		 * Create the Pixi renderer and Stage and append the renderer.view to the div
		 * @param {Object} com 
		 * @param {Function} fun 
		 */
		function Setup(com, fun) {
			log.i("-PixiView/Setup");

			//we hoist the setup command to View.js in the viewif script.
			this.super(com, (err, cmd) => {
				//we access the existing div
				let div = this.Vlt.div;

				//add a location to store the Pixi Stage and Renderer
				this.Vlt.View = {};
				let View = this.Vlt.View;

				View.Renderer = PIXI.autoDetectRenderer(2048, 2048, { "antialias": true });
				div.append($(View.Renderer.view));
				View.Stage = new PIXI.Container();
				View.Renderer.backgroundColor = 0xA2A2A2;
				View.Renderer.render(View.Stage);
				fun(null, com);
			});
		}

		/**
		 * Retreives the data from this.Par.Source if defined 
		 * @param {Object} com 
		 * @param {Function} fun 
		 */
		function Start(com, fun) {
			log.i("--PixiView/Start");
			if (this.Vlt.Started == true) {
				fun(null, com);
				return;
			}

			this.Vlt.Started = true;
			let View = this.Vlt.View;
			this.View.TileTable = {};

			if (!("Source" in this.Par)) {
				fun(null, com);
				return;
			}

			this.send({ Cmd: "GetData", "DataChannels": this.Par.DataChannels, "Pid": this.Par.Pid }, this.Par.Source, (err, com) => {

				let Data = com.Data.Sar;
				[View.Width, View.Height] = [Data.Width, Data.Height];
				let width = 2048, height = 2048;
				let widthUnit = width / (Data.Width + 1), heightUnit = height / (Data.Height + 1);

				for (var i = 0; i < (Data.Width + 1) * (Data.Height + 1); i++) {
					let row = Math.floor(i / Data.Width);
					let col = i - row * Data.Width;
					let idx = (Data.Height - row) * Data.Width + col;

					let ob = new PIXI.Graphics();
					ob.position.set(col * widthUnit, row * heightUnit);
					// set a fill and line style
					ob.beginFill(0xFFFFFF);
					// set a fill and a line style again and draw a rectangle
					ob.drawRect(0, 0, widthUnit, heightUnit);
					ob.endFill();
					ob.tint = (Data.Data[idx] in Data.Dictionary) ? Data.Dictionary[Data.Data[idx]] : Data.Dictionary["default"];

					View.Stage.addChild(ob);
					View.TileTable[idx] = ob;
				}
				View.Renderer.render(View.Stage);
				View.SarData = Data.Data;

				if ("WorldPid" in this.Vlt) {
					this.send({ Cmd: "UpdateCanvas", canvas: View.Renderer.view, Width: View.Width, Height: View.Height }, this.Vlt.WorldPid, () => { });
				}
				fun(null, com);
			});
		}

		function DrawObjects(com, fun = _ => _) {
			log.i("--PixiView/DrawObjects");
			let View = this.Vlt.View;
			let Data = com.Data;

			View.SarData = Data.Data;

			let width = 2048, height = 2048;
			let widthUnit = width / (Data.Width + 1), heightUnit = height / (Data.Height + 1);
			let row, col, idx, ob, newtint;

			for (var i = 0; i < (View.Width + 1) * (View.Height + 1); i++) {
				row = Math.floor(i / Data.Width);
				col = i - row * Data.Width;
				idx = (Data.Height - row) * Data.Width + col;

				ob = View.TileTable[idx];
				newtint = (Data.Data[idx] in Data.Dictionary) ? Data.Dictionary[Data.Data[idx]] : Data.Dictionary["default"];
				if (ob.tint != newtint) {
					ob.tint = newtint;
				}
			}

			View.Renderer.render(View.Stage);
			if ("WorldPid" in this.Vlt) {
				this.send({ Cmd: "UpdateCanvas", canvas: View.Renderer.view, Width: View.Width, Height: View.Height }, this.Vlt.WorldPid, () => { });
			}
			fun(null, com);
		}

		function GetCanvas(com, fun = _ => _) {
			console.log("PixiView/GetCanvas");
			if (!this.Vlt.Started) {
				this.send({ Cmd: "Start" }, this.Par.Pid, () => {
					let View = this.Vlt.View;
					this.Vlt.WorldPid = com.pid;
					[com.Width, com.Height] = [View.Width + 1, View.Height + 1];

					com.canvas = View.Renderer.view;
					if (this.Par.Hidden)
						com.Div = this.Vlt.root;

					fun(null, com);

				});
				return;
			}

			let View = this.Vlt.View;
			this.Vlt.WorldPid = com.pid;
			[com.Width, com.Height] = [View.Width + 1, View.Height + 1];

			com.canvas = View.Renderer.view;
			if (this.Par.Hidden)
				com.Div = this.Vlt.root;

			fun(null, com);

		}

	})();
