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
		var Vlt = this.Vlt;
		var geo = new THREE.CylinderGeometry(5, 5, 20, 32);
		var opt = {};
		opt.color = 0xFFFF00;
		var mat = new THREE.MeshBasicMaterial(opt);
		var obj3d = new THREE.Mesh(geo, mat);
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
