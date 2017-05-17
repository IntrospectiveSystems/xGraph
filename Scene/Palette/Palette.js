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
			console.log('files', files);
			async.eachSeries(files, add, function(err) {
				if(err) {
					fun(err);
					return;
				}
				that.save();
				populate();
			});

			function add(file, func) {
				Models.push(file);
				func();
			}
		});

		function populate() {
			console.log(JSON.stringify(Models, null, 2));
			async.eachSeries(Models, ship, function(err) {
				if(err) {
					console.log(' ** ERR:' + err);
					fun(err);
					return;
				}
			});

			function ship(model, func) {
				var path = './stash/' + model;
				fs.readFile(path, function(err, data){
					if(err) {
						console.log(' ** ERR:' + err);
						func(err);
						return;
					}
					var q = {};
					var idot = model.lastIndexOf('.');
					var name = model.substr(0, idot);
					var suffix = model.substr(idot);
					console.log('name, suffix', name, suffix);
					q.Cmd = 'AddModel';
					q.Name = name;
					q.Loc = [0,0];
					q.Model = data.toString('base64');
					that.send(q, Par.Scene, func);
				});

			}
		}
	}

})();
