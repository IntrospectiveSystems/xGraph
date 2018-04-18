//# sourceURL=2DView.js
(
	/**
	 * The 2DView entity is the Apex and only entity of the 2DView Module.
	 * This entity requres its Setup function invoked during the Setup phase of Nexus startup as well as
	 * its Start function invoked during the Start phase of Nexus' startup.
	 * The main capability of this entity is to add and render a Pixi.js stage on the div provided by 
	 * the Viewify class (the pixi.js stage is stored in this.Vlt.div). Currently only Pixi primitive graphics objects can be 
	 * added to the stage and rendered.
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
			EvokeExample
		};

		//Using views we must inject basic functionality via the viewify script.
		//We no longer need to build divs in our view class just access the existing
		//div from this.Vlt.div. The div is already appended to the body.
		return Viewify(dispatch, "3.1");

		/**
		 * Create the Pixi renderer (autodetected) and Stage and append the rendered canvas to the div
		 * @param {Object} com 
		 * @param {Function} fun 
		 */
		function Setup(com, fun) {
			log.i("-2DView/Setup");

			// /**
			//  * we hoist the setup command to the Viewify.js script
			//  */
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
				View.Height = View.Width = 2048
				View.Renderer = PIXI.autoDetectRenderer(View.Height, View.Width, { "antialias": true });
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
		 * Retreives the data from this.Par.Source if defined. Also subscribes 
		 * to the server to allow for server communications to reach this module.
		 * If there was a controller defined we also register with that controller.
		 * @param {Object} com 
		 * @param {Function} fun 
		 */
		function Start(com, fun) {
			log.i("--2DView/Start");

			//allow for communications from the server side to this module
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
					DataChannels: this.Par.DataChannels || [{
						Channel: "Data",
						Flow: null,
						Handler: this.Par.Pid
					}],
					Pid: this.Par.Pid
				}, this.Par.Source, (err, com) => {
					if (err) {
						log.w("error getting data from source in Par.Source");
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
			//			START EXAMPLE CODE FOR ADDING OBJECTS TO Stage
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


		/**
		 * This is an example of an Evoke handler. This particular example 
		 * generates a popup module containing a 3DView module or the one set in
		 * Par.EvokeView.
		 * @param {Object} 		com 
		 * @param {String}		com.id	the id of the module that was evoked
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

		// /**
		//  * Propagate a DomLoaded Event to children views. We append the canvas to the div.
		//  * @param {Object} com 
		//  * @param {Function} fun 
		//  */
		function DOMLoaded(com, fun) {
			log.v("--2DView/DOMLoaded");
			let div = this.Vlt.div;
			div.append($(this.Vlt.View.Renderer.view));
			let View = this.Vlt.View;

			this.super(com, fun);
		}

		// /**
		//  * Cascade a render down the DOM tree of views
		//  * @param {Object} com 
		//  * @param {Function} fun 
		//  */
		function Render(com, fun) {
			log.v("--2DView/Render", this.Par.Pid.substr(30));
			this.Vlt.View.Renderer.render(this.Vlt.View.Stage);
			this.super(com, fun);
		}

		// /**
		//  * Sent when a resize event occurs on the div. 
		//  * @param {Object} com 
		//  * @param {Function} fun 
		//  */
		function Resize(com, fun) {
			this.super(com, (err, cmd) => {
				let View = this.Vlt.View;
				fun(null, com);
			});
		}


		/**
		 * The main PIXI.js functionality. Currently only allows for 
		 * primitive type Pixi.Graphics, howerver sprites with textures are coming.
		 * An array of objects is recieved and added to the stage before being 
		 * rendered. 
		 * @param {Object} com 
		 * @param {Object} com.Objects 	The array of pixi graphics objects to be displayed
		 * @param {Function} fun 
		 */
		function DrawObjects(com, fun) {
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
			// /**
			//  * 
			//  * The com will contain an Objects key that lists an array of objects
			//  * to be modified on the 3d view. All of the listed attributes need NOT
			//  * exist. Only a unit ID is required.
			//  * 
			//  * 
			//  * com.Objects = [
			//  * 		obj = {
			// 			id: idx,
			// 			geometry: {
			// 				id: "geom",
			// 				name: "Circle",
			// 				arguments: [5, 5, 3]
			// 			},
			// 			fill: {
			// 				color: 0xFFFFFF,
			// 				alpha: 1
			// 			},
			// 			tint: 0xFFFFFF * Math.random(),
			// 			position: {
			// 				x: 100 * Math.random(),
			// 				y: 100 * Math.random()
			// 			},
			// 			scale: {
			// 				x: 10 * Math.random(),
			// 				y: 10 * Math.random()
			// 			},
			// 			responseHandler: {
			// 				Cmd: "EvokeExample",
			// 				Handler: this.Par.Pid
			// 			}
			// 		}
			//  * ]
			//  */

			//return if com.Objects is not an array
			if ((!com.Objects) || (!Array.isArray(com.Objects))) {
				fun("com.Objects must be an array (Array.isArray(com.Objects) == true)", com);
				return;
			}

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
						this.send(
							{
								"Cmd": unit.responseHandler.Cmd,
								mouse: {
									x: e.data.originalEvent.x,
									y: e.data.originalEvent.y
								}
							},
							unit.responseHandler.Handler,
							_ => {}
						);
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
			if (fun)
				fun(null, com);
		}



		/**
		 * Accesses the canvas object of the View
		 * @param {Object} com 
		 * @param {Function=} fun 
		 */
		function GetCanvas(com, fun = _ => _) {
			log.v("2DView/GetCanvas");

			if (!this.Vlt.View || !this.Vlt.View.Renderer) {
				fun('canvas not yet setup');
				return;
			}
			let View = this.Vlt.View;
			this.Vlt.WorldPid = com.pid;
			[com.Width, com.Height] = [View.Renderer.width + 1, View.Renderer.height + 1];

			com.canvas = View.Renderer.view;
			com.Div = this.Par.Pid;
			if (this.Par.Hidden)
				com.Div = this.Vlt.root;
			fun(null, com);
		}

		/**
		 * Take a snapshot of the canvas and send it off to the controller 
		 * (server side) to be saved. This is how one could make a movie. 
		 * @param {Object} com 
		 * @param {Function=} fun 
		 * @returns {com.Image} the base 64 of the image
		 * @returns {com.Name}	the image count 
		 */
		function ImageCapture(com, fun = _ => _) {
			if (!this.Vlt.View || !this.Vlt.View.Renderer) {
				fun('canvas not yet setup');
				return;
			}
			if (this.Vlt.Count)
				this.Vlt.Count++
			else
				this.Vlt.Count = 1;

			let View = this.Vlt.View;
			
			View.Renderer.render(View.Stage);

			let b64 = this.Vlt.View.Renderer.view.toDataURL();

			com.Image = b64;
			com.Name = this.Vlt.Count;

			if ("Controller" in this.Par) {
				com.Cmd = "SaveImage";
				this.send(com, this.Par.Controller);
			}

			fun(null, com);
		}

	})();
