// #sourcsURL='Board'
(function Board() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GenModel: GenModel,
		Evoke: Evoke
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Board/Setup');
		this.Vlt.Graph = [];
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Board/Start');
		if(fun)
			fun();
	}

	//-----------------------------------------------------GenModel
	function GenModel(com, fun) {
		console.log('..Board/GenModel');
		var Par = this.Par;
		var Vlt = this.Vlt;
		var geo = new THREE.PlaneGeometry(60, 40, 1, 1);
		var opt = {};
		opt.color = 0x00FFFF;
		var mat = new THREE.MeshLambertMaterial(opt);
		var obj3d = new THREE.Mesh(geo, mat);
		var mat = new THREE.LineBasicMaterial({
			color: 0x0000ff
		});

		var opt = {};
		opt.color = 0xFF0000;
		var mat = new THREE.LineBasicMaterial(opt);
		var geo = new THREE.Geometry();
		var nx = Par.Grid[0];
		var ny = Par.Grid[1];
		var grid = Par.Grid[2];
		var x1 = -0.5*nx*grid;
		var x2 = -x1;
		var y1 = -0.5*ny*grid;
		var y2 = -y1;
		var x;
		var y;
		var z = 0.01;
		for(var i=0; i<=ny; i++) {
			y = y1 + i*grid;
			geo.vertices.push(new THREE.Vector3(x1, y, z));
			geo.vertices.push(new THREE.Vector3(x2, y, z));
		}
		for(var i=0; i<=nx; i++) {
			x = x1 + i*grid;
			geo.vertices.push(new THREE.Vector3(x, y1, z));
			geo.vertices.push(new THREE.Vector3(x, y2, z));
		}
		var line = new THREE.LineSegments(geo, mat);
		obj3d.add(line);
		com.Obj3D = obj3d;
		if(fun) {
			fun(null, com);
		}
	}

	//-----------------------------------------------------Evoke
	function Evoke(com, fun) {
		if(fun)
			fun(null, com);
	}

})();
