//# sourceURL=PixiView.js
//Trevors first view class. This puts a basic pixi stage on the div and renders it.
(function PixiView() {

	let dispatch = {
		Setup: Setup,
		Start: Start,
		DrawObjects,
		GetCanvas
	};

	//Using views we must inject basic functionality via the viewify script.
	//We no longer need to build divs in our view class just access the existing
	//div from this.Vlt.div. The div is already appended to the body.
	return Viewify(dispatch, "3.1");

	function Setup(com, fun) {
		console.log("-PixiView/Setup");
		//we hoist the setup command to View.js in the viewif script.
		this.super(com, (err, cmd) => {
			//we access the existing div
			let div = this.Vlt.div;
			let Vlt = this.Vlt;
			
			//add a location to store the Pixi Stage and Renderer
			this.Vlt.View = {};
			let Vew = this.Vlt.View;
			Vew.Renderer = PIXI.autoDetectRenderer(128, 128, { "antialias": true });
			div.append($(Vew.Renderer.view));
			Vew.Stage = new PIXI.Container();
			Vew.Renderer.backgroundColor = 0xA2A2A2;
			renderLoop();

			if (fun) {
				fun(null, com);
			}

			//-----------------------------------------------------Render
			function renderLoop() {
				Vew.Renderer.render(Vew.Stage);
				requestAnimationFrame(renderLoop);
			}
			
		});
	}

	function Start(com, fun) {
		console.log("--PixiView/Start");
		let Vew = this.Vlt.View;
		let Par = this.Par;
		let that = this;
		Vew.TileTable = {};

		that.send({Cmd: "GetData", "DataChannels":Par.DataChannels, "Pid":Par.Pid}, that.Par.Source, (err, com)=>{
			debugger;
			
			let Data = com.Data.Sar;
			Vew.Renderer.resize((Data.Width+1) , (Data.Height+1));
			let width = Data.Width, height = Data.Height;

			for (var i = 0; i < (Data.Width*Data.Height); i++) {
				let row = Math.floor(i/width);
				let col = i - row*width;
				let idx = (height - row)*width+col;

				let ob = new PIXI.Graphics();
				ob.position.set(row,col);
				// set a fill and line style
				ob.beginFill(0xFFFFFF);
				// set a fill and a line style again and draw a rectangle
				ob.drawRect(0, 0, 1, 1);
				ob.endFill();
			
				Vew.Stage.addChild(ob);
				Vew.TileTable[idx]=ob;

			}

			// let ob = new PIXI.Graphics();
			// ob.position.set(50,50);
			// // set a fill and line style
			// ob.beginFill(0xFF0000);
			// // set a fill and a line style again and draw a rectangle
			// ob.drawCircle(0, 0, 30);
			// ob.endFill();
		
			// Vew.Stage.addChild(ob);

			if ("WorldPid" in that.Vlt)
				that.send({ Cmd: "UpdateCanvas", canvas: Vew.Renderer.view}, that.Vlt.WorldPid, ()=>{});

			if (fun)
				fun(null, com);
		});
	}

	function DrawObjects(com,fun){


		if (fun)
			fun(null, com);
	}

	function GetCanvas(com, fun){
		//debugger;
		this.Vlt.WorldPid=com.pid;
		com.canvas = this.Vlt.View.Renderer.view;
		if (this.Par.Hidden)
			com.Div = this.Vlt.root;
		
		if (fun)
			fun(null, com);
	}

})();
