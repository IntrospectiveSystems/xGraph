(function Cvt3DS() {
	var Par;

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		Convert: Convert
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Cvt3DS/Setup');
		this.Vlt.Graph = [];
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Cvt3DS/Start');
		if(fun)
			fun();
	}

	//---------------------------------------------------------Convert
	// Convert obj model into x3d format
	function Convert(com, fun) {
		Par = this.Par;
		var path = com.Path;
		Parse(path, done);

		function done(err, x3d) {
			if (x3d == null) {
				console.log(' ** ERR:Parse failed');
				if (fun)
					fun('Parse failed');
				return;
			}
			x3d.Name = com.Name;
			com.X3D = x3d;
		//	console.log('x3d', JSON.stringify(x3d, null, 2));
			console.log(' ** CvtObj processing completed');
			if (fun)
				fun(null, com);
		}
	}

	//-----------------------------------------------------Parse
	// Set output file
	function Parse(path, done) {
		console.log('..CvtObj/Parse', path);
		var Math3D = require('math3d');
		var earcut = require('earcut');
		var fs = require('fs');
		var V = [];
		var Vt = [];
		var Vn = [];
		var MtlLib;
		var Mat;
		var Mats = {};
		var obj = {};
		obj.Vrt = [];
		obj.Nrm = [];
		obj.UV = [];
		obj.Idx = [];
		obj.Diff = [];
		obj.Ambi = [];
		obj.Spec = [];
		Mats.Default = obj;
		var Vrt = obj.Vrt;
		var Nrm = obj.Nrm;
		var UV = obj.UV;
		var Idx = obj.Idx;
		var Diff = obj.Diff;
		var Spec = obj.Spec;
		var Ambi = obj.Ambi;
		var Text;
		var last = path.lastIndexOf('/');
		var Dir = path.substr(0, last + 1);
		scan(path, geometry, mat);

		function mat(err) {
			if (err) {
				done(err);
				return;
			}
			if (MtlLib == null) {
				genx3d(done);
				return;
			}
			var last = path.lastIndexOf('/');
			var mtl = path.substr(0, last + 1) + MtlLib;
			console.log('mtl path is', mtl);
			scan(mtl, material, pau);
		}

		function pau(err) {
			if (err) {
				done(err);
				return;
			}
			console.log('Vrt.length', Vrt.length);
			genx3d(done);
		}

		//.................................................scan
		// Scan file and feed each line as array to proc
		function scan(path, proc, callback) {
			fs.readFile(path, done);

			function done(err, data) {
				if (err) {
					console.log(' ** ERR:' + err);
					if (fun)
						fun(err);
					return;
				}
				var state = 0;
				var c;
				var str;
				var i1 = 0;
				var i2 = 0;
				var buf;
				var res;
				for (var i = 0; i < data.length; i++) {
					c = data[i];
					switch (state) {
					case 0:	// Looking for beginning of line
						if (c == 10 || c == 13)
							continue;
						i1 = i;
						state = 1;
						break;
					case 1: // Looking for end of line
						if (c == 10 || c == 13) {
							state = 0;
							i2 = i;
							buf = Buffer.alloc(i2 - i1);
							var n = data.copy(buf, 0, i1, i2);
							str = buf.toString();
						//	console.log(str);
							var fld = fields(str);
							if (fld.length < 2)
								continue;
							res = proc(fld);
							if (res != null) {
								console.log(' ** ERR:' + err);
								callback(res);
								return;
							}
						}
					}
				}
				callback();
			}

			function fields(str) {
				var c;
				var fld = [];
				var state = 0;
				var field = '';
				for(var i=0; i<str.length; i++) {
					c = str.charAt(i);
					switch(state) {
					case 0: // Looking for non white
						if (c == ' ' || c == ',' || c == '\t')
							continue;
						state = 1;
						field = c;
						break;
					case 1: // looking for end of field
						if (c == ' ' || c == ',' || c == '\t') {
							fld.push(field);
							field = '';
							state = 0;
						} else {
							field += c;
						}
						break;
					}
				}
				if(field.length > 0)
					fld.push(field);
				return fld;
			}

		}

		function geometry(fld) {
		//	console.log(fld);
			switch (fld[0]) {
			case 'v':
				V.push(parseFloat(fld[1]));
				V.push(parseFloat(fld[2]));
				V.push(parseFloat(fld[3]));
				break;
			case 'vt':
				Vt.push(parseFloat(fld[1]));
				Vt.push(parseFloat(fld[2]));
				break;
			case 'vn':
				Vn.push(parseFloat(fld[1]));
				Vn.push(parseFloat(fld[2]));
				Vn.push(parseFloat(fld[3]));
				break;
			case 'f':
				vertex(fld);
				break;
			case 'mtllib':
				MtlLib = fld[1];
				break;
			case 'usemtl':
				var name = fld[1];
				var mat;
				if (name in Mats) {
					mat = Mats[name];
				} else {
					mat = {};
					mat.Vrt = [];
					mat.Nrm = [];
					mat.UV = [];
					mat.Idx = [];
					mat.Diff = [];
					mat.Ambi = [];
					mat.Spec = [];
					Mats[name] = mat;
				}
				Vrt = mat.Vrt;
				Nrm = mat.Nrm;
				UV = mat.UV;
				Idx = mat.Idx;
				break;
			case 's':
				break;
			default:
				break;
			}

			function vertex(fld) {
				var nvrt = Vrt.length / 3;
				var ivrt;
				var iuv;
				var inrm;
				var uv0;
				var uv1;
				var nfld = fld.length;
				var xyz = [];
				for (var ifld = 1; ifld < nfld; ifld++) {
					var vrt = fld[ifld].split('/');
					ivrt = parseInt(vrt[0]) - 1;
					Vrt.push(V[3 * ivrt], V[3 * ivrt + 1], V[3 * ivrt + 2]);
					xyz.push(V[3 * ivrt], V[3 * ivrt + 1], V[3 * ivrt + 2]);
					if (vrt.length > 1) {
						if (vrt[1].length > 0) {
							iuv = parseInt(vrt[1]) - 1;
							uv0 = Vt[2 * iuv];
							if (uv0 < 0.0)
								uv0 += 1.0;
							uv1 = Vt[2 * iuv + 1];
							if (uv1 < 0.0)
								uv1 += 1.0;
							UV.push(uv0, uv1);
							if (vrt.length > 2) {
								inrm = parseInt(vrt[2]) - 1;
								Nrm.push(Vn[3 * inrm], Vn[3 * inrm + 1], Vn[3 * inrm + 2]);
							}
						}
					}
				}
				var idx = tesselate(xyz);
			//	console.log('idx', idx);
				for (var i = 0; i < idx.length; i++)
					Idx.push(nvrt + idx[i]);
			}

			//.............................................tesselate
			// Calculate face vertices for the tesselation
			// of a planar polygon in 3D. Input is a sequence
			// of x, y, z triples, and the output is an
			// array of face index triples for each triange.
			// Polygon orientation in 3D space is arbitary
			function tesselate(xyz) {
				var v1 = new Math3D.Vector3(xyz[3] - xyz[0], xyz[4] - xyz[1], xyz[5] - xyz[2]);
				var v2 = new Math3D.Vector3(xyz[6] - xyz[0], xyz[7] - xyz[1], xyz[8] - xyz[2]);
				var v3 = v1.cross(v2);
				//	console.log('Normal', v3.x, v3.y, v3.z);
				var ang;
				var vax;
				if (v3.z > 0.9999) {
					ang = 0.0;
					vax = new Math3D.Vector3(1, 0, 0);
				} else {
					if (v3.z < -0.9999) {
						ang = Math.PI;
						vax = new Math3D.Vector3(1, 0, 0);
					} else {
						ang = Math.acos(v3.z);
						vup = new Math3D.Vector3(0.0, 0.0, 1.0);
						vax = v3.cross(vup); // forward is z in real coordinates
					}
				}
				var deg = 180.0 * ang / Math.PI;
			//	console.log('ang', deg, 'vax', vax.x, vax.y, vax.z);
				var q = Math3D.Quaternion.AngleAxis(vax, deg);
				var vxyz;
				var xy = [];
				for (var i = 0; i < xyz.length; i += 3) {
					vxyz = q.mulVector3(new Math3D.Vector3(xyz[i], xyz[i + 1], xyz[i + 2]));
				//	console.log('vxyz', vxyz.x, vxyz.y, vxyz.z);
					xy.push(vxyz.x, vxyz.y);
				}
				var idx = earcut(xy, null, 2);
				//	console.log('idx', idx);
				return idx;
			}
		}

		function material(fld) {
			console.log(fld);
			if (fld[0] == 'newmtl') {
				var name = fld[1];
				if (name in Mats) {
					Mat = Mats[name];
					return;
				} else {
					console.log(' ** ERR:Unknown material <' + name + '>');
					Mat = null;
				}
			}
			switch (fld[0]) {
			case 'Ka':
				if (Mat == null)
					return;
				Mat.Ambi.push(parseFloat(Math.round(255 * fld[1])));
				Mat.Ambi.push(parseFloat(Math.round(255 * fld[2])));
				Mat.Ambi.push(parseFloat(Math.round(255 * fld[3])));
				console.log(' ++ Ambi', Mat.Ambi);
				break;
			case 'Kd':
				if (Mat == null)
					return;
				Mat.Diff.push(parseFloat(Math.round(255 * fld[1])));
				Mat.Diff.push(parseFloat(Math.round(255 * fld[2])));
				Mat.Diff.push(parseFloat(Math.round(255 * fld[3])));
				console.log(' ++ Diff', Mat.Diff);
				break;
			case 'Ks':
				if (Mat == null)
					return;
				Mat.Spec.push(parseFloat(Math.round(255 * fld[1])));
				Mat.Spec.push(parseFloat(Math.round(255 * fld[2])));
				Mat.Spec.push(parseFloat(Math.round(255 * fld[3])));
				console.log(' ++ Spec', Mat.Spec);
				break;
			case 'map_Kd':
				if (Mat == null)
					return;
				Mat.Text = fld[1];
				break;
			}
		}

		function genx3d(wrap) {
			console.log('..genx3d');
			for (key in Mats) {
				console.log('Material', key);
				var mat = Mats[key];
				for (att in mat) {
				switch (att) {
					case 'Vrt':
					case 'Nrm':
					case 'UV':
					case 'Idx':
						console.log(att + ':' + mat[att].length);
						break;
					default:
						console.log(att + ':' + mat[att]);
						break;
					}
				}
			}
			var x3d = {};
			var root = [];
			var node = {};
			node.Name = "Nada";
			node.Pivot = [0, 0, 0];
			node.Parts = [];
			for (name in Mats) {
				var mat = Mats[name];
				if (mat.Idx.length < 3)
					continue;
				var part = {};
				part.Vrt = mat.Vrt;
				if (mat.Nrm.length > 0)
					part.Nrm = mat.Nrm;
				if (mat.UV.length > 0)
					part.UV = mat.UV;
				part.Idx = mat.Idx;
				if (mat.Diff.length > 0)
					part.Diffuse = mat.Diff;
				if (mat.Ambi.length > 0)
					part.Ambient = mat.Ambi;
				if (mat.Spec.length > 0)
					part.Specular = mat.Spec;
				if ('Text' in mat) {
					part.Texture = mat.Text;
					if(!('Textures' in x3d))
						x3d.Textures = [];
					if(x3d.Textures.indexOf(mat.Text) < 0)
						x3d.Textures.push(mat.Text);
				/*	if ('Textures' in x3d) {
						x3d.Textures[mat.Text] = {};
					} else {
						x3d.Textures = {};
						x3d.Textures[mat.Text] = {};
					} */
				}
				node.Parts.push(part);
			}
			root.push(node);
			x3d.Root = root;
			wrap(null, x3d);
		}
	}
})();
