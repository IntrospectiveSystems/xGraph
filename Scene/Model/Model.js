(function Model() {
	var async = require('async');
	var fs = require('fs');

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetGraph: GetGraph,
		GetModel: GetModel,
		Move: Move,
		Save: Save
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Model/Setup');
		this.Vlt.Graph = [];
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Model/Start');
		if(fun)
			fun();
	}

	//-----------------------------------------------------AddInstance
	function GetGraph(com, fun) {
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		Vlt.Scene = com.Scene;
		console.log('AddInstance>>>>>>>>>>>>>>>>>>>>', com.Scene, Vlt.Scene);
		var inst = {};
		inst.Model = Par.Model;
		if('Role' in Par)
			inst.Role = Par.Role;
		else
			inst.Role = 'Artifact';
		inst.Instance = Par.Pid;
		inst.Model = Par.Pid;
		inst.Position = Par.Position;
		inst.Axis = Par.Axis;
		inst.Angle = Par.Angle;
		inst.Inst = [];
		com.Graph[0].Inst.push(inst);

		if('Inst' in com) {
			com.Inst.push(inst);
		} else {
			com.Inst = [];
			com.Inst.push(inst);
		}
		fun(null, com);
/*		console.log(JSON.stringify(com));
		com.Graph[0].Inst.push(inst);
		if(!('Inst' in Par)) {
			fun();
			return;
		}
		var links = Par.Inst;
		var q = {};
		q.Cmd = 'AddInstance';
		q.Inst = inst.Inst;
		q.Scene = com.Scene;
		async.eachSeries(links, instance, fun);

		function instance(pid, func) {
			that.send(q, pid, func);
		} */
	}

	//-----------------------------------------------------GetModel
	function GetModel(com, fun) {
		console.log('..Instance/GetModel');
		var Par = this.Par;
		if(!'Name' in Par) {
			var err = 'No model provided';
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
			return;
		}
		var path = 'models/' + Par.Name;
		console.log('path', path);
		fs.readFile(path, function(err, data) {
			if(err) {
				console.log(' ** ERR:' + err);
				if(fun)
					fun(err);
				return;
			}
			com.Role = 'Artifact';
			com.Model = {};
			com.Model.Type = 'X3D';
			com.Model.X3D = data.toString();
			fun(null, com);
		});
	}

	//-----------------------------------------------------Move
	// Process move request (includes rotations)
	function Move(com, fun) {
		console.log('--Model/Move', com);
		var Par = this.Par;
		var Vlt = this.Vlt;
		if('Loc' in com) {
			Par.Position = com.Loc;
		}
		if('Spin' in com)
			Par.Angle += com.Spin;
		var q = {};
		q.Cmd = 'SetPosition';
		q.Instance = Par.Pid;
		q.Position = Par.Position;
		q.Axis = Par.Axis;
		q.Angle = Par.Angle;
		q.Publish = true;
		this.send(q, Vlt.Scene);
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------Save
	// Save module
	function Save(com, fun) {
		console.log('--Instance/Save', com);
		this.save(pau);

		function pau(err) {
			if(err) {
				console.log(' ** ERR:Save failed');
			}
			if(fun)
				fun(err, com);
		}
	}

})();
