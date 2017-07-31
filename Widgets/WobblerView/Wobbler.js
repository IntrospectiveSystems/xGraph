//# sourceURL=Wobbler.js
//jshint esversion: 6
(function Wobbler() {

	class Wobbler {
		Setup(com, fun) {
			this.super(com, (err, cmd) => {
				this.Vlt.k = 1
				window.wobble = this;
				fun(com, null);
			});
		}
		Resize(com, fun) {
			// debugger;
			let canvas = $(this.Vlt.renderer.domElement);
			let width = window.innerWidth, height = window.innerHeight; // size of the actual view area. TODO change this to account for view div.
			let viewAspect = width / height;
			let k = this.Vlt.k, dw = 960 * k, dh = 540 * k; // desired width, desired height. k = resolution. 2k = FHD, 4k = UHD, 8k, 1.33333k = HD, 2.66666k = QHD
			let wz = width / dw, hz = height / dh; // width zoom and height zoom. the bigger zoom is fill, the smaller is fit.
			let fit = Math.min(wz, hz);
			let fill = Math.max(wz, hz);
			let scale = fit;
			let aspect = dw / dh;
			if (viewAspect > aspect) {
				//bars on the left and right
				let excess = width - (scale * dw);
				let left = Math.floor(excess / (2 * scale));
				canvas.css('position', 'relative');
				canvas.css('left', left + 'px');
			} else {
				//bars on thetop and bottom
				let excess = height - (scale * dh);
				let top = Math.floor(excess / (2 * scale));
				canvas.css('position', 'relative');
				canvas.css('top', top + 'px');
			}
			this.Vlt.renderer.setSize(dw, dh);
			canvas.css('zoom', scale);
			canvas.css('-moz-transform', 'scale(' + scale + ', ' + scale + ')');
			canvas.css('-moz-transform-origin', 'left center');
			this.Vlt.camera.aspect = aspect;
			this.Vlt.camera.updateProjectionMatrix();
			this.super(com, () => {
				fun(null, com);
			});
		}
		CreateMesh(com, fun) {
			let size = com.Size;
			function choice(arr) {
				return arr[Math.floor(Math.random() * arr.length)];
			}
			this.Vlt.dat = new Array(size * size).fill(0);
			this.Vlt.planeGeometry = new THREE.PlaneGeometry(size - 1, size - 1, size - 1, size - 1);
			this.Vlt.planeGeometry.dynamic = true;
			this.Vlt.planeMaterial = new THREE.MeshPhongMaterial({
				color: //choice([0x05fabb, 0xff8800, 0xa64dff, 0x3fdc0a]),
				// 0xc6b276,
				0x888888,
				wireframe: !this.Par.Wireframe || false
			});
			if('plane' in this.Vlt) this.Vlt.scene.remove(this.Vlt.plane);
			this.Vlt.plane = new THREE.Mesh(this.Vlt.planeGeometry, this.Vlt.planeMaterial);
			this.Vlt.plane.scale.set(100 / size, 100 / size, 100 / size);
			this.Vlt.scene.add(this.Vlt.plane);

			fun(null, com);
		}
		Idle(com, fun) {
			let that = this;
			let still = com.Still || false;
			function idlefunc() {
				if(!still){
					let size = 101;
					let waves = [[0, 0, 5, 1, 3], [0, 100, 1.618, 1, 1], [50, 50, .5, 1, 1]];
					let x = size, y = size;
					let t = new Date().getTime();
					for (let w = 0; w < waves.length; w++) {
						for (let i = 0, j = 0, k = 0; j < y; i++ , i = i == x ? 0 : i, j = i == 0 ? j + 1 : j, k++) {
							// console.log(i, j, k);
							let distance = Math.sqrt(Math.pow(waves[w][0] - i, 2) + Math.pow(waves[w][1] - j, 2));
							if (w == 0) that.Vlt.dat[k] = 0;
							that.Vlt.dat[k] += Math.sin((distance - ((t / 100) * (waves[w][3] * waves[w][4]))) / (5 * waves[w][4])) * (1 - (distance / size)) * waves[w][2];
						}
					}
				}
				that.send({Cmd: 'Render'}, that.Par.Pid, () => {
					that.Vlt.idle = requestAnimationFrame(idlefunc);
				});
			};
			this.Vlt.idle = requestAnimationFrame(idlefunc);

			fun(null, com);
		}
		StopIdle(com, fun) {
			cancelAnimationFrame(this.Vlt.idle);

			requestAnimationFrame(() => {
				fun(null, com);
			})
			
		}
		Render(com, fun) {
			// write all the dat points into the mesh
			// console.time('data');
			for (var i = 0, l = this.Vlt.planeGeometry.vertices.length; i < l; i++) {
				this.Vlt.plane.geometry.vertices[i].z = (5 * this.Vlt.dat[i]);
				// that.Vlt.wireframe.geometry.vertices[i].z = (5 * dat[i]);
			}
			// console.timeEnd('data');

			// console.time('other');
			// tell it, it needs to update the mesh
			this.Vlt.plane.geometry.dynamic = true;
			this.Vlt.plane.geometry.__dirtyVertices = true;
			this.Vlt.plane.geometry.verticesNeedUpdate = true;
			// console.timeEnd('other');

			// console.time('render');
			this.Vlt.renderer.render(this.Vlt.scene, this.Vlt.camera);
			this.Vlt.plane.geometry.computeVertexNormals();
			this.Vlt.renderer.render(this.Vlt.scene, this.Vlt.camera);
			// console.timeEnd('render');

			fun(null, com);
		}
		Start(com, fun) {
			let that = this;
			this.super(com, (err, cmd) => {
				let size = 101;
				this.send({ Cmd: "Subscribe", Pid: this.Par.Pid }, "12345678");
				

				{ // 

					if (that.Vlt.k <= 6) {
						this.Vlt.renderer = new THREE.WebGLRenderer({
							preserveDrawingBuffer: true,
							antialias: true
						});
					} else {
						this.Vlt.renderer = new THREE.CanvasRenderer();
					}

					// this.Vlt.renderer.clearColor(0xffffff, 1);
					// this.Vlt.renderer = new THREE.CanvasRenderer();
					this.Vlt.div.append($(this.Vlt.renderer.domElement));
					this.Vlt.camera = new THREE.PerspectiveCamera(45, 100 / 100, 0.1, 1000);
					var light = new THREE.AmbientLight(0x404040); // soft white light
					var dirLight = new THREE.DirectionalLight(0xffffff, 2);
					dirLight.position.set(0, 100, 80);
					dirLight.castShadow = false;

					this.Vlt.scene = new THREE.Scene();
					// this.Vlt.scene.background = new THREE.Color(0xffffff);
					this.Vlt.scene.add(dirLight);
					this.Vlt.scene.add(light);
					// this.Vlt.scene.add(new THREE.AxisHelper(50));
					this.Vlt.scene.add(this.Vlt.camera);

					// var geometry = new THREE.SphereGeometry(1, 32, 32);
					// var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
					// this.Vlt.sphere = new THREE.Mesh(geometry, material);
					// this.Vlt.scene.add(this.Vlt.sphere);
				}
				
				this.send({Cmd: 'Resize'}, this.Par.Pid, () => {});
				
				fun(null, com);
			});
		}
		BeginMovie(com, fun) {
			// debugger;
			fun = fun || (() => {});
			let fps = com.FrameRate || com.FPS || 30;
			let size = 101;

			this.send({ Cmd: 'StopIdle' }, this.Par.Pid, () => {
				this.send({ Cmd: 'CreateMesh', Size: size }, this.Par.Pid, () => {
					this.send({ Cmd: 'Render' }, this.Par.Pid, () => { });
				});
			});


			// clearInterval(this.Vlt.idle);
			// debugger;
			// waitFrames();

			requestAnimationFrame(() => {
			});
			

			// debugger;
			fun(null, com);
			// this.Vlt.idle = setInterval(this.Vlt.idlefunc, 17);

		}
		DOMLoaded(com, fun) {
			let that = this;
			this.Vlt.button = $(document.createElement('button'));
			this.Vlt.button.css('padding', '8px');
			this.Vlt.button.css('background-color', 'white');
			this.Vlt.button.css('position', 'absolute');
			this.Vlt.button.css('color', 'black');
			this.Vlt.button.html('SAVE');
			this.Vlt.button.on('click', window.screencap = function (event) {
				let b64 = that.Vlt.renderer.domElement.toDataURL();
				that.Vlt.renderer.domElement.toBlob((blob) => {
					console.log('LENGTH', b64.length);
					that.Vlt.downloadImage = $(document.createElement('a'));
					that.Vlt.downloadImage[0].href = window.URL.createObjectURL(blob);
					that.Vlt.downloadImage.css('position', 'absolute');
					that.Vlt.downloadImage.css('top', '10px');
					that.Vlt.downloadImage.css('line-height', '0px');
					that.Vlt.downloadImage.css('left', '67px');
					that.Vlt.downloadImage.css('border', '3px solid white');
					that.Vlt.downloadImage.attr('download', new Date().getTime());
					that.Vlt.downloadImage.html(`<img src="${b64}" style="width:100px;height:auto" />`);
					that.Vlt.div.append(that.Vlt.downloadImage);
				});
			});
			this.Vlt.div.append(this.Vlt.button);


			// this.Vlt.form = $(document.createElement('input'));
			this.Vlt.text = $(document.createElement('input'));
			// this.Vlt.text.css('padding', '8px');
			// this.Vlt.text.css('background-color', 'white');
			this.Vlt.text.css('position', 'absolute');
			this.Vlt.text.css('top', '82px');
			// this.Vlt.text.css('z-index', '500');
			this.Vlt.text.css('color', 'black');

			this.Vlt.text.on('click', function () {
				// console.log('SFDKNJH'); 
				this.focus();
			});

			// this.Vlt.text.html('SAVE');
			this.Vlt.div.append(this.Vlt.text);

			this.Vlt.submitbutton = $(document.createElement('button'));
			this.Vlt.submitbutton.css('padding', '8px');
			this.Vlt.submitbutton.css('background-color', 'white');
			this.Vlt.submitbutton.css('position', 'fixed');
			this.Vlt.submitbutton.css('color', 'black');
			this.Vlt.submitbutton.css('top', '41px');
			this.Vlt.submitbutton.html('QUEUE');
			this.Vlt.submitbutton.on('click', function() {

				that.send({ Cmd: "AddFolder", Dir: that.Vlt.text.val() }, that.Par.Controller, (err, cmd) => {
					that.Vlt.text.val("");
				});
			});
			this.Vlt.div.append(this.Vlt.submitbutton);

			this.Vlt.resolution = $(document.createElement('input'));
			this.Vlt.resolution.attr('type', 'range');
			this.Vlt.resolution.attr('min', 1);
			this.Vlt.resolution.attr('step', 1);
			this.Vlt.resolution.attr('value', this.Vlt.k);
			this.Vlt.resolution.attr('max', 6);
			this.Vlt.resolution.css('position', 'absolute');
			this.Vlt.resolution.css('top', '110px');
			this.Vlt.resolution.on('change input', () => {
				console.log('asdfasdfasdfasdfasdfadfasdf');
				// debugger;
				this.send({Cmd: 'Resize'}, this.Par.Pid, () => {});
				this.Vlt.resolutionDisplay.html(this.Vlt.resolution.val());
				this.Vlt.k = this.Vlt.resolution.val();
				this.Vlt.resolutionDisplay.html('' + (this.Vlt.k * 960) + ' x ' + (this.Vlt.k * 540));
			});

			this.Vlt.div.append(this.Vlt.resolution);

			this.Vlt.resolutionDisplay = $(document.createElement('pre'));
			this.Vlt.resolutionDisplay.css('position', 'absolute');
			this.Vlt.resolutionDisplay.css('top', '102px');
			this.Vlt.resolutionDisplay.css('left', '136px');
			this.Vlt.resolutionDisplay.html('' + (this.Vlt.k * 960) + ' x ' + (this.Vlt.k * 540));
			// this.Vlt.resolutionDisplay.css('top', '110px');

			this.Vlt.div.append(this.Vlt.resolutionDisplay);


			class VectorControl {
				constructor(opts) {
					this.dimensions = opts.dimensions;
					this.min = opts.min;
					this.max = opts.max;
					this.update = opts.update;
					this.posx = opts.x;
					this.posy = opts.y;
					this.step = opts.step || 1;

					this.controls = []
					for (let i = 0; i < this.dimensions; i++) {
						let control = $(document.createElement('input'));
						that.Vlt.div.append(control);
						// debugger;
						control.attr('type', 'range');
						control.attr('min', this.min);
						control.attr('max', this.max);
						control.attr('step', this.step);
						control.css('position', 'absolute');
						control.css('width', '200px');
						control.css('z-index', '200');
						control.css('top', (i * 23 + this.posy) + 'px');
						control.css('left', this.posx + 'px');
						this.controls.push(control);
						control.on('change, input', () => {
							this.change(i, control.val());
						});
					}

					this.labels = []
					for (let i = 0; i < this.dimensions; i++) {
						let label = $(document.createElement('pre'))
						label.css('position', 'absolute');
						label.css('z-index', '200');
						label.css('top', (i * 23 + this.posy - 9) + 'px');
						label.css('left', (this.posx + 207) + 'px');
						label.html(this.controls[i].val());
						this.labels.push(label);
						that.Vlt.div.append(label);
					}
				}
				change(dimension, val) {
					// debugger;
					this.labels[dimension].html(this.controls[dimension].val());
					let vals = [];
					for(let i = 0; i < this.dimensions; i ++) {
						vals.push(this.controls[i].val());
					}
					this.update(...vals);
				}
				set(...vals) {
					for(let i = 0; i < vals.length; i ++) {
						this.controls[i].val(vals[i]);
						this.change(i, vals[i]);
					}
				}
			}

			this.Vlt.cameraPositionWidget = new VectorControl({
				dimensions: 3,
				min: -500,
				max: 500,
				update: (x, y, z) => {
					this.Vlt.camera.position.set(x, y, z);
				},
				x: 0,
				y: 150
			});

			this.Vlt.cameraRotationWidget = new VectorControl({
				dimensions: 3,
				min: 0,
				max: Math.PI*2,
				step: Math.PI/50,
				update: (x, y, z) => {
					this.Vlt.camera.rotation.set(x, y, z);
				},
				x: 0,
				y: 230
			});

			this.super(com, (err, cmd) => {});
			fun(null, com)
			
			// this.Vlt.div.append
			// debugger;
			// console.log(data);

			let size = 101;
			this.send({ Cmd: "CreateMesh", Size: size }, this.Par.Pid, () => {
				this.Vlt.camera.position.set(0, -100, 120);


				// this.Vlt.camera.position.set(111, -53, 63);
				// this.Vlt.camera.rotation.set(.62831, .87964, .81681);
				// CAMERA MAGIC ANGLES
				// 111, -53, 63
				// .62831, .87964, .81681
				this.Vlt.cameraPositionWidget.set(this.Vlt.camera.position.x, this.Vlt.camera.position.y, this.Vlt.camera.position.z);
				this.Vlt.cameraRotationWidget.set(this.Vlt.camera.rotation.x, this.Vlt.camera.rotation.y, this.Vlt.camera.rotation.z);
				this.send({ Cmd: "Idle", Size: size, Still: true }, this.Par.Pid, () => {
					this.send({ Cmd: "RendererReady" }, this.Par.Controller, () => { });
				});
			});

			// setTimeout(() => {
			// }, 2000);

			let controls = undefined;
			if ('TrackballControls' in THREE) {
				controls = new THREE.TrackballControls(this.Vlt.camera, this.Vlt.renderer.domElement, () => {
					this.Vlt.cameraPositionWidget.set(this.Vlt.camera.position.x, this.Vlt.camera.position.y, this.Vlt.camera.position.z);
					this.Vlt.cameraRotationWidget.set(this.Vlt.camera.rotation.x, this.Vlt.camera.rotation.y, this.Vlt.camera.rotation.z);
				});
				controls.noPan = true;
			}
			updateControls();
			function updateControls() {
				if (typeof controls != 'undefined') controls.update();
				requestAnimationFrame(updateControls);
			}


		}
		FrameData(com, fun) {
			// debugger;
			let that = this;
			this.send({Cmd: 'CreateMesh', Size: com.Size}, this.Par.Pid, () => {

				this.Vlt.dat = com.Data;
				let number = com.Data[com.size * (com.size / 2)];
				console.log('number', number);
				// this.Vlt.sphere.position.set(0, 0, 0)
				this.send({ Cmd: 'Render' }, this.Par.Pid, () => {
					console.log('Frame! returrrrnnnn');

					let b64 = that.Vlt.renderer.domElement.toDataURL();
					that.Vlt.renderer.domElement.toBlob((blob) => {
						console.log('LENGTH', b64.length);
						that.Vlt.downloadImage = $(document.createElement('a'));
						that.Vlt.downloadImage[0].href = window.URL.createObjectURL(blob);
						that.Vlt.downloadImage.css('position', 'absolute');
						that.Vlt.downloadImage.css('top', '10px');
						that.Vlt.downloadImage.css('line-height', '0px');
						that.Vlt.downloadImage.css('left', '67px');
						that.Vlt.downloadImage.css('border', '3px solid white');
						that.Vlt.downloadImage.attr('download', new Date().getTime());
						that.Vlt.downloadImage.html(`<img src="${b64}" style="width:100px;height:auto" />`);
						that.Vlt.div.append(that.Vlt.downloadImage);
						com.Image = b64;
						delete com['Data'];
						// debugger;
						fun(null, com);
						this.send({ Cmd: "RendererReady" }, this.Par.Controller, () => { });
					});

				});
			});

		}
	}

	return Viewify(Wobbler);

})();