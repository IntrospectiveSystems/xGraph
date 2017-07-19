//# sourceURL=Wobbler.js
//jshint esversion: 6
(function Wobbler() {

	class Wobbler {
		Setup(com, fun) {
			this.super(com, (err, cmd) => {
				this.waitFrames = function() {
					debugger;
				}
				fun(null, com);
			});
			window.wobble = this;
		}
		Resize(com, fun) {
			let canvas = $(this.Vlt.renderer.domElement);
			let width = window.innerWidth, height = window.innerHeight; // size of the actual view area. TODO change this to account for view div.
			let viewAspect = width / height;
			let k = 1, dw = 960 * k, dh = 540 * k; // desired width, desired height. k = resolution. 2k = FHD, 4k = UHD, 8k, 1.33333k = HD, 2.66666k = QHD
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
			canvas.css('zoom', fit);
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
				color: choice([0x05fabb, 0xff8800, 0xa64dff, 0x3fdc0a]),
				wireframe: this.Par.Wireframe || false
			});
			if('plane' in this.Vlt) this.Vlt.scene.remove(this.Vlt.plane);
			this.Vlt.plane = new THREE.Mesh(this.Vlt.planeGeometry, this.Vlt.planeMaterial);
			this.Vlt.scene.add(this.Vlt.plane);

			fun(null, com);
		}
		Idle(com, fun) {
			let that = this;
			function idlefunc() {
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
			for (var i = 0, l = this.Vlt.planeGeometry.vertices.length; i < l; i++) {
				this.Vlt.plane.geometry.vertices[i].z = (5 * this.Vlt.dat[i]);
				// that.Vlt.wireframe.geometry.vertices[i].z = (5 * dat[i]);
			}

			// tell it, it needs to update the mesh
			this.Vlt.plane.geometry.dynamic = true;
			this.Vlt.plane.geometry.__dirtyVertices = true;
			this.Vlt.plane.geometry.verticesNeedUpdate = true;
			this.Vlt.plane.geometry.computeVertexNormals();

			this.Vlt.renderer.render(this.Vlt.scene, this.Vlt.camera);
			fun(null, com);
		}
		Start(com, fun) {
			let that = this;
			this.super(com, (err, cmd) => {
				let size = 101;
				this.send({ Cmd: "Subscribe", Pid: this.Par.Pid }, "12345678");
				

				{ // 
					this.Vlt.renderer = new THREE.WebGLRenderer({
						preserveDrawingBuffer: true,
						antialias: true
					});

					// this.Vlt.renderer = new THREE.CanvasRenderer();
					this.Vlt.div.append($(this.Vlt.renderer.domElement));
					this.Vlt.camera = new THREE.PerspectiveCamera(45, 100 / 100, 0.1, 1000);
					this.Vlt.camera.position.set(0, -100, 120);
					var light = new THREE.AmbientLight(0x404040); // soft white light
					var dirLight = new THREE.DirectionalLight(0xffffff, 2);
					dirLight.position.set(0, 100, 80);
					dirLight.castShadow = false;

					this.Vlt.scene = new THREE.Scene();
					this.Vlt.scene.add(dirLight);
					this.Vlt.scene.add(light);
					// this.Vlt.scene.add(new THREE.AxisHelper(50));
					this.Vlt.scene.add(this.Vlt.camera);
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
			this.Vlt.button.css('position', 'fixed');
			this.Vlt.button.css('color', 'black');
			this.Vlt.button.html('SAVE');
			this.Vlt.button.on('click', window.screencap = function (event) {
				let b64 = that.Vlt.renderer.domElement.toDataURL();
				that.Vlt.renderer.domElement.toBlob((blob) => {
					console.log('LENGTH', b64.length);
					that.Vlt.downloadImage = $(document.createElement('a'));
					that.Vlt.downloadImage[0].href = window.URL.createObjectURL(blob);
					that.Vlt.downloadImage.css('position', 'fixed');
					that.Vlt.downloadImage.css('top', '10px');
					that.Vlt.downloadImage.css('line-height', '0px');
					that.Vlt.downloadImage.css('left', '100px');
					that.Vlt.downloadImage.css('border', '3px solid white');
					that.Vlt.downloadImage.attr('download', new Date().getTime());
					that.Vlt.downloadImage.html(`<img src="${b64}" style="width:100px;height:auto" />`);
					that.Vlt.div.append(that.Vlt.downloadImage);
				});
			});
			this.Vlt.div.append(this.Vlt.button);
			this.super(com, (err, cmd) => {});
			fun(null, com)
			
			// this.Vlt.div.append
			// debugger;
			// console.log(data);

			let size = 101;
			this.send({ Cmd: "CreateMesh", Size: size }, this.Par.Pid, () => {
				this.send({ Cmd: "Idle", Size: size }, this.Par.Pid, () => { });
			});

			// setTimeout(() => {
				this.send({ Cmd: "RendererReady" }, this.Par.Controller, () => { });
			// }, 2000);

			let controls = undefined;
			if ('TrackballControls' in THREE) controls = new THREE.TrackballControls(this.Vlt.camera);
			updateControls();
			function updateControls() {
				if (typeof controls != 'undefined') controls.update();
				requestAnimationFrame(updateControls);
			}


		}
	}

	return Viewify(Wobbler);

})();