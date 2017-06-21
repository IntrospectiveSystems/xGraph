//# sourceURL=Mouse
(function Mouse() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Mouse/Setup');
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Mouse/Start');
		var that = this;
		var Par = this.Par;
		var Vew = $('#'+Par.Div).data('View');
//		var Vew = __Share[Par.Div];
		Vew.Mouse = {};
		Vew.Mouse.Mode = 'Idle';
		Vew.Mouse.inPanel = true;
		Vew.Ray = new THREE.Raycaster();
		var Grok = $('#Grok');
//		var Grok = document.getElementById(Par.Div);
		Grok.mouseenter(function (evt) {
			mouseEnter(evt);
		});
		Grok.mouseleave(function (evt) {
			mouseLeave(evt);
		});
		Grok.bind('mousewheel DOMMouseScroll', function (evt) {
			mouseWheel(evt);
		});
		Grok.mousedown(function (evt) {
			mouseDown(evt);
		});
		Grok.mousemove(function (evt) {
			mouseMove(evt);
		});
		Grok.mouseup(function (evt) {
			mouseUp(evt);
		});
		if(fun)
			fun(null, com);

		//-----------------------------------------------------mouseEnter
		function mouseEnter(evt) {
		}

		//-----------------------------------------------------mouseLeave
		function mouseLeave(evt) {
		}

		//-----------------------------------------------------mouseDown
		function mouseDown(evt) {
			var info = mouseRay(evt);
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
		function mouseUp(evt) {
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
		function mouseWheel(evt) {
			var fac;
		//	var direction  = (evt.detail<0 || evt.wheelDelta>0) ? 1: -1;
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
			Dispatch(info);
			evt.stopPropagation();
			evt.returnValue = false;
		}

		//-----------------------------------------------------mouseMove
		function mouseMove(evt) {
			if(Vew.Mouse.Mode == 'Idle')
				return;
			var info = mouseRay(evt);
			if (!info)
				return;
			info.Action = 'Move';
			info.Mouse = {};
			info.Mouse.x = evt.clientX;
			info.Mouse.y = evt.clientY;
			Dispatch(info);
			evt.stopPropagation();
			evt.returnValue = false;
		}

		//-----------------------------------------------------Dispatch
		function Dispatch(info) {
		//	console.log('Dispatch', Vew.Mouse.Mode, info);
			var dispatch;
			if ('Dispatch' in Vew) {
				dispatch = Vew.Dispatch;
			} else {
				Vew.Dispatch = {};
				dispatch = Vew.Dispatch;
				harvest(Translate);
				harvest(Rotate);
				harvest(Select);
				harvest(Zoom);
				harvest(Evoke);
			}
			var key = Vew.Mouse.Mode + '.' + info.Action;
			if ('Role' in info)
				key += '.' + info.Role;
			console.log('key', key);
			info.Key = key;
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

		//-----------------------------------------------------mouseRay
		function mouseRay(evt) {
		//	console.log('--mouseRay');
			var info = {};
			Vew.Ray.precision = 0.00001;
			container = document.getElementById("Grok");
			var w = container.clientWidth;
			var h = container.clientHeight - 2 * container.clientTop;
			var vec = new THREE.Vector2();
			vec.x = 2 * (evt.clientX - container.offsetLeft) / w - 1;
			vec.y = 1 - 2 * (evt.clientY - container.offsetTop) / h;
			Vew.Ray.setFromCamera(vec, Vew.Camera);
			var hits = Vew.Ray.intersectObjects(Vew.Scene.children, true);
			var hit;
			var obj;
		//	console.log('nhits', hits.length);
			//	console.log('Hits length is', hits.length);
			for (var i = 0; i < hits.length; i++) {
				hit = hits[i];
			//	console.log('hit[', i, ']', hit);
				obj = hit.object;
				var data;
				var pt;
				while (obj != null) {
					if ('userData' in obj) {
						data = obj.userData;
					//	console.log(i, data);
						if ('Role' in data) {
							switch (data.Role) {
								case 'Terrain':
									info.Role = 'Terrain';
									info.Pid = data.Pid;
									info.Point = hit.point;
									break;
								case 'Artifact':
									info.Role = 'Artifact';
									info.Pid = data.Pid;
									break;
							}
							pt = hit.point;
						}
					}
					if ('Role' in info)
						return info;
					obj = obj.parent;
				}
			}
		}

		//-----------------------------------------------------Zoom
		// Move camera towards or away from Focus point
		// TBD: Remove Three.js dependancy
		function Zoom(info) {
			if(info.Action == 'Harvest') {
				info.Keys.push('Idle.Wheel');
				return;
			}
			var v = new THREE.Vector3();
			v.fromArray(getCamera());
			var vfoc = new THREE.Vector3();
			vfoc.fromArray(getFocus());
			v.sub(vfoc);
			var fac;
			if (info.Factor > 0)
				fac = 0.95 * info.Factor;
			else
				fac = -1.05 * info.Factor;
			v.multiplyScalar(fac);
			var vcam = vfoc.clone();
			vcam.add(v);
			setCamera(vcam.toArray());
		}

		//-----------------------------------------------------Translate
		// Move in a plane perpendicular to the view vector
		// TBD: Remove Three.js dependancy
		function Translate(info) {
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
				var mouse = Vew.Mouse;
				mouse.Mode = 'Translate';
				mouse.x = info.Mouse.x;
				mouse.y = info.Mouse.y;
			}

			function move() {
				//	console.log('..Translate/move', info.Key);
				var mouse = Vew.Mouse;
				var vcam = new THREE.Vector3();
				vcam.fromArray(getCamera());
				var vfoc = new THREE.Vector3();
				vfoc.fromArray(getFocus());
				var v1 = new THREE.Vector3(0.0, 0.0, 1.0);
				var v2 = vcam.clone();
				v2.sub(vfoc);
				v2.normalize();
				var v3 = new THREE.Vector3();
				v3.crossVectors(v1, v2);
				var v4 = new THREE.Vector3();
				v4.crossVectors(v1, v3);
				var fac = 0.1 * (mouse.x - info.Mouse.x);
				v3.multiplyScalar(fac);
				vcam.add(v3);
				vfoc.add(v3);
				var fac = .1 * (mouse.y - info.Mouse.y);
				v4.multiplyScalar(-fac);
				vcam.add(v4);
				vfoc.add(v4);
				setCamera(vcam.toArray());
				setFocus(vfoc.toArray());
				mouse.x = info.Mouse.x;
				mouse.y = info.Mouse.y;
			}

			function stop() {
				//	console.log('..Translate/stop', info.Key);
				Vew.Mouse.Mode = 'Idle';
			}
		}

		//-----------------------------------------------------Rotate
		// Rotate view about current Focus
		// TBD: Remove Three.js dependancy
		function Rotate(info) {
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
				var mouse = Vew.Mouse;
				mouse.Mode = 'Rotate';
				mouse.x = info.Mouse.x;
				mouse.y = info.Mouse.y;
			}

			function rotate() {
				//	console.log('..Rotate/move', info.Key);
				var mouse = Vew.Mouse;
				var vcam = new THREE.Vector3();
				vcam.fromArray(getCamera());
				var vfoc = new THREE.Vector3();
				vfoc.fromArray(getFocus());
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
				setCamera(vcam.toArray());
				mouse.x = info.Mouse.x;
				mouse.y = info.Mouse.y;
			}

			function stop() {
				//	console.log('..Translate/stop', info.Key);
				Vew.Mouse.Mode = 'Idle';
			}
		}

		//-----------------------------------------------------Select
		// Move/Rotate model object in construction phase
		// TBD: Remove Three.js dependancy
		function Select(info) {
			var dispatch = {
				'Idle.LeftMouseDown.Artifact': start,
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
			if (info.Key in dispatch)
				dispatch[info.Key]();

			function start() {
			//	console.log('..start', info);
				var mouse = Vew.Mouse;
				mouse.Mode = 'Select1';
				mouse.x = info.Mouse.x;
				mouse.y = info.Mouse.y;
				Vew.pidSelect = info.Pid;
			}

			function mouseup() {
				var mouse = Vew.Mouse;
				mouse.Mode = 'Select2';
			}

			function spin() {
				var q = {};
				q.Cmd = 'Move';
				q.Instance = Vew.pidSelect;
				q.Spin = 6.0*info.Factor;
				that.send(q, Par.View);
			}

			function move() {
			//	console.log('..move', info);
				if (!('Point' in info))
					return;
				var q = {};
				q.Cmd = 'Move';
				q.Instance = Vew.pidSelect;
				var loc = [];
				loc.push(info.Point.x);
				loc.push(info.Point.y);
				loc.push(info.Point.z);
				q.Loc = loc;
				that.send(q, Par.View);
			}

			function stop() {
				Vew.Mouse.Mode = 'Idle';
				var q = {};
				q.Cmd = 'Save';
				q.Instance = Vew.pidSelect;
				that.send(q, Par.View);
			}
		}

		//-----------------------------------------------------Evoke
		// Send an Evoke message to the server component. The
		// return is an array of Entity Par objects. If none
		// are returned, the function exits. If one is returned,
		// then that widget is instantiated. If more than one,
		// then an 'ItemSelect' widget is instantiated, and the
		// resulting selection determines which widget is shown.
		function Evoke(info) {
			var dispatch = {
				'Idle.RightMouseDown.Artifact': evoke
			}
			if (info.Action == 'Harvest') {
				for (key in dispatch)
					info.Keys.push(key);
				return;
			}
			if (info.Key in dispatch)
				dispatch[info.Key]();
			return;

			function evoke() {
				console.log('info', JSON.stringify(info, null, 2));
				info.Cmd = 'Evoke';
				that.send(info, info.Pid, reply);

				function reply(err, q) {
					console.log('..reply', JSON.stringify(q, null, 2));
					if('Module' in q) {
						that.Nxs.genModule(q.Module, done);
					}
				}

				function done(err, pid) {
					console.log('..done', pid);
				}
			}
		}
/*
			function evokez() {
				console.log('..evoke', info);
				var css = {};
				css.position = 'absolute';
				css.backgroundColor = "white";
				css.fontWeight = 'bold';
				css.width = '160px';
				css.height = '210px';
				css.zIndex = 100001;
				css.visibility = 'visible';
				var q = {};
				q.Cmd = 'Menu';
				q.Pid = Par.Pid;
				q.CSS = css;
				q.Size = [100, 66];
				q.Loc = [400, 100];
				q.Title = 'Action';
				q.Items = [];
				q.Items.push('Export');
				q.Items.push('Delete');
				that.send(q, Par.Menu, reply);

				function reply(err, r) {
					if(err) {
						console.log(' ** ERR/Evoke:' + err);
						return;
					}
					console.log(JSON.stringify(r, null, 2));
				}
			}

			function evoke() {
				console.log('..evoke', info);
				Vew.Mouse.Mode = 'Idle';
				var q = {};
				q.Cmd = 'Evoke';
				q.Instance = info.Pid;
				console.log('q', q);
				that.send(q, Par.View, reply);
			}

			function reply(err, q) {
				console.log('..reply', q);
			}

		}
*/
		function Evokex(info) {
			if(info.Action == 'Harvest') {
				info.Keys.push('Idle.RightMouseDown.Thing');
				return;
			}
			info.Cmd = 'Evoke';
			//	console.log(that);
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
				if ('pidContext' in Vew) {
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
					Vew.pidContext = ent.getPid();
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
					that.send(ctx, Vew.pidContext, select);
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
		function getCamera() {
			return Vew.Camera.position.toArray();
		}

		//-----------------------------------------------------setCamera
		// Set camera position from an array [x, y, z]
		function setCamera(vcam) {
			Vew.Camera.position.fromArray(vcam);
			Vew.Camera.lookAt(Vew.Focus);
		}

		//-----------------------------------------------------getFocus
		// Return current focus as array [x, y, z]
		function getFocus() {
			return Vew.Focus.toArray();
		}

		//-----------------------------------------------------setFocus
		// Set focus from array [x, y, z]
		function setFocus(vfoc) {
			Vew.Focus.fromArray(vfoc);
			Vew.Camera.lookAt(Vew.Focus);
		}

	}

})();

