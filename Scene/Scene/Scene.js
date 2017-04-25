(function scene() {
	var async = require('async');

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetGraph: GetGraph,
		Move: Move,
		Save: Save
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Scene/Setup');
		this.Vlt.Graph = [];
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Scene/Start');
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		var links = Par.Inst;
		var omst = {};
		var q = {};
		var inst = [];
		console.log('links', links);
		q.Cmd = 'AddInstance';
		q.Inst = inst;
		async.eachSeries(links, instance, pau);

		function instance(pid, func) {
			console.log('..instance', pid);
			that.send(q, pid, func);
		}

		function pau(err) {
			if(err) {
				if(fun)
					fun(err);
				return;
			}
			console.log('Graph', JSON.stringify(inst, null, 2));
			Vlt.Graph = inst;
			if(fun)
				fun(null, com);
		}
	}

	//-----------------------------------------------------GetGraph
	function GetGraph(com, fun) {
		console.log('--Scene/GetGraph')
		com.Graph = this.Vlt.Graph;
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------Move
	// Move/rotate object in scene
	function Move(com, fun) {
		console.log('--Move', com);
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------Save
	// Freeze position of instance
	function Save(com, fun) {
		console.log('--Save', com);
		if(fun)
			fun(null, com);
	}

})();
