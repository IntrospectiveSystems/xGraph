//# sourceURL=View2_3D.js
(function View2_3D() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		SetPosition: SetPosition,
		DOMLoaded: DOMLoaded,
		Resize:Resize,
		Render,
		UpdateCanvas:UpdateCanvas,
		DispatchEvent
	};

	return Viewify(dispatch, "3.1");

	function UpdateCanvas(com,fun){
		//console.log("Canvas Update\n\n\n\n");
		//debugger;
		let width = com.width || com.canvas.width;
		let height = com.height || com.canvas.height;

		let canvas = com.canvas;

		// //let ctx = canvas.getContext('2d');
		
		// console.log(canvas.width, canvas.height);
		// let newWidth = nextHighestPowerOfTwo(canvas.width);
		// let newHeight = nextHighestPowerOfTwo(canvas.height);
		// console.log(newWidth,newHeight);
		// canvas.scale(newWidth/canvas.width, newHeight,canvas.height);
		
		this.Vlt.PlaneView = canvas;
		this.Vlt.vertices = new Float32Array([
			-width / 2, -height / 2, 0,
			-width / 2, height / 2, 0,
			width / 2, -height / 2, 0,

			-width / 2, height / 2, 0,
			width / 2, -height / 2, 0,
			width / 2, height / 2, 0
		]);
		//console.log(this.Vlt.vertices)
		//this.Vlt.material.needsUpdate = true;
		this.Vlt.geometry.attributes.position.needsUpdate = true;
		this.Vlt.geometry.needsUpdate = true;

		this.Vlt.texture.needsUpdate = true;
	}

	function Setup(com, fun) {
		this.super(com, (err, cmd) => {
			console.log('--View2_3D/Setup');
			
			var that = this;
			var Vlt = this.Vlt;
			var Par = this.Par;
			var div = this.Vlt.div[0];
			this.Vlt.View = {};
			let View = this.Vlt.View;
			// __Share[Par.Div] = View;
			View.Inst = {};

			View.Renderer = new THREE.WebGLRenderer({ antialias: true });
			View.Renderer.setClearColor(0xBEDCF7, 1);
			View.Renderer.setSize(div.scrollWidth, div.scrollHeight);
			div.appendChild(View.Renderer.domElement);

			View.Scene = new THREE.Scene();
			View.Focus = new THREE.Vector3(0.0, 0.0, 0.0);

			View.Camera = new THREE.PerspectiveCamera(45,
				div.scrollWidth / div.scrollHeight, 0.1, 40000);

			View.Light = new THREE.DirectionalLight(0xFFFFFF);
			View.Light.position.set(-40, 60, 100);
			View.Scene.add(View.Light);

			View.Ambient = new THREE.AmbientLight(0x808080);
			View.Scene.add(View.Ambient);

			View.Camera.position.x = 0;
			View.Camera.position.y = 0;
			View.Camera.position.z = 100;
			View.Camera.up.set(0.0, 0.0, 1.0);
			View.Camera.lookAt(View.Focus);
			View.Camera.updateProjectionMatrix();
			// TestFont(View, "Hello World");

			if (fun)
				fun();
		});
	}

	function DOMLoaded(com, fun) {
		this.super(com, (err, cmd) => {
			let View = this.Vlt.View;
			View.Renderer.setSize(this.Vlt.div[0].scrollWidth, this.Vlt.div[0].scrollHeight);
			View.Camera.aspect = this.Vlt.div[0].scrollWidth / this.Vlt.div[0].scrollHeight;
			View.Camera.updateProjectionMatrix();
			fun(null, com);
		});
	}

	function Render(com, fun){
		if (this.Vlt.MousePid){
			//debugger;
			this.send({ Cmd: "SetDomElement", "DomElement": this.Vlt.View.Renderer.domElement }, this.Vlt.MousePid, (err, cmd) => {
				console.log("Reappended listeners");
			
				this.super(com, fun);
			});
		}else{
			this.super(com, fun);
		}
	}

	function Resize(com, fun) {
		this.super(com, (err, cmd) => {
			let View = this.Vlt.View;
			View.Renderer.setSize(com.width, com.height);
			View.Camera.aspect = com.width / com.height;
			View.Camera.updateProjectionMatrix();
			fun(null, com);
		});
	}

	function Start(com, fun) {
		this.super(com, (err, cmd) => {
			console.log('--View2_3D/Start');			
			let that= this;
			var Par = that.Par;
			var Vault = that.Vlt;
			var View = that.Vlt.View;
			if ("SystemView2D" in this.Par || "Terrain"in this.Par){
				this.Vlt.PlaneViewPid= this.Par.SystemView2D;
				getMouse(getCanvas, fun);
			}else {
				getMouse(getMap,fun);
			}

			function getMouse(next, done){
				that.genModule({
					"Module": 'xGraph:Widgets/Mouse',
					"Par": {
						"Handler": that.Par.Pid
					}
				}, (err, pidApex) => {
					//debugger;
					that.Vlt.MousePid = pidApex;
					that.send({ Cmd: "SetDomElement", "DomElement": that.Vlt.View.Renderer.domElement }, that.Vlt.MousePid, (err, cmd) => {
						console.log("GenModed the Mouse and set the DomElement");
						if (next) 
							next(done);
						else 
							done(null, com);
					});
				});
			}

			function getMap(func){
				that.send({Cmd: "GetMap"}, that.Par.Source, (err, com)=>{
					var zipmod = new JSZip();
					zipmod.loadAsync(com.Zip, {base64: true}).then(function(zip){						
						zip.file('map').async('string').then(function(str) {
							Vault.PNG = str;
							Vault.Map = com.Map;
							debugger;

							let width = 48;
							let height = 48;
		
							Vault.geometry = new THREE.BufferGeometry();
		
							Vault.vertices = new Float32Array([
								-width / 2, -height / 2, 0,
								-width / 2, height / 2, 0,
								width / 2, -height / 2, 0,
					
								-width / 2, height / 2, 0,
								width / 2, -height / 2, 0,
								width / 2, height / 2, 0
							]);
		
							var uvs = new Float32Array([
								0,0,
								0,1,
								1,0,
								
								0,1,
								1,0,
								1,1
							]);
		
							Vault.geometry.addAttribute('position', new THREE.BufferAttribute(Vault.vertices, 3));
							Vault.geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
							Vault.geometry.dynamic=true;
							Vault.geometry.needsUpdate = true;

							
							var image = document.createElement('img');
							image.height = 4096;
							image.width = 4096;
							image.src = `data:image/png;base64,${Vault.PNG}`;
							document.body.appendChild(image);
							Vault.texture = new THREE.Texture();
							Vault.texture.image = image;
							image.onload = function() {
								Vault.texture.needsUpdate = true;
							};

							Vault.material = new THREE.MeshBasicMaterial({map: Vault.texture, side:THREE.DoubleSide});
							Vault.material.transparent=true;
							Vault.material.needsUpdate=true;

							var plane = new THREE.Mesh(Vault.geometry, Vault.material);
							View.Scene.add(plane);

							renderLoop();
							if (func)
								func(null, com);
							
							//-----------------------------------------------------Render
							function renderLoop() {
								View.Renderer.render(View.Scene, View.Camera);
								requestAnimationFrame(renderLoop);
							}
						});
					});
				});
			}

			function getCanvas(func){
				let dest = that.Vlt.PlaneViewPid || that.Par.Terrain;
				that.send({ Cmd: "GetCanvas", pid: that.Par.Pid }, dest, (err, com) => {
					if (err)
						console.log("Error getting Canvas ", err);
					if (com.Div){
						that.Vlt.terrainDiv = com.Div;
						that.Vlt.div.append(that.Vlt.terrainDiv);
						that.Vlt.terrainDiv.css("position", "absolute");
						that.Vlt.terrainDiv.css("left", `-${2*($(window).width() + com.Div.width())}px`);
					}
					let canvas = com.canvas;
					that.Vlt.PlaneView = canvas;

					let width = com.width || com.canvas.width;
					let height = com.height || com.canvas.height;

					Vault.geometry = new THREE.BufferGeometry();

					Vault.vertices = new Float32Array([
						-width / 2, -height / 2, 0,
						-width / 2, height / 2, 0,
						width / 2, -height / 2, 0,
			
						-width / 2, height / 2, 0,
						width / 2, -height / 2, 0,
						width / 2, height / 2, 0
					]);

					var uvs = new Float32Array([
						0,0,
						0,1,
						1,0,
						
						0,1,
						1,0,
						1,1
					]);

					Vault.geometry.addAttribute('position', new THREE.BufferAttribute(Vault.vertices, 3));
					Vault.geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
					Vault.geometry.dynamic=true;
					Vault.geometry.needsUpdate = true;

					Vault.texture = new THREE.Texture(Vault.PlaneView)
					Vault.texture.needsUpdate = true;

					Vault.material = new THREE.MeshBasicMaterial({map: Vault.texture, side:THREE.DoubleSide});
					Vault.material.transparent=true;
					Vault.material.needsUpdate=true;

					var plane = new THREE.Mesh(Vault.geometry, Vault.material);
					View.Scene.add(plane);

					
					renderLoop();
					if (func)
						func(null, com);
					
					//-----------------------------------------------------Render
					function renderLoop() {
						View.Renderer.render(View.Scene, View.Camera);
						requestAnimationFrame(renderLoop);
					}
				});
			}
		});
	}
	
	function nextHighestPowerOfTwo(x) {
		--x;
		for (var i = 1; i < 32; i <<= 1) {
			x = x | x >> i;
		}
		return x + 1;
	}

	//-------------------------------------------------SetPosition
	function SetPosition(com, fun) {
		//	console.log('--SetPositon');
		var Par = this.Par;
		var View = this.Vlt.div.data('View');
		obj3d = View.Inst[com.Instance];
		if ('Instance' in com) {
			if (obj3d) {
				if ('Position' in com) {
					var pos = com.Position;
					obj3d.position.x = pos[0];
					obj3d.position.y = pos[1];
					obj3d.position.z = pos[2];
				}
				if ('Axis' in com && 'Angle' in com) {
					var axis = new THREE.Vector3(...com.Axis);
					var angle = Math.PI * com.Angle / 180.0;
					obj3d.setRotationFromAxisAngle(axis, angle);
				}
			}
		}
		if (fun)
			fun(null, com);
	}


	//-----------------------------------------------------Dispatch
	function DispatchEvent(com, fun) {
		// console.log("--ThreeJsView/DispatchEvent", com.info.Action);
		let info = com.info;
		let Vlt = this.Vlt;
		Vlt.Mouse = com.mouse;

		var dispatch;
		if ('Dispatch' in Vlt) {
			dispatch = Vlt.Dispatch;
		} else {
			//console.log('Harvesting for dispatch');
			Vlt.Dispatch = {};
			dispatch = Vlt.Dispatch;
			//harvest(Translate);
			harvest(Rotate);
			harvest(Zoom);
			harvest(Keyed);
		}
		var key = Vlt.Mouse.Mode + '.' + info.Action;
		if (info.Action == 'LeftMouseDown')
			info = mouseRay(info, Vlt);
		if ('Type' in info)
			key += '.' + info.Type;
		if ('Key' in info)
			key += '.' + info.Key;
		info.Key = key;
		console.log(this.Par.View, 'Dispatch', key);
		if (key in dispatch) {
			var proc = dispatch[key];
			proc(info, Vlt);
		}

		function harvest(proc) {
			var q = {};
			q.Action = 'Harvest';
			q.Keys = [];
			proc(q, Vlt);
			for (var i = 0; i < q.Keys.length; i++) {
				var key = q.Keys[i];
				dispatch[key] = proc;
				//	console.log('key', key);
			}
		}
	}

	//-----------------------------------------------------mouseRay
	function mouseRay(info,Vlt) {
		//var info = {};
		console.log(info.Mouse)
		let View=Vlt.div.data("View");
		View.Ray.precision = 0.00001;
		container = Vlt.div[0];
		var w = container.clientWidth;
		var h = container.clientHeight - 2 * container.clientTop;
		var vec = new THREE.Vector2();
		vec.x = 2 * (info.Mouse.x - container.offsetLeft) / w - 1;
		vec.y = 1 - 2 * (info.Mouse.y - container.offsetTop) / h;
		View.Ray.setFromCamera(vec, View.Camera);
		var hits = View.Ray.intersectObjects(View.Scene.children, true);
		var hit;
		var obj;
		console.log('Hits length is', hits);
		for (var i = 0; i < hits.length; i++) {
			hit = hits[i];
			obj = hit.object;
			var pt;
			while (obj != null) {
				//console.log('hit', hit);
				//console.log('mouseRay', data);
				switch (obj.name) {
					case 'heatField':
						info.Type = 'heatField';
						info.Point = hit.point;
						break;
					case 'bugSystem':
						info.Type = 'bugSystem';
						info.Point = hit.point;
						break;
					default: 
						console.log(obj.name);
				}
				pt = hit.point;
				obj = obj.parent;
			}
		}
		return info;
	}


	//-----------------------------------------------------Select
	// Move/Rotate model object in construction phase
	// TBD: Remove Three.js dependancy
	function Select(info, Vlt) {
		var dispatch = {
			//'Idle.LeftMouseDown.Artifact': start,
			'Select1.Move.Artifact': move,
			'Select1.Move.Terrain': move,
			'Select1.LeftMouseUp': mouseup,
			'Select2.Move.Artifact': move,
			'Select2.Move.Terrain': move,
			'Select2.Wheel': spin,
			'Select2.LeftMouseDown.Terrain': stop,
			'Select2.LeftMouseDown.Artifact': stop
		}
		if (info.Action == 'Harvest') {
			for (key in dispatch)
				info.Keys.push(key);
			return;
		}

		let View = Vlt.View;
		if (info.Key in dispatch)
			dispatch[info.Key]();

		function start() {
			console.log('..select/start', info);
			var mouse = View.Mouse;
			mouse.Mode = 'Select1';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
			View.pidSelect = info.Pid;
		}

		// function mouseup() {
		// 	var mouse = Vew.Mouse;
		// 	mouse.Mode = 'Select2';
		// }

		// function spin() {
		// 	var q = {};
		// 	q.Cmd = 'Move';
		// 	q.Instance = Vew.pidSelect;
		// 	q.Spin = 6.0*info.Factor;
		// 	that.send(q, Par.View);
		// }

		// function move() {
		// //	console.log('..move', info);
		// 	if (!('Point' in info))
		// 		return;
		// 	var q = {};
		// 	q.Cmd = 'Move';
		// 	q.Instance = Vew.pidSelect;
		// 	var loc = [];
		// 	loc.push(info.Point.x);
		// 	loc.push(info.Point.y);
		// 	loc.push(info.Point.z);
		// 	q.Loc = loc;
		// 	that.send(q, Par.View);
		// }

		function stop() {
			View.Mouse.Mode = 'Idle';
			var q = {};
			q.Cmd = 'Save';
			q.Instance = View.pidSelect;
			that.send(q, Par.View);
		}
	}


	//-----------------------------------------------------Zoom
	// Move camera towards or away from Focus point
	// TBD: Remove Three.js dependancy
	function Zoom(info, Vlt) {
		if (info.Action == 'Harvest') {
			console.log('Harvest-Zoom');
			info.Keys.push('Idle.Wheel');
			return;
		}
		//console.log("Zooooooming");
		let View = Vlt.View;

		var v = new THREE.Vector3();
		v.fromArray(View.Camera.position.toArray());
		var vfoc = new THREE.Vector3();
		vfoc.fromArray(View.Focus.toArray());
		v.sub(vfoc);
		var fac;
		if (info.Factor > 0)
			fac = 0.95 * info.Factor;
		else
			fac = -1.05 * info.Factor;
		v.multiplyScalar(fac);
		var vcam = vfoc.clone();
		vcam.add(v);
		View.Camera.position.fromArray(vcam.toArray());
		View.Camera.lookAt(View.Focus);
		View.Camera.updateProjectionMatrix();
	}


	//-----------------------------------------------------Zoom
	// Move camera towards or away from Focus point
	// TBD: Remove Three.js dependancy
	function Keyed(info, Vlt) {
		if (info.Action == 'Harvest') {
			console.log('Harvest-Zoom');
			info.Keys.push('Idle.keydown.n');
			return;
		}
		//console.log("Zooooooming");
		let View = VltView;
	}


	//-----------------------------------------------------Rotate
	// Rotate view about current Focus
	// TBD: Remove Three.js dependancy
	function Rotate(info, Vlt) {
		var dispatch = {
			"Idle.LeftMouseDown":start,
			'Idle.RightMouseDown': start,
			'Rotate.Move': rotate,
			'Rotate.RightMouseUp': stop,
			'Rotate.LeftMouseUp': stop,
			'Rotate.MouseLeave': stop
		}
		if (info.Action == 'Harvest') {
			for (key in dispatch)
				info.Keys.push(key);
			return;
		}

		let View = Vlt.View;

		if (info.Key in dispatch)
			dispatch[info.Key]();

		function start() {
			//	console.log('..Rotate/start', info.Key);
			var mouse = Vlt.Mouse;
			mouse.Mode = 'Rotate';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function rotate() {
			//	console.log('..Rotate/move', info.Key);
			var mouse = Vlt.Mouse;
			var vcam = new THREE.Vector3();
			vcam.fromArray(View.Camera.position.toArray());
			var vfoc = new THREE.Vector3();
			vfoc.fromArray(View.Focus.toArray());
			var v1 = new THREE.Vector3(0.0, 0.0, 1.0);
			var v2 = vcam.clone();
			v2.sub(vfoc);
			var v3 = new THREE.Vector3();
			v3.crossVectors(v1, v2);
			v3.normalize();
			var ang = 0.003 * (mouse.x - info.Mouse.x);
			v2.applyAxisAngle(v1, ang);
			ang = 0.003 * (mouse.y - info.Mouse.y);
			v2.applyAxisAngle(v3, ang);
			vcam.copy(vfoc);
			vcam.add(v2);
			View.Camera.position.fromArray(vcam.toArray());
			View.Camera.lookAt(View.Focus);
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function stop() {
			console.log('..Rotate/stop', info.Key);
			//var Vlt = View;
			Vlt.Mouse.Mode = 'Idle';
		}
	}


})();

