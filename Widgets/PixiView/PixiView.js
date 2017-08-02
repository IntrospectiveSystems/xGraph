//# sourceURL=PixiView.js
//Trevors first view class. This puts a basic pixi stage on the div and renders it.
(function PixiView() {

	let dispatch = {
		Setup: Setup,
		Start: Start,
	};

	//Using views we must inject basic functionality via the viewify script.
	//We no longer need to build divs in our view class just access the existing
	//div from this.Vlt.div. The div is already appended to the body.
	return Viewify(dispatch);

	function Setup(com, fun) {
		console.log("-PixiView/Setup");
		//we hoist the setup command to View.js in the viewif script.
		this.super(com, (err, cmd) => {
			//we access the existing div
			let div = this.Vlt.div;
			let Vlt = this.Vlt;
			
			//add a location to store the Pixi Stage and Renderer
			var Vew = {};
			div.data('View', Vew);
		
			Vew.Renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, { "antialias": true });
			div.append($(Vew.Renderer.view));

			Vew.Stage = new PIXI.Container();

			Vew.Renderer.backgroundColor = 0xA2A2A2;

			renderLoop();

			if (fun) {
				fun(null, com);
			}


			//-----------------------------------------------------Render
			function renderLoop() {
				let Vew = Vlt.div.data('View');
				Vew.Renderer.render(Vew.Stage);
				requestAnimationFrame(renderLoop);
			}
			
		});
	}

	function Start(com, fun) {
		console.log("--PixiView/Start");
		let Vew = this.Vlt.div.data('View');
		let that = this;

		let ob = new PIXI.Graphics();
		ob.position.set(50,50);
		// set a fill and line style
		ob.beginFill(0xFF0000);
		// set a fill and a line style again and draw a rectangle
		ob.drawCircle(0, 0, 30);
		ob.endFill();
	
		Vew.Stage.addChild(ob);

		if (fun)
			fun(null, com);
			
	}

})();
