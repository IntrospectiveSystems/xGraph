(function scene() {
	var async = require('async');

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetGraph: GetGraph,
		Subscribe: Subscribe,
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
		q.Scebe - Par.Pid;
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

	//-----------------------------------------------------Subscribe
	// Move/rotate object in scene
	function Subscribe(com, fun) {
		console.log('--Subscribe', com);
		var Vlt = this.Vlt;
		if('ClientList' in Vlt) {
			Vlt.ClientList.push(com.Pid);
		} else {
			Vlt.ClientList = [];
			Vlt.ClientList.push(com.Pid);
		}
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------Relay
	// Pass on to instances
	function Relay(com, fun) {
		console.log('--Relay', com.Cmd);
		var that = this;
		if(com.Publish) {
			publish();
			return;
		}
		var pass = com.Passport;
		this.send(com, com.Instance, reply);

		//.................................................reply
		function reply(err, q) {
			if(err)
				fun(err);
			q.Passport = pass;
			fun(null, q);
		}

		//.................................................publish
		function publish() {
			var Vlt = that.Vlt;
			var that = this;
			if('ClientList' in Vlt) {
				async.eachSeries(Vlt.ClientList, pub, pau);
			} else {
				if(fun)
					fun();
			}

			function pub(pid, func) {
				that.send(com, pid, func);
			}

			function pau(err) {
				if(fun)
					fun(err);
			}
		}
	}

})();
