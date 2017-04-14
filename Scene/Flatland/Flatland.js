(function FlatLand() {

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
		console.log('--Flatland/Setup');
		if(fun)
			fun();
	}

	//-----------------------------------------------------GetModel
	function Start(com, fun) {
		console.log('--Flatland/Start');
		if(fun)
			fun();
	}

	//-----------------------------------------------------GetGraph
	// Append model to scene graph
	function GetGraph(com, fun) {

	}

	//-----------------------------------------------------GetModel
	// Generate X3D represenation of Terrain
	function GetModel(com, fun) {
		var that = this;
		var Par = this.Par;
		var Ent = this.Ent;
		var w = 100;
		var h = 100;
		if ('Size' in Par) {
			var size = Par.Size;
			w = size[0];
			h = size[1];
		}
		if ('Texture' in Par)
			textures(build);
		else
			build();

		function build(tex) {
			var w2 = w / 2;
			var h2 = h / 2;
			var x3d = {};
			x3d.Name = 'Flatland';
			x3d.Root = [];
			var node = {};
			node.Name = 'NA';
			node.Hier = -1;
			node.Pivot = [0, 0, 0];
			var parts = [];
			var part = {};
			part.Diffuse = [255, 255, 255];
			var vrt = [];
			vrt.push(-w2, -h2, 0);
			vrt.push(w2, -h2, 0);
			vrt.push(w2, h2, 0);
			vrt.push(-w2, h2, 0);
			part.Vrt = vrt;
			if (tex != null) {
				var uv = [];
				var u = tex.Width / tex.Size;
				var v = tex.Height / tex.Size;
				uv.push(0, 0);
				uv.push(u, 0);
				uv.push(u, v);
				uv.push(0, v);
				part.UV = uv;
				part.Texture = 'FlatLand';
				x3d.Textures = {};
				x3d.Textures.FlatLand = tex;
			}
			var idx = [];
			idx.push(0, 1, 2);
			idx.push(0, 2, 3);
			part.Idx = idx;
			parts.push(part);
			node.Parts = parts;
			x3d.Root.push(node);
			var model = {};
			model.Type = 'X3D';
			model.X3D = x3d;
			com.Model = model;
			fun();
		}

		function textures(func) {
			var q = {};
			q.Cmd = 'GetTexture';
			var pidtxt = Par.Texture;
			that.send(q, pidtxt, pau);

			function pau(err, q) {
				if ('Texture' in q) {
					var txt = q.Texture;
					func(txt);
					return;
				}
				console.log(' ** ERR:No texture returned');
				func();
			}
		}
	}

})();
