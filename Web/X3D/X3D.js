(function X3D() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GenModel: GenModel
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--X3D/Setup');
		this.Vlt.Graph = [];
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--X3D/Start');
		if(fun)
			fun();
	}

	//-----------------------------------------------------rgbToHex
	function rgbToHex(r, g, b) {
		return (r << 16) + (g << 8) + b;
	}

	//-----------------------------------------------------GenModel
	function GenModel(com, fun) {
		console.log('--GenModel');
		console.log(com);
//		console.log(PNG);
		var modx3d = com.Model;
		var zipx3d = new JSZip();
		var Zip;
		var Textures = {};
		zipx3d.loadAsync(modx3d, {base64: true}).then(function(zip){
			Zip = zip;
			textures();
		});

		function textures() {
			console.log('..textures');
			var dir = Zip.file(/.*./);
			console.log('dir', dir);
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
						ping(obj, func);
						break;
					case 'jpg':
						jpeg(obj, func);
						break;
					default:
						func();
						return;
				}
			}

			function ping(obj, func) {
				var file = obj.name;
				Zip.file(file).async('string').then(function(img64){
					console.log('img64', img64.length);
					var img = atob(img64);
					console.log('img', img.length);
					var reader = new PNGReader(img);
					reader.parse(function(err, png){
						if (err) throw err;
						console.log('png', png);
						console.log('png.width', png.width);
						console.log('colorType', png.getColorType());
						console.log('obj', obj);
						var pix = png.pixels;
						console.log('pix.length', pix.length);
						var tex;
						switch(png.colorType) {
						case 2: // RGB
							tex = new THREE.DataTexture(pix, png.width, png.height, THREE.RGBFormat);
							break;
						case 6: // RGBA
							tex = new THREE.DataTexture(pix, png.width, png.height, THREE.RGBAFormat);
							break;
						default:
							var err = 'Invalid color type in ping';
							console.log(' ** ERR:' + err);
							if(fun)
								fun(err);
							return;
						}
						tex.wrapS = THREE.RepeatWrapping;
						tex.wrapT = THREE.RepeatWrapping;
						tex.needsUpdate = true;
						Textures[file] = tex;
						console.log('file', file);
						console.log('Textures', Textures);
						func();
					});
				});
			}

			function jpeg(obj, func) {
				console.log('..jpeg');
				var file = obj.name;
				Zip.file(file).async('string').then(function(img64) {
					console.log('img64', img64.length);
				/*	var raw = atob(img64);
				//	img = base64ToUint8Array(img64);
					var len = raw.length;
					var img = new ArrayBuffer( len );
					for (var i = 0; i < len; i++)        {
						img[i] = raw.charCodeAt(i);
					} */
				//	img = Uint8Array.from(atob(img64), c => c.charCodeAt(0));
					var img = Base64Binary.decode(img64);
					console.log('img', img.length);
					console.log('typeof img', typeof img);
					// decoded: { width: number, height: number, data: Uint8Array }
					inkjet.decode(img, function(err, decoded) {
						if(err)
							console.log(' ** ERR:' + err);
						else
							console.log('decoded', decoded);
						func();
					});
					return;
				});
			}

			function base64ToUint8Array(data) {
				console.log('base64', data.substr(0, 11));
			//	var BASE64_MARKER = ';base64,';
			//	var base64Index = data.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
			//	var base64 = data.substring(base64Index);
			//	var raw = atob(base64);
				var raw = atob(data);
				var rawLength = raw.length;
				console.log('rawLength', rawLength);
				var array = new Uint8Array(new ArrayBuffer(rawLength));
				for(var i = 0; i < rawLength; i++) {
					array[i] = raw.charCodeAt(i);
				}
				return array;
			}
			/*

			 Copyright (c) 2011, Daniel Guerrero

			 All rights reserved.



			 Redistribution and use in source and binary forms, with or without

			 modification, are permitted provided that the following conditions are met:

			 * Redistributions of source code must retain the above copyright

			 notice, this list of conditions and the following disclaimer.

			 * Redistributions in binary form must reproduce the above copyright

			 notice, this list of conditions and the following disclaimer in the

			 documentation and/or other materials provided with the distribution.



			 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND

			 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED

			 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE

			 DISCLAIMED. IN NO EVENT SHALL DANIEL GUERRERO BE LIABLE FOR ANY

			 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES

			 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;

			 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND

			 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT

			 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS

			 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

			 */



			/**

			 * Uses the new array typed in javascript to binary base64 encode/decode

			 * at the moment just decodes a binary base64 encoded

			 * into either an ArrayBuffer (decodeArrayBuffer)

			 * or into an Uint8Array (decode)

			 *

			 * References:

			 * https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer

			 * https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array

			 */



			var Base64Binary = {

				_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",



				/* will return a  Uint8Array type */

				decodeArrayBuffer: function(input) {

					var bytes = (input.length/4) * 3;

					var ab = new ArrayBuffer(bytes);

					this.decode(input, ab);



					return ab;

				},



				removePaddingChars: function(input){

					var lkey = this._keyStr.indexOf(input.charAt(input.length - 1));

					if(lkey == 64){

						return input.substring(0,input.length - 1);

					}

					return input;

				},



				decode: function (input, arrayBuffer) {

					//get last chars to see if are valid

					input = this.removePaddingChars(input);

					input = this.removePaddingChars(input);



					var bytes = parseInt((input.length / 4) * 3, 10);



					var uarray;

					var chr1, chr2, chr3;

					var enc1, enc2, enc3, enc4;

					var i = 0;

					var j = 0;



					if (arrayBuffer)

						uarray = new Uint8Array(arrayBuffer);

					else

						uarray = new Uint8Array(bytes);



					input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");



					for (i=0; i<bytes; i+=3) {

						//get the 3 octects in 4 ascii chars

						enc1 = this._keyStr.indexOf(input.charAt(j++));

						enc2 = this._keyStr.indexOf(input.charAt(j++));

						enc3 = this._keyStr.indexOf(input.charAt(j++));

						enc4 = this._keyStr.indexOf(input.charAt(j++));



						chr1 = (enc1 << 2) | (enc2 >> 4);

						chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);

						chr3 = ((enc3 & 3) << 6) | enc4;



						uarray[i] = chr1;

						if (enc3 != 64) uarray[i+1] = chr2;

						if (enc4 != 64) uarray[i+2] = chr3;

					}



					return uarray;

				}

			}		}

		function genmod() {
			console.log('..genmod');
			Zip.file('X3D').async('string').then(function(str){
				var x3d = JSON.parse(str);
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
								console.log('part', ipart, part);
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
									console.log('Textures', Textures);
									opt.map = Textures[part.Texture];
								}
								console.log(opt);
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
				if(fun)
					fun('Good cucumber');
				return;
			});
		}
	}

	//-----------------------------------------------------GenModel
	function GenModelx(com, fun) {
		console.log('--X3D/GenModel');
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
						console.log(opt);
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
			console.log('filename', filename);
			if (!('Textures' in x3d))
				return;
			console.log(x3d.Textures);
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
