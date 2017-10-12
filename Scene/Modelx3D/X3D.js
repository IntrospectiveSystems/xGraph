//# sourceURL=Model/X3D
(function X3D() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		GenModel: GenModel
	};

	return {
		dispatch: dispatch
	};


	//-----------------------------------------------------rgbToHex
	function rgbToHex(r, g, b) {
		return (r << 16) + (g << 8) + b;
	}

	//-----------------------------------------------------GenModel
	function GenModel(com, fun) {
		console.log('--X3D/GenModel');
		var modx3d = com.Model;
		var zipx3d = new JSZip();
		var Zip;
		var Textures = {};
		zipx3d.loadAsync(modx3d, {base64: true}).then(function(zip){
			Zip = zip;
			textures();
		});

		function textures() {
			//debugger;

			console.log('..textures');
			var dir = Zip.file(/.*./);
			async.eachSeries(dir, texture, genmod);

			function texture(obj, func) {
				var file = obj.name;
				var parts = file.split('.');
				if(parts.length < 2) {
					func();
					return;
				}
				var suffix = parts[parts.length-1];
				switch(suffix) {
					case 'png':
						mime = 'image/png';
						break;
					case 'jpg':
						mime = 'image/jpeg';
						break;
					default:
						func();
						return;
				}
				Zip.file(file).async('uint8array').then(function(img) {
					var blob = new Blob([img], {type: mime});
					var url = URL.createObjectURL(blob);
					var image = document.createElement('img');
					image.src = url;
					var tex = new THREE.Texture(image);
					tex.wrapS = THREE.RepeatWrapping;
					tex.wrapT = THREE.RepeatWrapping;
					tex.needsUpdate = true;
					Textures[file] = tex;
					func();
				});
			}

			function base64ToUint8Array(data) {
				var raw = atob(data);
				var rawLength = raw.length;
				var array = new Uint8Array(new ArrayBuffer(rawLength));
				for(var i = 0; i < rawLength; i++) {
					array[i] = raw.charCodeAt(i);
				}
				return array;
			}
		}

		function genmod() {
			//debugger;
			console.log('..genmod');
			Zip.file('X3D').async('string').then(function(str){
				var x3d = JSON.parse(str);
				dump(x3d);
				if (!('Root' in x3d)) {
					console.log(' ** ERR: No root in x3d object');
					if(fun)
						fun('No Root in X3D model.');
					return;
				}
				var root = new THREE.Object3D();
				trv(x3d.Root, root, 0);
				com.Obj3D = root;
				if(fun)
					fun(null, com);
				return;

				function trv(nodes, par, lev) {
				//	console.log('trv', lev, nodes.length);
					var obj;
					var mesh;
					var part;
					var geo;
					var mat;
					for (var i = 0; i < nodes.length; i++) {
						obj = nodes[i];
						console.log('Name', obj.Name);
						var obj3d = new THREE.Object3D();
						obj3d.castShadow = true;
						if ('Parts' in obj) {
							for (var ipart = 0; ipart < obj.Parts.length; ipart++) {
								part = obj.Parts[ipart];
								geo = new THREE.BufferGeometry();
								geo.castShadow = true;
								var vrt = new Float32Array(part.Vrt.length);
								for (var j = 0; j < vrt.length; j++) {
									vrt[j] = part.Vrt[j];
								}
								geo.addAttribute('position', new THREE.BufferAttribute(vrt, 3));
								if ('UV' in part) {
									var nuv = part.UV.length;
									var uv = new Float32Array(nuv);
									for (j = 0; j < nuv; j++)
										uv[j] = part.UV[j];
									geo.addAttribute('uv', new THREE.BufferAttribute(uv, 2));
								}
								if ('Idx' in part) {
									var ndx = part.Idx.length;
									var idx = new Uint16Array(ndx);
									for (var j = 0; j < ndx; j++)
										idx[j] = part.Idx[j];
									geo.setIndex(new THREE.BufferAttribute(idx, 1));
								}
								if ('Nrm' in part) {
									var nrm = new Float32Array(part.Nrm.length);
									for (var j = 0; j < nrm.length; j++)
										nrm[j] = part.Nrm[j];
									geo.addAttribute('normal', new THREE.BufferAttribute(nrm, 3));
								} else {
									geo.computeVertexNormals();
								}
								var opt = {};
								var color = 0xFFFFFF;
								if ('Diffuse' in part) {
									var diff = part.Diffuse;
									if (typeof diff == 'string') {
										var clr = parseInt(diff);
										if (clr != null)
											color = clr;
									}
									if (Array.isArray(diff)) {
										if(diff.length == 3)
											color = rgbToHex(diff[0], diff[1], diff[2]);
									}
								}
								opt.color = color;
						//		opt.color = #FFFFFF;
								opt.side = THREE.DoubleSide;
								if ('UV' in part && 'Texture' in part) {
									opt.map = Textures[part.Texture];
								}
								mat = new THREE.MeshPhongMaterial(opt);
								mat.transparent = true;
								mat.alphaTest = 0.5;
								mesh = new THREE.Mesh(geo, mat);
							//	mesh.castShadow = true;
								obj3d.add(mesh);
							//	obj3d.castShadow = true;
							}
						}
						if ('Nodes' in obj) {
							trv(obj.Nodes, obj3d, lev + 1);
						}
						obj3d.castShadow = true;
						if (par) {
							par.castShadow = true;
							par.add(obj3d);
						} else {
							return obj3d;
						}
					}
				}
				if(fun)
					fun('Good cucumber');
				return;
			});
		}
	}

	function dump(x3d) {
		if('Textures' in x3d)
			console.log('Textures', JSON.stringify(x3d.Textures));
		if('Root' in x3d) {
			console.log('Root...');
			for(var iobj=0; iobj<x3d.Root.length; iobj++) {
				var obj = x3d.Root[iobj];
				console.log('Object:' + obj.Name);
				console.log('    Pivot:' + JSON.stringify(obj.Pivot));
				console.log(JSON.stringify(Object.keys(obj)));
				if(!('Parts' in obj))
					continue;
				for(var iprt=0; iprt<obj.Parts.length; iprt++) {
					var part = obj.Parts[iprt];
					console.log('    Part:' + iprt);
					for(key in part) {
						switch(key) {
							case 'Name':
								console.log('        Name:' + part.Name);
								break;
							case 'Vrt':
								console.log('        Vrt:' + part.Vrt.length/3);
								break;
							case 'UV':
								console.log('        UV:' + part.UV.length/2);
								break;
							case 'Idx':
								console.log('        Idx:' + part.Idx.length/3);
								break;
							case 'Texture':
								console.log('        Texture:' + part.Texture);
								break;
							default:
								console.log('        ' + key);
								break;
						}
					}
				}
			}
		}
	}

	//-----------------------------------------------------GenModel
	function GenModelx(com, fun) {
	//	console.log('--X3D/GenModel');
		var that = this;
		var x3d = com.Model;
		if (!('Root' in x3d)) {
			console.log(' ** ERR: No root in x3d object');
			if(fun)
				fun('No Root in X3D model.');
			return;
		}
		var obj3d = trv(x3d.Root, null, 0);
		if (obj3d) {
			com.Obj3D = obj3d;
			if(fun)
				fun(null, com);
			return;
		}
		var err = 'X3D object <' + x3d.Name + '> invalid';
		console.log(' ** ERR:' + err);
		if(fun)
			fun(err);
		return;

		function trv(nodes, par, lev) {
			//	console.log('trv', lev, node.length);
			var obj;
			var mesh;
			var part;
			var geo;
			var mat;
			for (var i = 0; i < nodes.length; i++) {
				obj = nodes[i];
				var obj3d = new THREE.Object3D();
				obj3d.castShadow = true;
				if ('Parts' in obj) {
					for (var ipart = 0; ipart < obj.Parts.length; ipart++) {
						part = obj.Parts[ipart];
						geo = new THREE.BufferGeometry();
						geo.castShadow = true;
						var vrt = new Float32Array(part.Vrt.length);
						for (var j = 0; j < vrt.length; j++) {
							vrt[j] = part.Vrt[j];
						}
						geo.addAttribute('position', new THREE.BufferAttribute(vrt, 3));
						if ('UV' in part) {
							var nuv = part.UV.length;
							var uv = new Float32Array(nuv);
							for (j = 0; j < nuv; j++)
								uv[j] = part.UV[j];
							geo.addAttribute('uv', new THREE.BufferAttribute(uv, 2));
						}
						if ('Idx' in part) {
							var ndx = part.Idx.length;
							var idx = new Uint16Array(ndx);
							for (var j = 0; j < ndx; j++)
								idx[j] = part.Idx[j];
							geo.setIndex(new THREE.BufferAttribute(idx, 1));
						}
						if ('Nrm' in part) {
							var nrm = new Float32Array(part.Nrm.length);
							for (var j = 0; j < nrm.length; j++)
								nrm[j] = part.Nrm[j];
							geo.addAttribute('normal', new THREE.BufferAttribute(nrm, 3));
						} else {
							geo.computeVertexNormals();
						}
						var opt = {};
						var color = 0xFFFFFF;
						if ('Diffuse' in part) {
							var diff = part.Diffuse;
							if (typeof diff == 'string') {
								var clr = parseInt(diff);
								if (clr != null)
									color = clr;
							}
							if (Array.isArray(diff)) {
								if(diff.length == 3)
									color = rgbToHex(diff[0], diff[1], diff[2]);
							}
						}
						opt.color = color;
						opt.side = THREE.DoubleSide;
						if ('UV' in part && 'Texture' in part) {
							var txtr = texture(part.Texture);
							opt.map = txtr;
						}
						mat = new THREE.MeshPhongMaterial(opt);
						mesh = new THREE.Mesh(geo, mat);
						mesh.castShadow = true;
						obj3d.add(mesh);
						obj3d.castShadow = true;
					}
				}
				if ('Nodes' in obj) {
					trv(obj.Nodes, obj3d, lev + 1);
				}
				obj3d.castShadow = true;
				if (par) {
					par.castShadow = true;
					par.add(obj3d);
				} else {
					return obj3d;
				}
			}
		}

		function shapes() {
			var color;
			if (!('Shapes' in x3d))
				return;
			for (var ishp = 0; ishp < x3d.Shapes.length; ishp++) {
				var shape = x3d.Shapes[ishp];
				switch (shape.Type) {
					case 'Polyline':
						if ('Color' in shape) {
							var rgb = shape.Color;
							color = rgbToHex(rgb[0], rgb[1], rgb[2]);
						} else {
							color = 0x000000;
						}
						var mat = new THREE.LineBasicMaterial({
							color: color
						});
						var poly = shape.Poly;
						for (var i = 0; i < poly.length; i++) {
							var ply = poly[i];
							var geo = new THREE.Geometry();
							for (var j = 0; j < ply.length; j += 3) {
								geo.vertices.push(new THREE.Vector3(ply[j], ply[j + 1], ply[j + 2]));
							}
							var line = new THREE.Line(geo, mat);
							obj3d.add(line);
						}
						break;
				}
			}
		}

		function texture(filename) {
			if (!('Textures' in x3d))
				return;
			if (!(filename in x3d.Textures))
				return;
			var obj = x3d.Textures[filename];
			var npix = obj.Img.length;
			var pix = new Uint8Array(npix);
			for (var i = 0; i < npix; i++)
				pix[i] = obj.Img[i];
			var tex;
			if (obj.Type == 'RGBA')
				tex = new THREE.DataTexture(pix, obj.Width, obj.Height, THREE.RGBAFormat);
			else
				tex = new THREE.DataTexture(pix, obj.Width, obj.Height, THREE.RGBFormat);
			tex.wrapS = THREE.RepeatWrapping;
			tex.wrapT = THREE.RepeatWrapping;
			tex.needsUpdate = true;
			return tex;
		}
	}

})();
