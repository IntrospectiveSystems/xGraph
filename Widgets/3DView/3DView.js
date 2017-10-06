//# sourceURL=3DView
(function _3DView(){

	//-----------------------------------------------------dispatch
	let dispatch = {
		Setup,
		Start,
		SetObjects,
		Resize,
		Render,
		DOMLoaded,
		DispatchEvent,
		EvokeExample
	};

	return Viewify(dispatch, "3.1");

	function Setup(com, fun) {
		this.super(com, (err, cmd) => {
			console.log('--3DView/Setup');
			let div = this.Vlt.div;
			this.Vlt.View= {};
			View = this.Vlt.View;
			View.Geometries={};
			View.Meshs = {};
			View.ResponseHandlers = {};

			View.Ray = new THREE.Raycaster();
			View.Renderer = new THREE.WebGLRenderer({ antialias: true });
			View.Renderer.setClearColor(0xBEDCF7, 1);
			View.Renderer.setSize(div.width(), div.height());
			View.Scene = new THREE.Scene();
			View.Focus = new THREE.Vector3(50.0, 50.0, 0.0);
			View.Camera = new THREE.PerspectiveCamera(45,
				div.width / div.height, 0.1, 40000);
			div.append(View.Renderer.domElement);
			View.Light = new THREE.DirectionalLight(0xFFFFFF);
			View.Light.position.set(-40, 60, 100);
			View.Scene.add(View.Light);
			View.Ambient = new THREE.AmbientLight(0x808080);
			View.Scene.add(View.Ambient);
			var axes = new THREE.AxisHelper(100);
			axes.position.z = 0.01;
			View.Scene.add(axes);
			View.Camera.position.x = 0;
			View.Camera.position.y = 0;
			View.Camera.position.z = 50;
			View.Camera.up.set(0.0, 0.0, 1.0);
			View.Camera.lookAt(View.Focus);
			View.Camera.updateProjectionMatrix();

			loop();
			fun(null, com);

			function loop() {
				View.Renderer.render(View.Scene, View.Camera);
				requestAnimationFrame(loop);
			}
		});
	}

	function Start(com, fun) {
		console.log('--3DView/Start');
		


		fun(null, com);

		///
		//
		//
		//
		//
		//
		//			EXAMPLE CODE FOR ADDING OBJECTS TO WORLD
		//
		//
		//
		//
		//
		//
		//add some objects to the world
		let q={}
		q.Cmd = "SetObjects";
		q.Objects = [];

		//add 20 ellipsoids with random location and scales
		for (let idx = 0; idx< 20; idx++){
			obj = {
				id  : idx,
				geometry: {
					id : "geom",
					name: "SphereGeometry",
					arguments: [1,64,64]
				},
				mesh : {
					id : "mesh",
					name: "MeshPhongMaterial",
					arguments: {
						color : 0xFFFFFF*Math.random()
					}
				},
				position: {
					x: 100*Math.random(),
					y: 100*Math.random(),
					z: 100*Math.random()
				},
				scale: {
					x:10*Math.random(),
					y:10*Math.random(),
					z:10*Math.random()
				},
				responseHandler: {
					Cmd:"EvokeExample",
					Handler: this.Par.Pid
				}
			};
			q.Objects.push(obj);
		}
		// add a plane
		obj = {
			id  : "plane",
			geometry: {
				id : "PlaneGeom",
				name: "PlaneGeometry",
				arguments: [100,100,99,99]
			},
			mesh : {
				id : "planeMesh",
				name: "MeshBasicMaterial",
				arguments: {
					color:0x333333
				}
			},
			position: {
				x: 50,
				y: 50,
				z: 0
			}
		};
		q.Objects.push(obj);

		this.send(q, this.Par.Pid, _=>
			//callback
			console.log("we sent the objects to be added to the scene")
		);


		/*






		END EXAMPLE CODE








		*/
	}

	function EvokeExample(com, fun){
		console.log("EVOKE EXAMPLE", com.id);

		console.log("Popup");
		this.genModule({
			"Module": "xGraph:Widgets/Popup",
			"Par": {
				Left: com.mouse.x,
				Top: com.mouse.y,
				"View": "xGraph:Widgets/3DView",
				"Width": 800,
				"Height" : 600
			}
		}, ()=>{})


		if (fun)
			fun(null, com)
	}

	function DOMLoaded(com, fun) {
		console.log("--3DView/DOMLoaded");
		this.super(com, fun);
		let div = this.Vlt.div;
		div.append(this.Vlt.View.Renderer.domElement);
		let View = this.Vlt.View;
		View.Renderer.setSize(div.width(), div.height());
		View.Camera.aspect = div.width() / div.height();
		View.Camera.updateProjectionMatrix();

		this.genModule({
			"Module": 'xGraph:Widgets/Mouse',
			"Par": {
				"Handler": this.Par.Pid
			}
		}, (err, pidApex) => {
			this.send({ 
				Cmd: "SetDomElement", 
				"DomElement": this.Vlt.View.Renderer.domElement 
			}, pidApex, (err, cmd) => {
				console.log("GenModed the Mouse and set the DomElement");
				//fun(null, com);
			});
		});
	}


	function Render(com, fun){
		console.log("--3DView/Render", this.Par.Pid.substr(24));
		this.Vlt.div.append(this.Vlt.View.Renderer.domElement);
		this.super(com, fun);
	}


	function Resize(com, fun) {
		//console.log("--3DView/Resize")
		this.super(com, (err, cmd) => {
			let View = this.Vlt.View;
			View.Renderer.setSize(cmd.width, cmd.height);
			View.Camera.aspect = cmd.width / cmd.height;
			View.Camera.updateProjectionMatrix();
			fun(null, com);
		});
	}


	function SetObjects(com, fun){
		/**
		 * 
		 * the com will contain an Objects key that lists an array of objects
		 * to be modified on the 3d view. All of the listed attributes need NOT
		 * exist. Only a unit ID is required.
		 * 
		 * 
		 * com.Objects = [
		 * 		{
		 * 			id  = "some Unique ID usually can be a Pid",
		 * 			geometry: {
		 * 				id : "specific Geometry id///will be stored for reuse",
		 * 				name: "SphereGeometry",
		 * 				arguments: [1,64,64]},
		 * 			},
		 * 			mesh: {
		 * 				id : "specific Mesh id",
		 * 				name: "MeshBasicMaterial",
		 * 				arguments: {
		 * 					color : 0x00ff00
		 * 				}
		 * 			},
		 * 			position: {
		 * 				x: 20,
		 * 				y: 30,
		 * 				z: 40
		 * 			},
		 * 			scale: {
						x:1.0,
						y:2.0,
						z:3.0
					},
		 * 			removed: true,
		 * 			responseHandler: {
						Cmd:"Evoke",
						Handler: this.Par.Pid
					}
		 * 		}
		 * ]
		 */
		
		for (let i = 0;i<com.Objects.length;i++){
			
			let unit = com.Objects[i];
			if (!unit.id && (unit.id !=0)){
				console.log("A unit sent to 3DView/SetObjects did not have an id");
				continue;
			}
			
			let obj = this.Vlt.View.Scene.getObjectByName( unit.id );

			if (!obj){
				if(!unit.geometry || !unit.mesh){
					console.log("A unit sent to 3DView/SetObjects did not have a geometry or mesh");
					continue;
				}
				let geom, mesh;

				if ("id" in unit.geometry){
					if (unit.geometry.id in this.Vlt.View.Geometries){
						geom  = this.Vlt.View.Geometries[unit.geometry.id];
					} else {
						geom = new THREE[unit.geometry.name](...unit.geometry.arguments);
						this.Vlt.View.Geometries[unit.geometry.id] = geom;
					}
				} else{
					geom = new THREE[unit.geometry.name](...unit.geometry.arguments);
				}

				if ("id" in unit.mesh){
					if (unit.mesh.id in this.Vlt.View.Meshs){
						mesh  = this.Vlt.View.Meshs[unit.mesh.id];
					} else {
						mesh = new THREE[unit.mesh.name](unit.mesh.arguments);
						this.Vlt.View.Meshs[unit.mesh.id] = mesh;
					}
				} else{
					mesh = new THREE[unit.mesh.name](...unit.mesh.arguments);
				}

				obj = new THREE.Mesh(geom,mesh);
				obj.name = unit.id;
			}
			else if (unit.removed){
				this.Vlt.View.Scene.remove(obj);
				continue;
			}
			
			if (unit.position){
				if (unit.position.x)
					obj.position.x = Math.round(unit.position.x);
				if (unit.position.y)
					obj.position.y = Math.round(unit.position.y);
				if (unit.position.z)
					obj.position.z = Math.round(unit.position.z)
			}

			if (unit.scale){
				obj.scale.set(unit.scale.x||1,unit.scale.y||1, unit.scale.z||1);
			}

			if (unit.responseHandler){
				this.Vlt.View.ResponseHandlers[unit.id]=unit.responseHandler;
			}

			this.Vlt.View.Scene.add(obj);
		}
	}




	//-----------------------------------------------------Dispatch
	function DispatchEvent(com) {
		//debugger;
		// if ((!com.Shared) && ("ShareDispatch" in this.Par)){
			
		// 	let q=JSON.parse(JSON.stringify(com));

		// 	q.Shared = true;
		// 	for (let i = 0;i< this.Par.ShareDispatch.length;i++){
		// 		this.send(q, this.Par.ShareDispatch[i]);
		// 	}
		// }
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

			//harvest(Select);
			harvest(Rotate);
			harvest(Zoom);
			harvest(Keyed);
		}
		var key = Vlt.Mouse.Mode + '.' + info.Action;
		if (info.Action == 'LeftMouseDown'){
			info = mouseRay(info, Vlt);
			if (info.obj.responseHandler){
				this.send({Cmd:info.obj.responseHandler.Cmd, id:info.obj.id, point:info.point, mouse:info.Mouse}, info.obj.responseHandler.Handler, _=>{
					//
					//
					//may need to handle evoke callback here
					//
					//
					console.log("Evoke example callback")
				});
			}
			return;
		}
		if ('Type' in info)
			key += '.' + info.Type;
		if ('CharKey' in info)
			key += '.' + info.CharKey;
		info.Key = key;
		//console.log(this.Par.View, 'Dispatch', key);
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
		//console.log(info.Mouse)
		let View=Vlt.View;
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
		//console.log('Hits length is', hits);
		for (var i = 0; i < hits.length; i++) {
			hit = hits[i];
			obj = hit.object;
			var pt;
			if (obj != null) {
				//console.log('hit', hit);
				//console.log('mouseRay', data);
				info.obj = {};
				info.obj.id = obj.name
				info.obj.responseHandler = Vlt.View.ResponseHandlers[info.obj.id] || undefined;
				info.point = hit.point;
				return info
			}
		}
		return info;
	}


	// //-----------------------------------------------------Select
	// // Move/Rotate model object in construction phase
	// // TBD: Remove Three.js dependancy
	// function Select(info, Vlt) {
	// 	var dispatch = {
	// 		'Idle.LeftMouseDown.Artifact': start,
	// 		'Select1.Move.Artifact': move,
	// 		'Select1.Move.Terrain': move,
	// 		'Select1.LeftMouseUp': mouseup,
	// 		'Select2.Move.Artifact': move,
	// 		'Select2.Move.Terrain': move,
	// 		'Select2.Wheel': spin,
	// 		'Select2.LeftMouseDown.Terrain': stop,
	// 		'Select2.LeftMouseDown.Artifact': stop
	// 	}
	// 	if (info.Action == 'Harvest') {
	// 		for (key in dispatch)
	// 			info.Keys.push(key);
	// 		return;
	// 	}

	// 	let View = Vlt.View;
	// 	if (info.Key in dispatch)
	// 		dispatch[info.Key]();

	// 	function start() {
	// 		//console.log('..select/start', info);
	// 		var mouse = View.Mouse;
	// 		mouse.Mode = 'Select1';
	// 		mouse.x = info.Mouse.x;
	// 		mouse.y = info.Mouse.y;
	// 		View.pidSelect = info.Pid;
	// 	}

	// 	function mouseup() {
	// 		var mouse = Vew.Mouse;
	// 		mouse.Mode = 'Select2';
	// 	}

	// 	function spin() {
	// 		var q = {};
	// 		q.Cmd = 'Move';
	// 		q.Instance = Vew.pidSelect;
	// 		q.Spin = 6.0*info.Factor;
	// 		that.send(q, Par.View);
	// 	}

	// 	function move() {
	// 	//	console.log('..move', info);
	// 		if (!('Point' in info))
	// 			return;
	// 		var q = {};
	// 		q.Cmd = 'Move';
	// 		q.Instance = Vew.pidSelect;
	// 		var loc = [];
	// 		loc.push(info.Point.x);
	// 		loc.push(info.Point.y);
	// 		loc.push(info.Point.z);
	// 		q.Loc = loc;
	// 		that.send(q, Par.View);
	// 	}

	// 	function stop() {
	// 		View.Mouse.Mode = 'Idle';
	// 		var q = {};
	// 		q.Cmd = 'Save';
	// 		q.Instance = View.pidSelect;
	// 		that.send(q, Par.View);
	// 	}
	// }


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


	//-----------------------------------------------------Keyed
	// keydown event
	// TBD: Remove Three.js dependancy
	function Keyed(info, Vlt) {
		if (info.Action == 'Harvest') {
			console.log('Harvest-Keyed');
			info.Keys.push('Idle.keydown.n');
			return;
		}
		let View = VltView;
	}


	//-----------------------------------------------------Rotate
	// Rotate view about current Focus
	// TBD: Remove Three.js dependancy
	function Rotate(info, Vlt) {
		
		var dispatch = {
			// "Idle.LeftMouseDown":start,
			'Idle.RightMouseDown': start,
			'Rotate.Move': rotate,
			'Rotate.RightMouseUp': stop,
			//'Rotate.LeftMouseUp': stop,
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
			// console.log('..Rotate/start', info.Key);
			var mouse = Vlt.Mouse;
			mouse.Mode = 'Rotate';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function rotate() {
			// console.log('..Rotate/move', info.Key);
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
			// console.log('..Rotate/stop', info.Key);
			//var Vlt = View;
			Vlt.Mouse.Mode = 'Idle';
		}
	}


})();

