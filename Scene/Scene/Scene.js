(function scene() {
	var async = require('async');

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetGraph: GetGraph
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
		if(true) {
			fun();
			return;
		}
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		var links = Par.Link;
		var graph = [];
		async.eachSeries(links, graph, pau);

		function graph(link, func) {
			var q = {};
			q.Cmd = 'GetGraph';
			that.send(q, link, reply);

			function reply(err, q) {
				if(err) {
					func(err);
					return;
				}
				if('Graph' in q)
					graph.push(q.Graph);
				func();
			}
		}

		function pau(err) {
			if(err) {
				if(fun)
					fun(err);
				return;
			}
			var inst = {};
			if('Loc' in Par)
				inst.Loc = Par.Loc;
			else
				inst.Loc = [0,0,0];
			if('Axis' in Par)
				inst.Axis = Par.Axis;
			else
				inst.Axis = [0, 0, 1];
			if('Ang' in Par)
				inst.Ang = Par.Ang;
			else
				inst.Ang = 0.0;
			if(graph.length > 0)
				inst.Link = graph;
			if(fun)
				fun(null, com);
			Vlt.Graph = graph;
		}
		if(fun)
			fun();
	}

	//-----------------------------------------------------GetGraph
	function GetGraph(com, fun) {
		console.log('--Scene/GetGraph')
		com.Graph = this.Vlt.Graph;
		if(fun)
			fun(null, com);
	}

})();
