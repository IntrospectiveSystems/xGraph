(function scene() {
	var async = require('async');

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetGraph: GetGraph,
		SetPosition: SetPosition,
		'*': Relay
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
		q.Cmd = 'AddInstance';
		q.Scene = Par.Pid;
		q.Inst = inst;
		async.eachSeries(links, instance, pau);

		function instance(pid, func) {
			that.send(q, pid, func);
		}

		function pau(err) {
			if(err) {
				if(fun)
					fun(err);
				return;
			}
		//	console.log('Graph', JSON.stringify(inst, null, 2));
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

	//-----------------------------------------------------GetModel
	// Retrieeve mode from instance module
	function GetModel(com, fun) {
		console.log('--Scene/GetModel');
		var that = this;
		var q = {};
		q.Cmd = 'GetModel';
		this.send(q, com.Instance, reply);

		function reply(err, q) {
			if('Model' in q) {
				com.Model = q.Model;
				fun(null, com);
			} else {
				fun('Model not available', com);
			}
		}
	}

	//-----------------------------------------------------SetPostion
	// Update scene graph from commands sent from models
	// to make sure that people that log in later get a
	// correct scene graph.
	function SetPosition(com, fun) {
		console.log('--SetPositoin');
		var Vlt = this.Vlt;
		var that = this;
		var graph = Vlt.Graph;
		trv(graph);

		function trv(inst) {
			for(let i=0; i<inst.length; i++) {
				var obj = inst[i];
				console.log('obj', obj.Instance, com.Instance);
				if(obj.Instance == com.Instance) {
					console.log('..found');
					if('Position' in com)
						obj.Position = com.Position;
					if('Axis' in com)
						obj.Axis = com.Axis;
					if('Angle' in com)
						obj.Angle = com.Angle;
					Relay.call(that, com, fun);
					return;
				}
				if('Inst' in obj)
					trv(obj.Inst);
			}
			console.log(' ** ERR:No tickee, no laundry');
			if(fun)
				fun();
		}
	}

	//-----------------------------------------------------Relay
	// Pass on to instances
	function Relay(com, fun) {
		console.log('--Relay', com.Cmd);
		var that = this;
		var Par = this.Par;
		if('Publish' in com) {
		//	console.log('Par.View', Par.View);
			that.send(com, Par.View);
			if(fun)
				fun(null, com);
			return;
		}
//		console.log('--Scene/Relay\n', JSON.stringify(com, null, 2));
		var pass = com.Passport;
		this.send(com, com.Instance, reply);

		//.................................................reply
		function reply(err, q) {
			if(err)
				fun(err);
			q.Passport = pass;
			fun(null, q);
		}
	}

})();
