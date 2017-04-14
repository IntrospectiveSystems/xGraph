(function View() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--View/Setup');
		var that = this;
		var Vlt = this.Vlt;
		Vlt.Mouse = {};
		Vlt.Mouse.Mode = 'Idle';
		Vlt.Mouse.inPanel = true;
		Vlt.Ray = new THREE.Raycaster();
		var div = document.getElementById("Grok");
		Vlt.Render = new THREE.WebGLRenderer({antialias: true});
		//vlt.Render.setClearColor(0xF2EEE1, 1);
		Vlt.Render.setClearColor(0xBEDCF7, 1);
		Vlt.Render.setSize(div.scrollWidth, div.scrollHeight);
		Vlt.Scene = new THREE.Scene();
		Vlt.Focus = new THREE.Vector3(0.0, 0.0, 0.0);
		Vlt.Camera = new THREE.PerspectiveCamera(45,
			div.scrollWidth / div.scrollHeight, 0.1, 40000);
		div.appendChild(Vlt.Render.domElement);
		var Grok = $('#Grok');
		Grok.mouseenter(function (evt) {
			mouseEnter(evt, that);
		});
		Grok.mouseleave(function (evt) {
			mouseLeave(evt, that);
		});
		Grok.bind('mousewheel DOMMouseScroll', function (evt) {
			mouseWheel(evt, that);
		});
		Grok.mousedown(function (evt) {
			mouseDown(evt, that);
		});
		Grok.mousemove(function (evt) {
			mouseMove(evt, that);
		});
		Grok.mouseup(function (evt) {
			mouseUp(evt, that);
		});
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--View/Start');
		console.log('Par', this.Par);
		var Vlt = this.Vlt;
		var Par = this.Par;
		console.log('View/Par', Par);
		var axes = new THREE.AxisHelper(100);
		axes.position.z = 0.01;
		Vlt.Scene.add(axes);
		Vlt.Camera.position.x = -7;
		Vlt.Camera.position.y = -20.0;
		Vlt.Camera.position.z = 20.0;
		Vlt.Camera.up.set(0.0, 0.0, 1.0);
		Vlt.Camera.lookAt(Vlt.Focus);
		Vlt.Camera.updateProjectionMatrix();
		renderLoop();
//		Vlt.Render.render(Vlt.Scene, Vlt.Camera);
		var q = {};
		q.Cmd = 'GetGraph';
		this.send(q, Par.Scene, scene);

		function scene(err, q) {
			console.log('..View/scene');
			if(err)
				console.log(' ** ERR:' + err);
			if(fun)
				fun();
		}

		//-----------------------------------------------------Render
		function renderLoop() {
			loop();

			function loop() {
				Vlt.Render.render(Vlt.Scene, Vlt.Camera);
				requestAnimationFrame(loop);
			}
		}

	}

	//-----------------------------------------------------mouseEnter
	function mouseEnter(evt, that) {
	}

	//-----------------------------------------------------mouseLeave
	function mouseLeave(evt, that) {
	}

	//-----------------------------------------------------mouseDown
	function mouseDown(evt, that) {
		var vlt = that.Vlt;
		var info = mouseRay(vlt, evt);
		if (info == null)
			info = {};
		info.Mouse = {};
		info.Mouse.x = evt.clientX;
		info.Mouse.y = evt.clientY;
		switch (evt.which) {
			case 1:	// Left mouse
				info.Action = 'LeftMouseDown';
				break;
			case 3: // Right mouse
				info.Action = 'RightMouseDown';
				break;
			default:
				return;
		}
		Dispatch(info, that);
		evt.stopPropagation();
		evt.returnValue = false;
	}

	//-----------------------------------------------------mouseUp
	function mouseUp(evt, that) {
		var info = {};
		switch (evt.which) {
			case 1:	// Left mouse
				info.Action = 'LeftMouseUp';
				break;
			case 3: // Right mouse
				info.Action = 'RightMouseUp';
				break;
			default:
				return;
		}
		Dispatch(info, that);
		evt.stopPropagation();
		evt.returnValue = false;
	}

	//-----------------------------------------------------mouseWheel
	function mouseWheel(evt, that) {
		var fac;
		var delta = evt.originalEvent.wheelDelta;
		if (delta != null) {
			fac = delta / 120;
		} else {
			delta = evt.originalEvent.detail;
			fac = -delta / 3;
		}
		var info = {};
		info.Action = 'Wheel';
		info.Factor = fac;
		Dispatch(info, that);
		evt.stopPropagation();
		evt.returnValue = false;
	}

	//-----------------------------------------------------mouseMove
	function mouseMove(evt, that) {
		var vlt = that.Vlt;
		var info = mouseRay(vlt, evt);
		if (!info)
			return;
		info.Action = 'Move';
		info.Mouse = {};
		info.Mouse.x = evt.clientX;
		info.Mouse.y = evt.clientY;
		Dispatch(info, that);
		evt.stopPropagation();
		evt.returnValue = false;
	}

	//-----------------------------------------------------Dispatch
	function Dispatch(info, that) {
		var vlt = that.Vlt;
		var dispatch;
		if ('Dispatch' in vlt) {
			dispatch = vlt.Dispatch;
		} else {
			vlt.Dispatch = {};
			dispatch = vlt.Dispatch;
			harvest(Translate);
			harvest(Rotate);
			harvest(Select);
			harvest(Zoom);
			harvest(Evoke);
		}
		var key = vlt.Mouse.Mode + '.' + info.Action;
		if ('Type' in info)
			key += '.' + info.Type;
		info.Key = key;
//		console.log('Dispatch', key);
		if (key in dispatch) {
			var proc = dispatch[key];
			proc(info, that);
		}

		function harvest(proc) {
			var q = {};
			q.Action = 'Harvest';
			q.Keys = [];
			proc(q, that);
			for(var i=0; i<q.Keys.length; i++) {
				var key = q.Keys[i];
				dispatch[key] = proc;
				//	console.log('key', key);
			}
		}
	}

	//-----------------------------------------------------Zoom
	// Move camera towards or away from Focus point
	// TBD: Remove Three.js dependancy
	function Zoom(info, that) {
		var vlt = that.Vlt;
		if(info.Action == 'Harvest') {
			info.Keys.push('Idle.Wheel');
			return;
		}
		var v = new THREE.Vector3();
		v.fromArray(getCamera(vlt));
		var vfoc = new THREE.Vector3();
		vfoc.fromArray(getFocus(vlt));
		v.sub(vfoc);
		var fac;
		if (info.Factor > 0)
			fac = 0.95 * info.Factor;
		else
			fac = -1.05 * info.Factor;
		v.multiplyScalar(fac);
		var vcam = vfoc.clone();
		vcam.add(v);
		setCamera(vlt, vcam.toArray());
	}

	//-----------------------------------------------------Translate
	// Move in a plane perpendicular to the view vector
	// TBD: Remove Three.js dependancy
	function Translate(info, that) {
		var vlt = that.Vlt;
		var dispatch = {
			'Idle.LeftMouseDown.Terrain': start,
			'Idle.LeftMouseDown': start,
			'Translate.Move': move,
			'Translate.Move.Terrain': move,
			'Translate.LeftMouseUp': stop
		}
		if(info.Action == 'Harvest') {
			for(key in dispatch)
				info.Keys.push(key);
			return;
		}
		if(info.Key in dispatch)
			dispatch[info.Key]();

		function start() {
			//	console.log('..Translate/start', info.Key);
			var mouse = that.Vlt.Mouse;
			mouse.Mode = 'Translate';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function move() {
			//	console.log('..Translate/move', info.Key);
			var mouse = vlt.Mouse;
			var vcam = new THREE.Vector3();
			vcam.fromArray(getCamera(vlt));
			var vfoc = new THREE.Vector3();
			vfoc.fromArray(getFocus(vlt));
			var v1 = new THREE.Vector3(0.0, 0.0, 1.0);
			var v2 = vcam.clone();
			v2.sub(vfoc);
			v2.normalize();
			var v3 = new THREE.Vector3();
			v3.crossVectors(v1, v2);
			var v4 = new THREE.Vector3();
			v4.crossVectors(v1, v3);
			var fac = 0.2 * (mouse.x - info.Mouse.x);
			v3.multiplyScalar(fac);
			vcam.add(v3);
			vfoc.add(v3);
			var fac = 1.0 * (mouse.y - info.Mouse.y);
			v4.multiplyScalar(-fac);
			vcam.add(v4);
			vfoc.add(v4);
			setCamera(vlt, vcam.toArray());
			setFocus(vlt, vfoc.toArray());
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function stop() {
			//	console.log('..Translate/stop', info.Key);
			vlt.Mouse.Mode = 'Idle';
		}
	}

	//-----------------------------------------------------Rotate
	// Rotate view about current Focus
	// TBD: Remove Three.js dependancy
	function Rotate(info, that) {
		var vlt = that.Vlt;
		var dispatch = {
			'Idle.RightMouseDown.Terrain': start,
			'Idle.RightMouseDown': start,
			'Rotate.Move': rotate,
			'Rotate.Move.Terrain': rotate,
			'Rotate.RightMouseUp': stop
		}
		if (info.Action == 'Harvest') {
			for (key in dispatch)
				info.Keys.push(key);
			return;
		}
		if (info.Key in dispatch)
			dispatch[info.Key]();

		function start() {
			//	console.log('..Rotate/start', info.Key);
			var mouse = that.Vlt.Mouse;
			mouse.Mode = 'Rotate';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function rotate() {
			//	console.log('..Rotate/move', info.Key);
			var mouse = that.Vlt.Mouse;
			var vcam = new THREE.Vector3();
			vcam.fromArray(getCamera(vlt));
			var vfoc = new THREE.Vector3();
			vfoc.fromArray(getFocus(vlt));
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
			setCamera(vlt, vcam.toArray());
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function stop() {
			//	console.log('..Translate/stop', info.Key);
			var vlt = that.Vlt;
			vlt.Mouse.Mode = 'Idle';
		}
	}

	//-----------------------------------------------------Select
	// Move/Rotate model object in construction phase
	// TBD: Remove Three.js dependancy
	function Select(info, that) {
		var vlt = that.Vlt;
		var dispatch = {
			'Idle.LeftMouseDown.Thing': start,
			'Select1.Move.Thing': move,
			'Select1.Move.Terrain': move,
			'Select1.LeftMouseUp': mouseup,
			'Select2.Move.Thing': move,
			'Select2.Move.Terrain': move,
			'Select2.Wheel': spin,
			'Select2.LeftMouseDown.Terrain': stop,
			'Select2.LeftMouseDown.Thing': stop
		}
		if (info.Action == 'Harvest') {
			for (key in dispatch)
				info.Keys.push(key);
			return;
		}
		if (info.Key in dispatch)
			dispatch[info.Key]();

		function start() {
			var mouse = that.Vlt.Mouse;
			mouse.Mode = 'Select1';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
			vlt.pidSelect = info.pidThing;
		}

		function mouseup() {
			var mouse = vlt.Mouse;
			mouse.Mode = 'Select2';
		}

		function spin() {
			var q = {};
			q.Cmd = 'Move';
			q.Thing = vlt.pidSelect;
			q.Spin = 6.0*info.Factor;
			that.send(q, that.Par.Holodeck);
		}

		function move() {
			if (!('Point' in info))
				return;
			var q = {};
			q.Cmd = 'Move';
			q.Thing = vlt.pidSelect;
			var loc = [];
			loc.push(info.Point.x);
			loc.push(info.Point.y);
			loc.push(info.Point.z);
			q.Loc = loc;
			that.send(q, that.Par.Holodeck);
		}

		function stop() {
			vlt.Mouse.Mode = 'Idle';
			var q = {};
			q.Cmd = 'Save';
			q.Loc = vlt.Info.Loc;
			q.Angle = vlt.Info.Angle;
			q.Axis = vlt.Info.Axis;
			that.send(q, vlt.pidSelect);
		}
	}

	//-----------------------------------------------------Evoke
	// Send an Evoke message to the server component. The
	// return is an array of Entity Par objects. If none
	// are returned, the function exits. If one is returned,
	// then that widget is instantiated. If more than one,
	// then an 'ItemSelect' widget is instantiated, and the
	// resulting selection determines which widget is shown.
	function Evoke(info, that) {
		if(info.Action == 'Harvest') {
			info.Keys.push('Idle.RightMouseDown.Thing');
			return;
		}
		info.Cmd = 'Evoke';
		//	console.log(that);
		vlt = that.Vlt;
		that.send(info, info.pidThing, evoke);

		function evoke(err, q) {
			console.log('..back');
			console.log('q', q);
			if (!('Par' in q)) {
				console.log(' ** ERR:No widget returne from Evoke');
				if (fun)
					fun();
				return;
			}
			if (q.Par.length == 1 || false) {
				that.Nxs.genEntity(q.Par[0], start);
				return;
			}
			if ('pidContext' in vlt) {
				context();
			} else {
				var par = {};
				par.Entity = 'xGraph:Widgets/ItemSelect';
				that.Nxs.genEntity(par, menu);
			}

			function menu(err, ent) {
				console.log('..menu');
				if (err) {
					console.log(' ** ERR:' + err);
					if (fun)
						fun(err);
					return;
				}
				vlt.pidContext = ent.getPid();
				context();
			}

			function context() {
				console.log('..context');
				var ctx = {};
				ctx.Cmd = 'Start';
				ctx.X = q.Mouse.x;
				ctx.Y = q.Mouse.y;
				var itm;
				ctx.ItemList = [];
				for (var i = 0; i < q.Par.length; i++) {
					itm = q.Par[i];
					if ('Name' in itm)
						ctx.ItemList.push(itm.Name);
				}
				console.log('Ctx', ctx);
				that.send(ctx, vlt.pidContext, select);
			}

			function select(err, q2) {
				console.log('..select', q2);
				if ('Select' in q2) {
					var par;
					for (var i = 0; i < q.Par.length; i++) {
						par = q.Par[i];
						if ('Name' in par && par.Name == q2.Select) {
							that.Nxs.genEntity(par, start);
							return;
						}
					}
				}
				if (fun)
					fun();
			}

			function start(err, ent) {
				console.log('..start');
				if (err) {
					console.log(' ** ERR:Cannot instantiate widget');
					if (fun)
						fun(err);
					return;
				}
				var go = {};
				go.Cmd = 'Start';
				var pid = ent.getPid();
				that.send(go, pid, pau);

				function pau(err) {
					//	console.log('..Holodeck/start/pau');
				}
			}
		}
	}

	//-----------------------------------------------------getCamera
	// Return current camera position as [x, y, z]
	function getCamera(vlt) {
		return vlt.Camera.position.toArray();
	}

	//-----------------------------------------------------setCamera
	// Set camera position from an array [x, y, z]
	function setCamera(vlt, vcam) {
		vlt.Camera.position.fromArray(vcam);
		vlt.Camera.lookAt(vlt.Focus);
	}

	//-----------------------------------------------------getFocus
	// Return current focus as array [x, y, z]
	function getFocus(vlt) {
		return vlt.Focus.toArray();
	}

	//-----------------------------------------------------setFocus
	// Set focus from array [x, y, z]
	function setFocus(vlt, vfoc) {
		vlt.Focus.fromArray(vfoc);
		vlt.Camera.lookAt(vlt.Focus);
	}

	//-----------------------------------------------------mouseRay
	function mouseRay(vlt, evt) {
		var info = {};
		vlt.Ray.precision = 0.00001;
		container = document.getElementById("Grok");
		var w = container.clientWidth;
		var h = container.clientHeight - 2 * container.clientTop;
		var vec = new THREE.Vector2();
		vec.x = 2 * (evt.clientX - container.offsetLeft) / w - 1;
		vec.y = 1 - 2 * (evt.clientY - container.offsetTop) / h;
		vlt.Ray.setFromCamera(vec, vlt.Camera);
		var hits = vlt.Ray.intersectObjects(vlt.Scene.children, true);
		var hit;
		var obj;
		//	console.log('Hits length is', hits.length);
		for (var i = 0; i < hits.length; i++) {
			hit = hits[i];
			obj = hit.object;
			var data;
			var pt;
			while (obj != null) {
				if ('userData' in obj) {
					data = obj.userData;
					//	console.log('hit', hit);
					//	console.log('mouseRay', data);
					if ('Type' in data) {
						switch (data.Type) {
							case 'Terrain':
								//	if(!('Type' in info))
								//		info.Type = 'Terrain';
								info.Type = 'Terrain';
								info.Terrain = data.Pid;
								info.Point = hit.point;
								break;
							case 'Thing':
								info.Type = 'Thing';
								info.pidThing = data.pidThing;
								info.pidAgent = data.pidAgent;
								break;
						}
						pt = hit.point;
					}
				}
				if ('Type' in info)
					return info;
				obj = obj.parent;
			}
		}
	}

})();

