// #sourcsURL='Geometry'
(function Geometry() {

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
		console.log('--Geometry/Setup');
		this.Vlt.Graph = [];
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Geometry/Start');
		if(fun)
			fun();
	}

	//-----------------------------------------------------GenModel
	function GenModel(com, fun) {
		console.log('..Geometry/GenModel');
		var Par = this.Par;
		var h;
		switch(Par.Type) {
			case 'Cylinder':
				// [Top radius, bottom radius, height, segments]
				h = Par.Args[2];
				geo = new THREE.CylinderGeometry(...Par.Args);
				break;
			default:
				console.log(' ** ERR:Invalid object type' + Par.Type);
				if(fun)
					fun('Invalid object type');
				return;
		}
		var opt = {};
		if('Color' in Par)
			opt.color = Par.Color;
		var mat = new THREE.MeshLambertMaterial(opt);
		var obj3d = new THREE.Mesh(geo, mat);
		obj3d.rotateX(0.5*Math.PI);
		console.log('h', h);
		obj3d.position.z = h/2;
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
