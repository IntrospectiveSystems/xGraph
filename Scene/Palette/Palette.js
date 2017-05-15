(function scene() {
	var async = require('async');

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Palette/Setup');
		this.Vlt.Graph = [];
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Palette/Start');
		var that = this;
		var Par = this.Par;
		var Models = [];
		if('Initialized' in Par) {
			fun();
			return;
		}
		Par.Initialized = true;
		this.save();
		var path = 'stash';
		fs.readdir(path, function (err, files) {
			if (err) {
				console.log(' ** ERR:Project file err:' + err);
				fun(err);
				return;
			}
			async.eachSeries(files, scan, fini);

			function add(file, func) {
				Models.push(file);
				func();
			}

			function fini(err) {
				if(err) {
					fun(err);
					return;
				}
				that.save();
				fun();
			}
		});
	}

})();
