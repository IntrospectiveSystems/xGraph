(function CvtLwo() {
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
		console.log('--CvtLwo/Setup');
		this.Vlt.Graph = [];
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--CvtLwo/Start');
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
		console.log('..CvtLwo/Parse', path);
		var Math3D = require('math3d');
		var earcut = require('earcut');
		var fs = require('fs');
		fs.readFile(path, function(err, buf) {
			if(err) {
				console.log(' ** ERR:' + err);
				if(fun)
					fun(err);
				return;
			}
			console.log('buf.length', buf.length);
			for(var i=0; i<20; i++)
				console.log(i, buf[i], buf.toString('ascii', i, i+1));
			var ix = 0;
			var id = buf.toString('ascii', ix, ix+4);
			console.log('id', id);
			var len = buf.readInt32BE(ix+4);
			console.log('len', len);
			var str = buf.toString('ascii', ix+8, ix+12);
			console.log('str', str);

		});

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
					if ('Textures' in x3d) {
						x3d.Textures[mat.Text] = {};
					} else {
						x3d.Textures = {};
						x3d.Textures[mat.Text] = {};
					}
				}
				node.Parts.push(part);
			}
			root.push(node);
			x3d.Root = root;
			wrap(null, x3d);
		}
	}
})();
