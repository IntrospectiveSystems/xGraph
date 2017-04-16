(function scene() {
	var async = require('async');

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		AddInstance: AddInstance
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
		var links = Par.Inst;
		var inst = {};
		inst.Model = Par.Model;
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

})();
