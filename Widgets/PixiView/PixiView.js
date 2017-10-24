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
			let View = this.Vlt.View;


	
			View.Renderer = PIXI.autoDetectRenderer(2048, 2048, { "antialias": true });
			div.append($(View.Renderer.view));
			View.Stage = new PIXI.Container();
			View.Renderer.backgroundColor = 0xA2A2A2;
			View.Renderer.render(View.Stage);
			
			if (fun) {
				fun(null, com);
			}		
		});
	}

	function Start(com, fun) {
		console.log("--PixiView/Start");
		if (this.Vlt.Started == true){
			fun(null, com);
			return;
		}
		this.Vlt.Started =true;
		let View = this.Vlt.View;
		let Par = this.Par;
		let that = this;
		View.TileTable = {};

		that.send({Cmd: "GetData", "DataChannels":Par.DataChannels, "Pid":Par.Pid}, that.Par.Source, (err, com)=>{
			// debugger;

			let Data = com.Data.Sar;
			[View.Width,View.Height] = [Data.Width, Data.Height];
			//View.Renderer.resize((Data.Width+1) , (Data.Height+1));
			let width = 2048, height = 2048;
			let widthUnit = width/(Data.Width+1), heightUnit = height/(Data.Height+1);

			for (var i = 0; i < (Data.Width+1)*(Data.Height+1); i++) {
				let row = Math.floor(i/Data.Width);
				let col = i - row*Data.Width;
				let idx = (Data.Height - row)*Data.Width+col;

				let ob = new PIXI.Graphics();
				ob.position.set(col*widthUnit,row*heightUnit);
				// console.log([col,row], idx);
				// set a fill and line style
				ob.beginFill(0xFFFFFF);
				// set a fill and a line style again and draw a rectangle
				ob.drawRect(0, 0, widthUnit, heightUnit);
				ob.endFill();
				ob.tint = (Data.Data[idx] in Data.Dictionary)? Data.Dictionary[Data.Data[idx]]:Data.Dictionary["default"];

				View.Stage.addChild(ob);
				View.TileTable[idx]=ob;
			}
			View.Renderer.render(View.Stage);
			
			View.SarData =Data.Data;
			

			// debugger;
			// let ob = new PIXI.Graphics();
			// ob.position.set(50,50);
			// // set a fill and line style
			// ob.beginFill(0xFF0000);
			// // set a fill and a line style again and draw a rectangle
			// ob.drawCircle(0, 0, 30);
			// ob.endFill();
		
			// View.Stage.addChild(ob);

			if ("WorldPid" in that.Vlt){
				// debugger;
				that.send({ Cmd: "UpdateCanvas", canvas: View.Renderer.view, Width: View.Width, Height:View.Height}, that.Vlt.WorldPid, ()=>{});
			}
			if (fun)
				fun(null, com);
		});
	}

	function DrawObjects(com,fun){
		//console.log("--PixiView/DrawObjects");
		let View = this.Vlt.View;
		let Data = com.Data;
		
		View.SarData =Data.Data;

		let width = 2048, height = 2048;
		let widthUnit = width/(Data.Width+1), heightUnit = height/(Data.Height+1);
		let row, col, idx, ob, newtint;

		for (var i = 0; i < (View.Width+1)*(View.Height+1); i++) {
			row = Math.floor(i/Data.Width);
			col = i - row*Data.Width;
			idx = (Data.Height - row)*Data.Width+col;
			
			ob = View.TileTable[idx];
			newtint = (Data.Data[idx] in Data.Dictionary)? Data.Dictionary[Data.Data[idx]]:Data.Dictionary["default"];
			if (ob.tint != newtint){
				//console.log("++");
				ob.tint = newtint;
			}
		}	

		View.Renderer.render(View.Stage);
		if ("WorldPid" in this.Vlt){
			// debugger;
			this.send({ Cmd: "UpdateCanvas", canvas: View.Renderer.view, Width: View.Width, Height:View.Height}, this.Vlt.WorldPid, ()=>{});
		}
		if (fun)
			fun(null, com);
	}

	function GetCanvas(com, fun){
		console.log("PixiView/GetCanvas");
		let that = this;
		if (!this.Vlt.Started){
			this.send({Cmd:"Start"}, this.Par.Pid, getCanvas);
			return;
		}
		getCanvas()
		function getCanvas(){

			let View = that.Vlt.View;
			that.Vlt.WorldPid=com.pid;
			[com.Width, com.Height] = [View.Width+1,View.Height+1];
			
			com.canvas = View.Renderer.view;
			if (that.Par.Hidden)
				com.Div = that.Vlt.root;
			
			if (fun)
				fun(null, com);
		}
	}

})();
