(function Instance() {
	var async = require('async');

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		AddInstance: AddInstance,
		GetModel: GetModel,
		Move: Move,
		Save: Save
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Instance/Setup');
		this.Vlt.Graph = [];
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Instance/Start');
		if(fun)
			fun();
	}

	//-----------------------------------------------------AddInstance
	function AddInstance(com, fun) {
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		Vlt.Scene = com.Scene;
		var links = Par.Inst;
		var inst = {};
		inst.Model = Par.Model;
		if('Role' in Par)
			inst.Role = Par.Role;
		else
			inst.Role = 'Fixed';
		inst.Instance = Par.Pid;
		inst.Position = Par.Position;
		inst.Axis = Par.Axis;
		inst.Angle = Par.Angle;
		inst.Inst = [];
		com.Inst.push(inst);
		var q = {};
		q.Cmd = 'AddInstance';
		q.Inst = inst.Inst;
		async.eachSeries(links, instance, fun);

		function instance(pid, func) {
			that.send(q, pid, func);
		}
	}

	//-----------------------------------------------------GetModel
	function GetModel(com, fun) {
		console.log('..Instance/GetModel');
		var Par = this.Par;
		if(!'Model' in Par) {
			var err = 'No model provided';
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
			return;
		}
		var q = {};
		for(key in com)
			q[key] = com[key];
		if('Name' in Par)
			q.Name = Par.Name;
		this.send(q, Par.Model, reply);

		function reply(err, r) {
			console.log('..Instance/reply');
			if(err) {
				if(fun)
					fun(err);
				return;
			}
			console.log('r', typeof r);
			console.log('A');
			com.Model = r.Model;
			console.log('B');
			fun(null, com);
		}

	}

	//-----------------------------------------------------Move
	// Process move request (includes rotations)
	function Move(com, fun) {
		console.log('--Instance/Move', com);
		console.log(JSON.stringify(com, null, 2));
		var Par = this.Par;
		if('Loc' in com) {
			Par.Position = com.Loc;
		}
		if('Spin' in com)
			Par.Angle += com.Spin;
		var q = {};
		q.Cmd = 'Move';
		q.Position = Par.Position;
		q.Axis = Par.Axis;
		q.Angle = Par.Angle;
		q.Publish = true;
		this.send(q, Par.Scene);
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------Save
	// Save module
	function Save(com, fun) {
		console.log('--Instance/Save', com);
		if(fun)
			fun(null, com);
	}

})();
