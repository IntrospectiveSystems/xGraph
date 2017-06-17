(function Globe() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetGraph: GetGraph,
		GetModel: GetModel
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------Setup
	function Setup(com, fun) {
		console.log('--Globe/Setup');
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		var degree = 4;
		if ('Degree' in Par)
			degree = Par.Degree;
		var r = 6371.0;
		if ('Radius' in Par)
			r = Par.Radius;
		var Facets = [];
		var facet;
		for (var i = 0; i < 4; i++) {
			facet = {};
			facet.A = [0.0, i*90.0];
			facet.B = [0.0, (i+1)*90.0];
			facet.C = [90.0, 0.0];
			Facets.push(facet);
		}
		for (var i = 0; i < 4; i++) {
			facet = {};
			facet.A = [-90.0, 0.];
			facet.B = [0.0, (i + 1)*90.0];
			facet.C = [0.0, i * 90.0];
			Facets.push(facet);
		}
		var nfacet = Facets.length;
		for (var i = 0; i < nfacet; i++)
			fractal(Facets[i], degree);
		var vrt = [];
		var nrm = [];
		var uv = [];
		var idx = [];
		var btex = false;
		if ('Texture' in Par)
			btex = true;
		for (var ifacet = 0; ifacet < nfacet; ifacet++) {
			facet = Facets[ifacet];
			drawFacet(facet);
		}
		generate();

		function interp(geo1, geo2) {
			var rlat;
			var rlon;
			rlat = Math.PI * geo1[0] / 180.0;
			rlon = Math.PI * geo1[1] / 180.0;
			var z1 =  Math.sin(rlat);
			var rxy = Math.cos(rlat);
			var x1 = rxy * Math.cos(rlon);
			var y1 = rxy * Math.sin(rlon);
			rlat = Math.PI * geo2[0] / 180.0;
			rlon = Math.PI * geo2[1] / 180.0;
			var z2 = Math.sin(rlat);
			var rxy = Math.cos(rlat);
			var x2 = rxy * Math.cos(rlon);
			var y2 = rxy * Math.sin(rlon);
			var x = (x1 + x2) / 2;
			var y = (y1 + y2) / 2;
			var z = (z1 + z2) / 2;
			var rl = Math.sqrt(x * x + y * y + z * z);
			x /= rl;
			y /= rl;
			z /= rl;
			var geo = [];
			geo.push(180.0 * Math.asin(z) / Math.PI);
			geo.push(180.0 * Math.atan2(y, x) / Math.PI);
			var lon = geo[1];
			if (geo[1] < 0.0)
				geo[1] += 360.0;
			return geo;
		}

		function fractal(facet, degree) {
			if (degree < 1)
				return;
			facet.Facet = [];
			var a = facet.A;
			var b = facet.B;
			var c = facet.C;
			var ab = interp(a, b);
			var bc = interp(b, c);
			var ca = interp(c, a);
			var fact;
			var fact = {};
			fact.A = a;
			fact.B = ab;
			fact.C = ca;
			facet.Facet.push(fact);
			fractal(fact, degree - 1);
			var fact = {};
			fact.A = b;
			fact.B = bc;
			fact.C = ab;
			facet.Facet.push(fact);
			fractal(fact, degree - 1);
			var fact = {};
			fact.A = c;
			fact.B = ca;
			fact.C = bc;
			facet.Facet.push(fact);
			fractal(fact, degree - 1);
			var fact = {};
			fact.A = ab;
			fact.B = bc;
			fact.C = ca;
			facet.Facet.push(fact);
			fractal(fact, degree - 1);
		}

		function vertex(latlon) {
			var lat = latlon[0];
			var lon = latlon[1];
			if (lon < 0.0 || lon > 360)
				console.log('A bad lon', lon);
			rlat = Math.PI * lat / 180.0;
			rlon = Math.PI * lon / 180.0;
			var z = r * Math.sin(rlat);
			var rxy = r * Math.cos(rlat);
			var x = rxy * Math.cos(rlon);
			var y = rxy * Math.sin(rlon);
			vrt.push(x);
			vrt.push(y);
			vrt.push(z);
			nrm.push(x / r);
			nrm.push(y / r);
			nrm.push(z / r);
			if (btex) {
				var v = (lat + 90.0) / 180.0;
				var u = lon / 360.0;
				uv.push(u);
				uv.push(1-v);
			}
		}

		function drawFacet(facet) {
			if ('Facet' in facet) {
				for (var ifac = 0; ifac < 4; ifac++)
					drawFacet(facet.Facet[ifac]);
				return;
			}
			// Leaf facet, draw it
			var ivrt = vrt.length / 3;
			vertex(facet.A);
			vertex(facet.B);
			vertex(facet.C);
			idx.push(ivrt, ivrt + 1, ivrt + 2);
		}

		function generate(tex) {
			var x3d = {};
			x3d.Name = 'Globe';
			x3d.Root = [];
			var node = {};
			node.Name = 'Earth';
			node.Hier = -1;
			node.Pivot = [0,0,0];
			var parts = [];
			var part = {};
			part.Diffuse = [255, 255, 255];
			part.Vrt = vrt;
			part.Nrm = nrm;
			part.Idx = idx;
			if (tex != null) {
				part.UV = uv;
				var name = Par.Texture;
				x3d.Textures = {};
				x3d.Textures[name] = tex;
				part.Texture = name;
			}
			parts.push(part);
			node.Parts = parts;
			x3d.Root.push(node);
			var jszip = require("jszip");
			var zip = new jszip();
			zip.file('Type', 'X3D');
			zip.file('X3D', JSON.stringify(x3d));
			console.log('Par', Par);
			if('Texture' in Par) {
				var text = Par.Texture;
				var path = Par.Texture;
				var dot = path.lastIndexOf('.');
				var suffix = path.substr(dot + 1);
				fs.readFile(path, function (err, data) {
					if (err) {
						oonsole.log(' ** Globe:' + err);
						if (fun)
							fun(err);
						return;
					}
					zip.file(text, data);
					zipit();
				});
			} else {
				console.log(' ** Globe:No texture provided');
				zipit();
			}

			function zipit() {
				zip.generateAsync({type:'base64'}).then(function(data) {
					Vlt.X3D = data;
					if(fun)
						fun();
				});
			}
		}

	}

	//-----------------------------------------------------Start
	function Start(com, fun) {
		console.log('--Globe/Start');
		if(fun)
			fun();
	}

	//-----------------------------------------------------AddInstance
	function GetGraph(com, fun) {
		console.log('--GLobe/GetGraph');
		var Vlt = this.Vlt;
		var Par = this.Par;
		Vlt.Scene = com.Scene;
		var inst = {};
		inst.Model = Par.Pid;
		inst.Role = 'Terrain';
		inst.Instance = Par.Pid;
		inst.Position = [0,0,0];
		inst.Axis = [0,0,1];
		inst.Angle = 0.0;
		com.Terrain = inst;
		fun(null, com);
	}

	//-----------------------------------------------------GetModel
	// Append model to scene graph
	function GetModel(com, fun) {
		console.log('--Globe/GetModel');
		var Vlt = this.Vlt;
		if(!('X3D' in Vlt)) {
			var err = 'Model not available';
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
			return;
		}
		com.Model = {};
		com.Model.Type = 'X3D';
		com.Model.X3D = Vlt.X3D;
		if(fun)
			fun(null, com);
	}

})();
