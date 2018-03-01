//# sourceURL=3DView
(
	/**
	 * The 3DView entity is the Apex and only entity of the 3DView Module.
	 * This entity requres the Setup function invoked during the Setup phase of Nexus startup. As well as its
	 * Start function invoked during the Start phase of Nexus startup.
	 * 
	 * The main capability of this entity is to add and render a Three.js scene on the div provided by 
	 * the Viewify class (which is stored in this.Vlt.div). Currently only Three.js primitives and generative 
	 * object3D models can be added to the scene/rendered.
	 */
	function _3DView() {

		let dispatch = {
			Setup,
			Start,
			SetObjects,
			ImageCapture,
			Resize,
			Render,
			DOMLoaded,
			Cleanup,
			DispatchEvent,
			EvokeExample
		};

		//Using views we must inject basic functionality via the viewify script.
		//We no longer need to build divs in our view class just access the existing
		//div from this.Vlt.div. The div is already appended to the body.
		return Viewify(dispatch, "3.1");

		/**
		 * Create the Three.js WebGL renderer and Scene and append the rendered canvas to the div
		 * @param {Object} com 
		 * @param {Function} fun 
		 */
		function Setup(com, fun) {
			this.super(com, (err, cmd) => {
				log.i('--3DView/Setup');
				let div = this.Vlt.div;

				//set live for true for the example of an updating system
				let live = false;

				this.Vlt.View = {};
				View = this.Vlt.View;
				View.Geometries = {};
				View.Meshs = {};
				View.Models = {};
				View.ResponseHandlers = {};

				View.Ray = new THREE.Raycaster();
				View.Renderer = new THREE.WebGLRenderer({ antialias: true });
				View.Renderer.setClearColor(0x000, 1);
				View.Renderer.setSize(div.width(), div.height());
				View.Scene = new THREE.Scene();
				View.Focus = new THREE.Vector3(0.0, 0.0, 0.0);
				View.Camera = new THREE.PerspectiveCamera(45,
					div.width / div.height, 0.1, 40000);
				div.append(View.Renderer.domElement);
				View.Light = new THREE.DirectionalLight(0xFFFFFF);
				View.Light.position.set(-40, 60, 100);
				View.Scene.add(View.Light);
				View.Ambient = new THREE.AmbientLight(0x888);
				View.Scene.add(View.Ambient);
				if ("Axes" in this.Par) {
					// log.w(`adding in the axes`)
					var axes = new THREE.AxisHelper(this.Par.Axes);
					axes.position.z = 0.01;
					View.Scene.add(axes);
				}
				View.Camera.position.x = 0;
				View.Camera.position.y = -50;
				View.Camera.position.z = 100;
				View.Camera.up.set(0.0, 0.0, 1.0);
				View.Camera.lookAt(View.Focus);
				View.Camera.updateProjectionMatrix();

				View.RenderLoop = setInterval(_ => {

					//For testing of updating elevations
					if (this.Vlt.Update || live) {
						log.d('image capture loop');
						// this.Vlt.Update = false;
						// let q = {}
						// q.Cmd = "SetObjects";
						// q.Objects = [];
						// let obj = {
						// 	id: "plane",
						// 	elevations: []
						// };
						// q.Objects.push(obj);

						// this.send(q, this.Par.Pid, (err, com) => {
							setTimeout(this.dispatch({ Cmd: "ImageCapture" }, _ => _), 0);
						// });
					}
					//end TEST

					View.Renderer.render(View.Scene, View.Camera);
					// log.d(`render`)
				}, 20);  // updates roughly every 20 milliseconds

				fun(null, com);
			});
		}

		/**
		 * Subscribes to the server to allow for server communications to reach this module.
		 * If there was a controller defined we also register with that.
		 * @param {Object} com 
		 * @param {Function} fun 
		 */
		function Start(com, fun) {
			log.i('--3DView/Start');

			if ("Server" in this.Par) {
				this.send({ Cmd: "Subscribe", Pid: this.Par.Pid, Link: "3DView" }, this.Par.Server, (err, com) => {
					log.v("Subscribed with Server");
				});
			}

			if ("Controller" in this.Par) {
				this.send({ Cmd: "Register", Pid: this.Par.Pid }, this.Par.Controller, (err, com) => {
					log.v("Registered with Controller");
				});
			}

			fun(null, com);

			///
			//
			//
			//
			//
			//
			//			START EXAMPLE CODE FOR ADDING OBJECTS TO WORLD
			//
			//
			//
			//
			//
			//
			if (!("Controller" in this.Par)) {
				//add some objects to the world
				let q = {}, obj;
				q.Cmd = "SetObjects";
				q.Objects = [];

				// //add 10 ellipsoids with random location and scales
				for (let idx = 0; idx < 20; idx++) {
					obj = {
						id: idx,
						geometry: {
							id: "geom",
							name: "SphereGeometry",
							arguments: [1, 64, 64]
						},
						mesh: {
							id: "mesh",
							name: "MeshPhongMaterial",
							arguments: {
								color: 0xFFFFFF * Math.random()
							}
						},
						position: {
							x: 100 * Math.random(),
							y: 100 * Math.random(),
							z: 100 * Math.random()
						},
						scale: {
							x: 10 * Math.random(),
							y: 10 * Math.random(),
							z: 10 * Math.random()
						},
						responseHandler: {
							Cmd: "EvokeExample",
							Handler: this.Par.Pid
						}
					};
					q.Objects.push(obj);
				}
				// add a plane

				obj = {
					id: "plane",
					geometry: {
						id: "PlaneGeom",
						name: "PlaneGeometry",
						arguments: [100, 100, 99, 99]
					},
					mesh: {
						id: "planeMesh",
						name: "MeshPhongMaterial",
						arguments: {
							color: 0x333333
						}
					},
					position: {
						x: 50,
						y: 50,
						z: 0
					},
					elevations: []
				};
				q.Objects.push(obj);
				// add a module 
				obj = {
					id: "module",
					module: "Extensions.Modules.Modelx3D",
					parentId: "plane",
					position: {
						x: 0,
						y: 0,
						z: 0
					},
					model: "Geo.101Plants.Cactus3",
					axis: [0, 0, 1],
					angle: 0
				};
				q.Objects.push(obj);

				this.send(q, this.Par.Pid, _ =>
					//callback
					log.v("we sent the objects to be added to the scene")
				);


				/*
		
		
		
		
		
		
				END EXAMPLE CODE
		
		
		
		
		
		
		
		
				*/
			}
		}


		/**
		 * This is an example of an Evoke handler. This particular example 
		 * generates a popup module containing a 3DView module or the one set in
		 * Par.EvokeView. In deployment this code can be removed and EvokeExample 
		 * removed from the dispatch table.
		 * @param {Object} 		com 
		 * @param {String}		com.id			the id of the object being evoked
		 * @param {Object}		com.mouse 	 the coordinates of the mouse when evoked {x:_x,y:_y}
		 * @param {Function=} 	fun 
		 */
		function EvokeExample(com, fun = _ => _) {
			log.v("EVOKE EXAMPLE", com.id);

			log.v("Popup");
			this.genModule({
				"Module": "xGraph.Popup",
				"Par": {
					Left: com.mouse.x,
					Top: com.mouse.y,
					"View": this.Par.EvokeView || "xGraph.3DView",
					"Width": 800,
					"Height": 600
				}
			}, () => { })
			fun(null, com)
		}

		/**
		 * Propagate a DomLoaded Event to children views. We append the canvas to the div.
		 * @param {Object} com 
		 * @param {Function} fun 
		 */
		function DOMLoaded(com, fun) {
			log.v("--3DView/DOMLoaded");
			let div = this.Vlt.div;
			div.append(this.Vlt.View.Renderer.domElement);
			let View = this.Vlt.View;
			View.Renderer.setSize(div.width(), div.height());
			View.Camera.aspect = div.width() / div.height();
			View.Camera.updateProjectionMatrix();

			$(window.document.body).on('keydown', (evt)=>{
				log.d(`key down ${JSON.stringify(evt, null, 2)}`);
				if (this.Vlt.Update){
					log.d(`stopping image capture`);
					this.Vlt.Update = false; 
				} else{
					log.d(`Starting image capture`);
					this.Vlt.Update = true;
				}
			});

			this.genModule({
				"Module": 'xGraph.Mouse',
				"Par": {
					"Handler": this.Par.Pid
				}
			}, (err, pidApex) => {
				this.send({
					Cmd: "SetDomElement",
					"DomElement": this.Vlt.div
				}, pidApex, (err, cmd) => {
					log.v("GenModded the Mouse and set the DomElement");
				});
			});
			this.super(com, fun);
		}

		/**
		 * Removes the render loop
		 * @param {Object} com 
		 * @param {Function=} fun 
		 */
		function Cleanup(com, fun = _ => _) {
			log.v("--3DView/Cleanup", this.Par.Pid.substr(30));

			clearInterval(this.Vlt.View.RenderLoop);
			fun(null, com);
		}

		/**
		 * Cascade a render down the DOM tree of views
		 * @param {Object} com 
		 * @param {Function} fun 
		 */
		function Render(com, fun) {
			log.v("--3DView/Render", this.Par.Pid.substr(30));
			this.Vlt.div.append(this.Vlt.View.Renderer.domElement);
			this.super(com, fun);
		}

		/**
		 * Sent when a resize event occurs on the div. 
		 * @param {Object} com 
		 * @param {Function} fun 
		 */
		function Resize(com, fun) {
			this.super(com, (err, cmd) => {
				let View = this.Vlt.View;
				View.Renderer.setSize(cmd.width, cmd.height);
				View.Camera.aspect = cmd.width / cmd.height;
				View.Camera.updateProjectionMatrix();
				fun(null, com);
			});
		}

		/**
		 * The main Three.js functionality. Primatives as well as generative models can be added.
		 * An array of objects is recieved and added to the scene before being 
		 * rendered. 
		 * @param {Object} com 
		 * @param {Object} com.Objects 	The array of pixi graphics objects to be displayed
		 * @param {Function} fun 
		 */
		async function SetObjects(com, fun = (err, com) => { if (err) log.e(err) }) {
			log.v(`3DView/SetObjects`);
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
			 * 					color : 0x00ff00,
			 * 					
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

			//return if com.Objects is not an array
			if ((!com.Objects) || (!Array.isArray(com.Objects))) {
				fun("com.Objects must be an array (Array.isArray(com.Objects) == true)", com);
				return;
			}

			for (let i = 0; i < com.Objects.length; i++) {
				let unit = com.Objects[i];

				if (typeof unit.id == "undefined") {
					log.v("A unit sent to 3DView/SetObjects did not have an id");
					continue;
				}

				let obj = this.Vlt.View.Scene.getObjectByName(unit.id);

				if (!obj) {
					unit.new = true;
					if (!unit.module) {
						//we're building a 3JS object
						if (!unit.geometry || !unit.mesh) {
							log.v("A unit sent to 3DView/SetObjects did not have a geometry or mesh");
							continue;
						}
						let geom, mesh;

						if ("id" in unit.geometry) {
							if (unit.geometry.id in this.Vlt.View.Geometries) {
								geom = this.Vlt.View.Geometries[unit.geometry.id];
							} else {
								geom = new THREE[unit.geometry.name](...unit.geometry.arguments);
								this.Vlt.View.Geometries[unit.geometry.id] = geom;
							}
						} else {
							geom = new THREE[unit.geometry.name](...unit.geometry.arguments);
						}

						unit.mesh.arguments["side"] = THREE.DoubleSide;
						if ("id" in unit.mesh) {
							if (unit.mesh.id in this.Vlt.View.Meshs) {
								mesh = this.Vlt.View.Meshs[unit.mesh.id];
							} else {
								mesh = new THREE[unit.mesh.name](unit.mesh.arguments);
								this.Vlt.View.Meshs[unit.mesh.id] = mesh;
							}
						} else {
							mesh = new THREE[unit.mesh.name](unit.mesh.arguments);
						}

						obj = new THREE.Mesh(geom, mesh);
					} else {
						if (("Obj3D" in com) && (unit.Obj3D == "model")){
							unit.Obj3D = com.Obj3D
						}

						//we're passed a module and need to generate it
						let mod = {
							"Module": unit.module,
							"Par": {
								"Name": unit.id,
								"X3D": unit.Obj3D
							}
						};

						if ("modelId" in unit) {
							if (unit.modelId in this.Vlt.View.Models) {
								obj = new THREE.Object3D();
								let obj1 = new THREE.Mesh(this.Vlt.View.Models[unit.modelId].children[0].children[0].geometry,this.Vlt.View.Models[unit.modelId].children[0].children[0].material) ;

								let obj2 = new THREE.Mesh(this.Vlt.View.Models[unit.modelId].children[1].children[0].geometry,this.Vlt.View.Models[unit.modelId].children[1].children[0].material) ;
								obj.add(obj1);
								obj.add(obj2);
							} else {
								obj = await new Promise((res, rej) => {
									this.genModule(mod, (err, pidApex) => {
										let that = this;

										//save the modules pid in unit.Pid
										unit.Pid = pidApex;

										unit.responseHandler = {
											Cmd: "Evoke",
											Handler: unit.Pid
										};
										var q = {};
										q.Cmd = 'GenModel';
										this.send(q, unit.Pid, rply);
										function rply(err, x) {
											if (err) {
												func(err);
												return;
											}
											if (!('Obj3D' in x)) {
												var err = 'No model returned';
												log.v(' ** ERR:' + err);
												func(err);
												return;
											}
											var objinst = x.Obj3D;
											res(objinst);
											log.v("Done Generating the Module/Model");
										}
									});
								});
								this.Vlt.View.Models[unit.modelId] = obj;
							}
						} else {
							obj = await new Promise((res, rej) => {
								this.genModule(mod, (err, pidApex) => {
									let that = this;

									//save the modules pid in unit.Pid
									unit.Pid = pidApex;

									unit.responseHandler = {
										Cmd: "Evoke",
										Handler: unit.Pid
									};
									var q = {};
									q.Cmd = 'GenModel';
									this.send(q, unit.Pid, rply);
									function rply(err, x) {
										if (err) {
											func(err);
											return;
										}
										if (!('Obj3D' in x)) {
											var err = 'No model returned';
											log.v(' ** ERR:' + err);
											func(err);
											return;
										}
										var objinst = new THREE.Object3D();
										objinst.add(x.Obj3D);
										res(objinst);
										log.v("Done Generating the Module/Model");
									}
								});
							});
						}
					}
				} else if (unit.removed) {
					this.Vlt.View.Scene.remove(obj);
					continue;
				}

				obj.name = unit.id;

				if (typeof unit.position == "object") {
					if (unit.position.x || (unit.position.x == 0))
						obj.position.x = Math.round(unit.position.x);
					if (unit.position.y || (unit.position.y == 0))
						obj.position.y = Math.round(unit.position.y);
					if (unit.position.z || (unit.position.z == 0))
						obj.position.z = Math.round(unit.position.z);
				}

				if (unit.elevations) {
					// add in the known elevations
					for (let i = 0, l = obj.geometry.vertices.length; i < l; i++) {
						let row = Math.floor(i / obj.geometry.parameters.width);
						let col = i - row * obj.geometry.parameters.width;
						let idx = (obj.geometry.parameters.height - row) * obj.geometry.parameters.width + col;
						obj.geometry.vertices[i].z = unit.elevations[idx] || Math.random();
					}
					obj.geometry.verticesNeedUpdate = true;
					obj.geometry.elementsNeedUpdate = true;
					obj.geometry.normalsNeedUpdate = true;
					obj.updateMatrix();
				}

				if (unit.scale) {
					obj.scale.set(unit.scale.x || 1, unit.scale.y || 1, unit.scale.z || 1);
				}

				if (unit.responseHandler) {
					this.Vlt.View.ResponseHandlers[unit.id] = unit.responseHandler;
				}
				if (unit.new) {
					if (unit.parentId) {
						// log.d(`trying to get parent ${unit.parentId}`);
						let parent = this.Vlt.View.Scene.getObjectByName(unit.parentId);
						if (parent) {
							if (unit.position == "random") {
								let vertex = parent.geometry.vertices[Math.floor(Math.random() * parent.geometry.vertices.length)];
								// log.d(`chosen vertex is ${vertex}`);

								while (vertex.z < 0) {
									vertex = parent.geometry.vertices[Math.floor(Math.random() * parent.geometry.vertices.length)]
									// log.d(`new vertex is ${vertex}`);
								}
								obj.position.copy(vertex)
							}
							parent.add(obj);
							obj.matrixWorldNeedsUpdate = true;
							obj.updateMatrixWorld();
						} else {
							log.v("Parent not defined in three.js scene");
							this.Vlt.View.Scene.add(obj);
						}
					} else {
						this.Vlt.View.Scene.add(obj);
					}
				}
			}

			if (fun)
				fun(null, com);
		}


		/**
		 * Captures the canvas as a base64 image and sends it off the controller (on
		 * the server), if implemented, to be saved.
		 * @param {Object} com 
		 * @param {Function} fun	the callback function	
		 * @returns {com.Image} the base 64 of the image
		 * @returns {com.Name}	the image count 
		 */
		function ImageCapture(com, fun) {
			if (this.Vlt.Count)
				this.Vlt.Count++
			else
				this.Vlt.Count = 1;

			View.Renderer.render(View.Scene, View.Camera);

			let b64 = this.Vlt.View.Renderer.domElement.toDataURL();

			com.Image = b64;
			com.Name = this.Vlt.Count;

			if ("Controller" in this.Par) {
				com.Cmd = "SaveImage";
				this.send(com, this.Par.Controller);
			}

			fun(null, com);
		}


		/**
		 * Used by the mouse module to propagate interactions.
		 * @param {Object} com 
		 * @param {Object} com.info 	the interaction info
		 * @param {String} com.info.Action The interaction action "ex. LeftMouseDown
		 */
		function DispatchEvent(com) {
			let info = com.info;
			let Vlt = this.Vlt;
			Vlt.Mouse = com.mouse;
			var dispatch;
			if ('Dispatch' in Vlt) {
				dispatch = Vlt.Dispatch;
			} else {
				Vlt.Dispatch = {};
				dispatch = Vlt.Dispatch;

				harvest(Rotate);
				harvest(Zoom);
				harvest(Keyed);
			}
			var key = Vlt.Mouse.Mode + '.' + info.Action;
			if (info.Action == 'LeftMouseDown') {
				info = mouseRay(info, Vlt);
				if (info.obj && info.obj.responseHandler) {
					this.send({ Cmd: info.obj.responseHandler.Cmd, id: info.obj.id, point: info.point, mouse: info.Mouse }, info.obj.responseHandler.Handler, _ => {
						//
						//
						//may need to handle evoke callback here
						//
						//
						log.v("Evoke example callback")
					});
				}
				return;
			}
			if ('Type' in info)
				key += '.' + info.Type;
			if ('CharKey' in info)
				key += '.' + info.CharKey;
			info.Key = key;
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
				}
			}
		}

		/**
		 * Perform a raycast to see if any of the objects in the scene graph were hit
		 * 
		 * @param {Object} info  the interaction info
		 * @param {Object} info.Mouse The coordinates of the click {x:_x,y:_y}
		 * @param {Object} Vlt 
		 * @param {Object} Vlt.View
		 */
		function mouseRay(info, Vlt) {
			let View = Vlt.View;
			container = Vlt.div;
			var w = container.width();
			var h = container.height() - 2 * container.offset().top;
			var vec = new THREE.Vector2();
			vec.x = 2 * (info.Mouse.x - container.offset().left) / w - 1;
			vec.y = 1 - 2 * (info.Mouse.y - container.offset().top) / h;
			View.Ray.setFromCamera(vec, View.Camera);
			var hits = View.Ray.intersectObjects(View.Scene.children, true);
			var hit;
			var obj;
			for (var i = 0; i < hits.length; i++) {
				hit = hits[i];
				obj = hit.object;
				var pt;
				if (obj != null && obj.name) {
					info.obj = {};
					info.obj.id = obj.name
					info.obj.responseHandler = Vlt.View.ResponseHandlers[info.obj.id] || undefined;
					info.point = hit.point;
					return info
				}
			}
			return info;
		}


		/**
		 *  Move camera towards or away from Focus point
		 * @param {Object} info  the interaction info
		 * @param {Object} info.Mouse The coordinates of the click {x:_x,y:_y}
		 * @param {Object} Vlt 
		 * @param {Object} Vlt.View
		 */
		function Zoom(info, Vlt) {
			if (info.Action == 'Harvest') {
				log.v('Harvest-Zoom');
				info.Keys.push('Idle.Wheel');
				return;
			}
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


		/**
		 * handle a keydown event
		 * @param {Object} info  the interaction info
		 * @param {Object} info.Mouse The coordinates of the click {x:_x,y:_y}
		 * @param {Object} Vlt 
		 * @param {Object} Vlt.View
		 */
		function Keyed(info, Vlt) {
			if (info.Action == 'Harvest') {
				log.v('Harvest-Keyed');
				info.Keys.push('Idle.KeyDown.n');
				return;
			}
			log.d(`key down ${JSON.stringify(info, null, 2)}`);
			if (Vlt.Update){
				log.d(`stopping image capture`);
				Vlt.Update = false; 
			} else{
				log.d(`Starting image capture`);
				Vlt.Update = true;
			}
		}



		/**
		 * Rotate View around the focus
		 * @param {Object} info  the interaction info
		 * @param {Object} info.Mouse The coordinates of the click {x:_x,y:_y}
		 * @param {Object} Vlt 
		 * @param {Object} Vlt.View
		 */
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
				var mouse = Vlt.Mouse;
				mouse.Mode = 'Rotate';
				mouse.x = info.Mouse.x;
				mouse.y = info.Mouse.y;
			}

			function rotate() {
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
				Vlt.Mouse.Mode = 'Idle';
			}
		}


	})();

