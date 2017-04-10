(function SceneManager() {

	let dispatch =  {
		Start: Start,
		Setup:Setup,
		mouseRay: mouseRay,
		getCamera: getCamera,
		setCamera: setCamera,
		getFocus: getFocus,
		setFocus: setFocus
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------rgbToHex
	function rgbToHex(r, g, b) {
		return (r << 16) + (g << 8) + b;
	}

	//-----------------------------------------------------Start
	function Setup(com, fun) {
		console.log('--SceneManager/Setup');

		var Vlt = this.Vlt;
		Vlt.Active = false;
		Vlt.Mouse = {};

		$("body").css('overflow', 'hidden');
		
		window.addEventListener('keydown', function(evt) {
			switch(evt.code) {
				case 'F10':
					evt.preventDefault();
					openCLI();
					break;
				case 'F2':
					if (Vlt.Active)
						Vlt.Active = false;
					else
						Vlt.Active = true;
				default:
			}
		});

		var div = document.getElementById("Grok");
		Vlt.Render = new THREE.WebGLRenderer({antialias: false});
//		Vlt.Render.setClearColor(0xF2EEE1, 1);

		Vlt.Render.setSize(div.scrollWidth, div.scrollHeight);
		div.appendChild(Vlt.Render.domElement);

		Vlt.Scene = new THREE.Scene();
		Vlt.Focus = new THREE.Vector3(0,0,0);

		Vlt.Camera = new THREE.PerspectiveCamera(45,
			div.scrollWidth / div.scrollHeight, 0.1, 20000);
		Vlt.Camera.position.x = 175;
		Vlt.Camera.position.y = 175;
		Vlt.Camera.position.z = 175.0;
		Vlt.Camera.up.set(0.0, 0.0, 1.0);
		Vlt.Camera.lookAt(Vlt.Focus);
		Vlt.Camera.updateProjectionMatrix();

		// Vlt.Root = new THREE.Object3D();
		// Vlt.Scene.add(Vlt.Root);
		Vlt.Ray = new THREE.Raycaster();
		Vlt.Mouse.Mode = 'Idle';
		Vlt.txtPivot = new THREE.Object3D();
		Vlt.txtPosition = new THREE.Object3D();

		// Vlt.Light = new THREE.DirectionalLight(0xFFFFFF);
		// Vlt.Light.position.set(-40, 60, 100);
		// //Vlt.Scene.add(Vlt.Light);
		// Vlt.Ambient = new THREE.AmbientLight(0x808080);
		// //Vlt.Scene.add(Vlt.Ambient);
		var axes = new THREE.AxisHelper(100);
		axes.position.z = 0.01;
		Vlt.Scene.add(axes);

		Resize(Vlt);
		renderLoop(Vlt);

		if (fun){
			fun(null,com);
		}
		//-----------------------------------------------------Render
		function renderLoop(vault) {
			Vlt = vault;
			loop();

			function loop() {

				Vlt.Render.render(Vlt.Scene, Vlt.Camera);
				// if (Vlt.Scene.getObjectByName('particles')) {
				// 	Vlt.Scene.getObjectByName('particles').tick();
				// }

				//move the camera
				var cam = Vlt.Camera;
				var pos = Vlt.txtPosition;
				var pvt = Vlt.txtPivot;
				var vec = new THREE.Vector3();
				vec.x = cam.position.x - pos.position.x;
				vec.y = cam.position.y - pos.position.y;
				vec.z = cam.position.z - pos.position.z;
				var rxy = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
				var theta = Math.atan2(rxy, vec.z);
				var azm = Math.atan2(vec.x, vec.y);
				pvt.rotation.x = theta;
				pos.rotation.z = Math.PI - azm;
				//	pos.position.x = 3;
				requestAnimationFrame(loop);
			}
		}
	}


	function Start (com, fun){
		console.log("--SceneManager/Start");
		let Vlt = this.Vlt;
		let Par = this.Par;
		let that=this;

		let delay = Par.Delay ||20;
		console.log("Delay is ",delay);
		Vlt.Pulse = setInterval(step, delay);

		function step () {
			if (Vlt.Active){

				let q= {"Cmd":"MoveBugs"};

				if (Vlt.Scene.getObjectByName("heatField")){
					q.heatField = true;
				}

				that.send(q, Par.BugArray, updateBugs);

				function updateBugs(err, com) {
					console.log("returned from bug update");

					if (err)
						console.log("--Error: ",err);
					if (Vlt.Scene.getObjectByName("bugSystem")){
						Vlt.Scene.getObjectByName("bugSystem") .geometry = com.System.geometry;
						Vlt.Scene.getObjectByName("bugSystem") .geometry.verticesNeedUpdate =true;
						Vlt.Scene.getObjectByName("bugSystem") .geometry.colorsNeedUpdate =true;

					} else{
						let system = new THREE.Points(com.System.geometry, com.System.material);
						system.name = "bugSystem";
						system.sortParticles= true;
						Vlt.Scene.add(system);
						console.log(Vlt.Scene.children);
					}

					let q={"Cmd": "UpdateField"};
					if (Vlt.Scene.getObjectByName("bugSystem")){
						q.vertices= Vlt.Scene.getObjectByName("bugSystem").geometry.vertices;
						q.outputTemps = Vlt.Scene.getObjectByName("bugSystem").geometry.outputTemps;
					}

					that.send(q, Par.HeatField, updateField);

					function updateField(err, com) {
						console.log("returned from field update");
						if (err)
							console.log("--Error: ", err);
						if (Vlt.Scene.getObjectByName("heatField")) {
							Vlt.Scene.getObjectByName("heatField").geometry = com.System.geometry;
							Vlt.Scene.getObjectByName("heatField").geometry.colorsNeedUpdate = true;


						} else {
							let system= new THREE.Points(com.System.geometry,com.System.material);
							system.name="heatField";
							system.sortParticles=true;
							system.blending= THREE.AdditiveBlending;
							Vlt.Scene.add(system);
							console.log(Vlt.Scene.children);
						}
					}
				}
			}else{
				console.log("--sim not running--");
			}
		}


		if (fun)
			fun(null,com);
	}


	//-----------------------------------------------------Resize
	function Resize(vault) {
		var div = document.getElementById("Grok");
		var w = div.scrollWidth;
		var h = div.scrollHeight;
		var Vlt= vault;
		var parent = div;
		var styles = getComputedStyle(parent);
		div.style.overflow = 'hidden';
		var w = parseInt(styles.getPropertyValue('width'), 10);
		var h = parseInt(styles.getPropertyValue('height'), 10);
		Vlt.Mouse.Mode = 'Idle';
		Vlt.Render.setSize(w, h);
		Vlt.Camera.aspect = w / h;
		Vlt.Camera.updateProjectionMatrix();
	}

	//-----------------------------------------------------getCamera
	// Return current camera position as [x, y, z]
	function getCamera() {
		var Vlt = Vault;
		return Vlt.Camera.position.toArray();
	}

	//-----------------------------------------------------setCamera
	// Set camera position from an array [x, y, z]
	function setCamera(vcam) {
		var Vlt = Vault;
		Vlt.Camera.position.fromArray(vcam);
		Vlt.Camera.lookAt(Vlt.Focus);
	}

	//-----------------------------------------------------getFocus
	// Return current focus as array [x, y, z]
	function getFocus() {
		var Vlt = Vault;
		return Vlt.Focus.toArray();
	}

	//-----------------------------------------------------setFocus
	// Set focus from array [x, y, z]
	function setFocus(vfoc) {
		var Vlt = Vault;
		Vlt.Focus.fromArray(vfoc);
		Vlt.Camera.lookAt(Vlt.Focus);
	}

	//-----------------------------------------------------mouseRay
	function mouseRay(evt) {
		var info = {};
		var Vlt = Vault;
		Vlt.Ray.precision = 0.00001;
		container = document.getElementById("Grok");
		var w = container.clientWidth;
		var h = container.clientHeight - 2 * container.clientTop;
		var vec = new THREE.Vector2();
		vec.x = 2 * (evt.clientX - container.offsetLeft) / w - 1;
		vec.y = 1 - 2 * (evt.clientY - container.offsetTop) / h;
		Vlt.Ray.setFromCamera(vec, Vlt.Camera);
		var hits = Vlt.Ray.intersectObjects(Vlt.Scene.children, true);
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
								if(!('Type' in info))
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
				obj = obj.parent;
			}
		}
		if ('Type' in info)
			return info;
	}

	//-----------------------------------------------------openCLI
	// Create/(Open Previous) CLI, and allow entering of commands.
	// Display command and response in scrollable history.
	function openCLI() {
		if (document.getElementById('CLIDiv') !== null) {
			var Div = $('#CLIDiv');
			if(Div.is(':visible')) {
				Div.hide();
			} else {
				Div.show();
			}
			return;
		}

		var CLIDiv = document.createElement('div');
		CLIDiv.id = 'CLIDiv';
		var Style = CLIDiv.style;
		Style.height = '800px';
		Style.width = '600px';
		Style.position = 'Absolute';
		Style.display = 'flex';
		Style.flexDirection = 'column';
		Style.top = 0;
		Style.right = 0;
		CLIDiv.zIndex = 1000;
		Style.backgroundColor = 'black';
		Style.color = 'white';

		var CLITitleBar = document.createElement('div');
		CLITitleBar.id = 'CLITitleBar';
		var Style = CLITitleBar.style;
		Style.height = '30px';
		Style.textAlign = 'center';
		Style.display = 'flex';
		Style.flexDirection = 'row';
		CLIDiv.appendChild(CLITitleBar);

		var CLITitle = document.createElement('label');
		CLITitle.innerText = 'CLI';
		CLITitle.style.textAlign = 'center';
		CLITitle.style.marginTop = 'auto';
		CLITitle.style.marginBottom = 'auto';
		CLITitle.style.flex = 1;
		CLITitleBar.appendChild(CLITitle);

		var CLICmdHistory = document.createElement('div');
		CLICmdHistory.id = 'CLIHistory';
		var Style = CLICmdHistory.style;
		Style.flex = 1;
		Style.overflow = 'auto';
		CLICmdHistory.classList.add('CLIHistory');
		CLIDiv.appendChild(CLICmdHistory);

		var CLICmdBox = document.createElement('input');
		CLICmdBox.id = 'CLICmdBox';
		CLICmdBox.style.height = '32px';
		CLICmdBox.type = 'text';
		CLICmdBox.addEventListener("keyup", function(event) {
			event.preventDefault();
			if (event.keyCode == 13) {
				enterCommand(CLICmdBox.value);
				CLICmdBox.value = '';
			}
		});
		CLIDiv.appendChild(CLICmdBox);
		document.getElementById('Body').appendChild(CLIDiv);
		$('#CLIDiv').draggable();

		function enterCommand(commandText) {
			console.log('Command Entered: ', commandText);
			sendCommand(commandText, function(responseText) {
				var cmdText = document.createElement('p');
				cmdText.innerText = commandText;
				CLICmdHistory.appendChild(cmdText);
				if (responseText) {
					for (var i=0; i<responseText.length; i++) {
						var respText = document.createElement('p');
						var text = '> ';
						text += responseText[i];
						respText.innerText = text;
						CLICmdHistory.appendChild(respText);
					}
					CLICmdHistory.appendChild(document.createElement('br'));
				}
				CLICmdHistory.scrollTop =  CLICmdHistory.scrollHeight - CLICmdHistory.clientHeight;
			});
		}

		function sendCommand(commandText, callback) {
			// Command functionality

			var TestResponse = [
				'Line 1',
				'Line 2',
				'Line 3'
			];

			callback(TestResponse);

		}
	}

})();
