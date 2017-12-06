//# sourceURL=2DView.js
(
	/**
	 * The 2DView entity is the Apex and only entity of the 2DView Module.
	 * This entity requres its Setup function invoked during the Setup phase of Nexus startup.
	 * The main capability of this entity is to add and render a pixi stage on the div provided by 
	 * the Viewify class (its stored in this.Vlt.div). See Viewify documentation for more info on this.
	 */
	function _2DView() {

		let dispatch = {
			Setup,
			Start,
			DrawObjects,
			GetCanvas,
			ImageCapture,
			Resize,
			Render,
			DOMLoaded,
			Cleanup,
			EvokeExample
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
			log.i("-2DView/Setup");

			//we hoist the setup command to View.js in the viewif script.
			this.super(com, (err, cmd) => {
				//we access the existing div
				let div = this.Vlt.div;
				div.css("overflow", 'auto');
				//add a location to store the Pixi Stage and Renderer
				this.Vlt.View = {};
				this.Vlt.View.Objects = {};
				this.Vlt.View.Geometries = {};
				this.Vlt.View.ResponseHandlers = {};
				let View = this.Vlt.View;

				View.Renderer = PIXI.autoDetectRenderer(2048, 2048, { "antialias": true });
				div.append($(View.Renderer.view));
				View.Stage = new PIXI.Container();
				View.Renderer.backgroundColor = this.Par.BackgroundColor || 0xA2A2A2;

				//render programatically 
				View.Renderer.render(View.Stage);

				//render via an Animation/RenderLoop
				// View.AnimationLoop = setInterval(_ => {

				// 	if (this.Vlt.Update || live) {
				// 		this.Vlt.Update = false;

				// 		//What to do in the animation loop
				// 		//*
				// 		//*
				// 		//*

				// 		//the set Timeout allows for images to be automattically captured
				// 		//setTimeout(this.dispatch({ Cmd: "ImageCapture" }, _ => _), 40);
				// 	}

				// 	View.Renderer.render(View.Stage);
				// }, 20);
				fun(null, com);
			});
		}

		/**
		 * Retreives the data from this.Par.Source if defined.
		 * @param {Object} com 
		 * @param {Function} fun 
		 */
		function Start(com, fun) {
			log.i("--2DView/Start");

			//allow for communcations from the server side to this module
			if ("Server" in this.Par) {
				this.send({ Cmd: "Subscribe", Pid: this.Par.Pid, Link: "2DView" }, this.Par.Server, (err, com) => {
					log.v("Subscribed with Server");
				});
			}

			//if a controller is defined in Par then register with it.
			if ("Controller" in this.Par) {
				this.send({ Cmd: "Register", Pid: this.Par.Pid }, this.Par.Controller, (err, com) => {
					log.v("Registered with Controller");
				});
			}

			//if a data source is defined in Par then request the defined data channels
			if ("Source" in this.Par) {
				this.send({
					Cmd: "GetData",
					DataChannels: this.Par.DataChannels || {
						Channel: "Data",
						Flow: null,
						Handler: this.Par.Pid
					},
					Pid: this.Par.Pid
				}, this.Par.Source, (err, com) => {
					if (err) {
						log.w("error getting data from source in Par.Source")
						return;
					}
					com.Cmd = "DrawObjects";
					this.dispatch(com, _ => _);
				});
			}

			fun(null, com);
			///
			//
			//
			//
			//
			//
			//			EXAMPLE CODE FOR ADDING OBJECTS TO Stage
			//
			//
			//
			//
			//
			//
			if (!("Controller" in this.Par)) {
				//add some objects to the world
				let q = {}, obj;
				q.Cmd = "DrawObjects";
				q.Objects = [];

				// //add 10 ellipsoids with random location and scales
				for (let idx = 0; idx < 100; idx++) {
					obj = {
						id: idx,
						geometry: {
							id: "geom",
							name: "Circle",
							arguments: [5, 5, 3]
						},
						fill: {
							id: "fill",
							color: 0xFFFFFF,
							alpha: 1
						},
						tint: 0xFFFFFF * Math.random(),
						position: {
							x: this.Vlt.View.Renderer.width * Math.random(),
							y: this.Vlt.View.Renderer.height * Math.random()
						},
						scale: {
							x: 20 * Math.random(),
							y: 20 * Math.random()
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
						id: "base",
						name: "rectangle",
						arguments: [100, 100, 99, 99]
					},
					fill: {
						id: "planeMesh",
						arguments: {
							color: 0x333333,
							alpha: 0.6
						}
					},
					responseHandler: {
						Cmd: "EvokeExample",
						Handler: this.Par.Pid
					}
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



		function EvokeExample(com, fun) {
			log.v("EVOKE EXAMPLE", com.id);

			log.v("Popup");
			this.genModule({
				"Module": "xGraph.Widgets.Popup",
				"Par": {
					Left: com.mouse.x,
					Top: com.mouse.y,
					"View": this.Par.EvokeView || "xGraph.Widgets.3DView",
					"Width": 800,
					"Height": 600
				}
			}, () => { })

			if (fun)
				fun(null, com)
		}

		function DOMLoaded(com, fun) {
			log.v("--2DView/DOMLoaded");
			let div = this.Vlt.div;
			div.append($(this.Vlt.View.Renderer.view));
			let View = this.Vlt.View;
			//View.Renderer.resize(div.width(), div.height());

			// this.genModule({
			// 	"Module": 'xGraph.Widgets.Mouse',
			// 	"Par": {
			// 		"Handler": this.Par.Pid
			// 	}
			// }, (err, pidApex) => {
			// 	this.send({
			// 		Cmd: "SetDomElement",
			// 		"DomElement": this.Vlt.div
			// 	}, pidApex, (err, cmd) => {
			// 		log.v("GenModed the Mouse and set the DomElement");
			// 	});
			// });			
			this.super(com, fun);
		}

		function Cleanup(com, fun) {
			log.v("--2DView/Cleanup", this.Par.Pid.substr(30));

			clearInterval(this.Vlt.View.AnimationLoop);
			if (fun)
				fun(null, com);
		}

		function Render(com, fun) {
			log.v("--2DView/Render", this.Par.Pid.substr(30));
			this.Vlt.div.append($(this.Vlt.View.Renderer.view));
			this.super(com, fun);
		}

		function Resize(com, fun) {
			this.super(com, (err, cmd) => {
				let View = this.Vlt.View;
				//View.Renderer.resize(cmd.width, cmd.height);
				fun(null, com);
			});
		}

		async function DrawObjects(com, fun) {
			//Pixi.Graphics Primitive objects
			const PixiPrimitives = {
				"arc": "arcTo",
				"bezier": "bezierCurveTo",
				"circle": "drawCircle",
				"ellipse": "drawEllipse",
				"polygon": "drawPolygon",
				"rectangle": "drawRect",
				"roundedrectangle": "drawRoundedRect",
				"line": "lineTo",
				"quadratic": "quadraticCurveTo"
			};
			/**
			 * 
			 * the com will contain an Objects key that lists an array of objects
			 * to be modified on the 3d view. All of the listed attributes need NOT
			 * exist. Only a unit ID is required.
			 * 
			 * 
			 * com.Objects = [
			 * 		obj = {
						id: idx,
						geometry: {
							id: "geom",
							name: "Circle",
							arguments: [5, 5, 3]
						},
						fill: {
							color: 0xFFFFFF,
							alpha: 1
						},
						tint: 0xFFFFFF * Math.random(),
						position: {
							x: 100 * Math.random(),
							y: 100 * Math.random()
						},
						scale: {
							x: 10 * Math.random(),
							y: 10 * Math.random()
						},
						responseHandler: {
							Cmd: "EvokeExample",
							Handler: this.Par.Pid
						}
					}
			 * ]
			 */


			for (let i = 0; i < com.Objects.length; i++) {

				let unit = com.Objects[i];

				if (typeof unit.id == "undefined") {
					log.w("A unit sent to 2DView/DrawObjects did not have an id --skipped");
					continue;
				}

				let obj = this.Vlt.View.Objects[unit.id] || undefined;

				if (!obj) {
					unit.new = true;
					if (!unit.module) {
						//we're building a Pixi primitive object

						if ('geometry' in unit) {
							obj = new PIXI.Graphics();
							if (!unit.fill) unit.fill = {};
							obj.beginFill(unit.fill.color || 0, unit.fill.alpha || 1);
							obj[PixiPrimitives[unit.geometry.name.toLowerCase()]](...unit.geometry.arguments);
							obj.endFill();
						}
						obj.name = unit.id;
					}
					{
						//build generative Pixi graphics using Textures and Sprites
						//else {

						// 	//we're passed a module and need to generate it
						// 	let mod = {
						// 		"Module": unit.module,
						// 		"Par": {
						// 			"Name": unit.id
						// 		}
						// 	};

						// 	if (unit.position)
						// 		mod.Par.Position = unit.position;
						// 	if (unit.model)
						// 		mod.Par.Model = unit.model;
						// 	if (unit.axis)
						// 		mod.Par.Axis = unit.axis;
						// 	if (unit.angle)
						// 		mod.Par.Angle = unit.angle;

						// 	obj = await new Promise((res, rej) => {
						// 		this.genModule(mod, (err, pidApex) => {
						// 			let that = this;

						// 			//save the modules pid in unit.Pid
						// 			unit.Pid = pidApex;

						// 			unit.responseHandler = {
						// 				Cmd: "Evoke",
						// 				Handler: unit.Pid
						// 			};

						// 			var q = {};
						// 			q.Cmd = 'GetGraph';
						// 			this.send(q, unit.Pid, scene);

						// 			function scene(err, r) {
						// 				log.v('..View3D/scene');
						// 				Inst = r.Inst;
						// 				log.d('Instances are: ', JSON.stringify(Inst, null, 2));
						// 				if (err) {
						// 					log.v(' ** ERR:' + err);
						// 					if (fun)
						// 						fun(err);
						// 					return;
						// 				}

						// 				let inst = Inst[0];
						// 				var q = {};
						// 				q.Cmd = 'GetModel';
						// 				q.Instance = inst.Instance;
						// 				//debugger;
						// 				that.send(q, unit.Pid, rply);

						// 				function rply(err, x) {
						// 					if (err) {
						// 						func(err);
						// 						return;
						// 					}
						// 					if (!('Obj3D' in x)) {
						// 						var err = 'No model returned';
						// 						log.v(' ** ERR:' + err);
						// 						func(err);
						// 						return;
						// 					}
						// 					var objinst = new THREE.Object3D();
						// 					if ('Position' in inst) {
						// 						var pos = inst.Position;
						// 						objinst.position.x = pos[0];
						// 						objinst.position.y = pos[1];
						// 						objinst.position.z = pos[2];
						// 					}
						// 					if ('Axis' in inst && 'Angle' in inst) {
						// 						var axis = inst.Axis;
						// 						var ang = inst.Angle * Math.PI / 180.0;
						// 						var vec = new THREE.Vector3(axis[0], axis[1], axis[2]);
						// 						objinst.setRotationFromAxisAngle(vec, ang);
						// 					}
						// 					var data = {};
						// 					if ('Role' in inst)
						// 						data.Role = inst.Role;
						// 					else
						// 						data.Role = 'Fixed';
						// 					data.Pid = inst.Instance;
						// 					objinst.userData = data;
						// 					objinst.add(x.Obj3D);
						// 					res(objinst);
						// 					log.v("Done Generating the Module/Model");
						// 				}
						// 			}
						// 		});
						// 	});
						// }
					}
				}
				else if (unit.removed) {
					obj.destroy()
					continue;
				}
				if (unit.position) {
					if (unit.position.x || (unit.position.x == 0))
						obj.x = Math.round(unit.position.x);
					if (unit.position.y || (unit.position.y == 0))
						obj.y = Math.round(unit.position.y);
				}

				if (unit.scale) {
					obj.scale = new PIXI.Point(unit.scale.x || 1, unit.scale.y || 1);
				}

				if (unit.tint)
					obj.tint = unit.tint;

				if (unit.responseHandler) {
					obj.interactive = true;
					let evoke = (e) => {
						log.d(e.currentTarget);
						this.send({
							"Cmd": unit.responseHandler.Cmd, mouse: {
								x: e.data.originalEvent.x,
								y: e.data.originalEvent.y
							}}, unit.responseHandler.Handler, _=> {
								log.d("example evoke callback");
							});
					}
					obj.on('click', evoke);
				}

				if (unit.new) {
					if (unit.parentId) {
						let parent = this.Vlt.View.Objects(unit.parentId);
						if (parent) {
							parent.addChild(obj);
						} else {
							log.v("Parent not defined in pixi stage");
							this.Vlt.View.Stage.addChild(obj);
						}
					} else {
						this.Vlt.View.Stage.addChild(obj);
					}
				}
			}

			this.Vlt.View.Renderer.render(this.Vlt.View.Stage);
			log.d('rendered after add');
			if (fun)
				fun(null, com);
		}

		function GetCanvas(com, fun = _ => _) {
			console.log("2DView/GetCanvas");
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

		function ImageCapture(com, fun) {
			if (this.Vlt.Count)
				this.Vlt.Count++
			else
				this.Vlt.Count = 1;

			View.Renderer.render(View.Stage);

			let b64 = this.Vlt.View.Renderer.domElement.toDataURL();

			com.Image = b64;
			com.Name = this.Vlt.Count;

			if ("Controller" in this.Par) {
				com.Cmd = "SaveImage";
				this.send(com, this.Par.Controller);
			}

			fun(null, com);
		}



	})();
