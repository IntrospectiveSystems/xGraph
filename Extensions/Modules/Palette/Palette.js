(function Palette() {
	var async, fs, Path;

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
		async = this.require('async');
		fs = this.require('fs');
		Path = this.require("path");
		
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
		path = Path.resolve(path);
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
			nmodels = Models.length;
			if(nmodels < 1) {
				console.log('Yes we have no bananas, yes we have no bananas today!');
				if(fun)
					fun();
				return;
			}
			var ncol = Math.floor(Math.sqrt(nmodels));
			if(ncol*ncol != nmodels) {
				ncol++;
			}
			var nrow = ncol-1;
			if(nrow*ncol < nmodels)
				nrow++;
			var space = 5;
			if('Spacing' in Par)
				space = Par.Spacing;
			var x0 = -0.5*(ncol-1)*space;
			var y0 =  0.5*(nrow-1)*space;
			console.log('x0,y0,space', x0, y0, nrow, ncol, space);
			var imodel = 0;
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
					var irow = Math.floor(imodel/ncol);
					var icol = imodel - irow*ncol;
					var x = x0 + space*icol;
					var y = y0 - space*irow;
					var q = {};
					console.log('>>>>>>>>>', x0, y0, x, y, icol, irow, space);
					imodel++;
					var idot = model.lastIndexOf('.');
					var name = model.substr(0, idot);
					var suffix = model.substr(idot);
					console.log('name, suffix', name, suffix);
					q.Cmd = 'AddModel';
					q.Name = name;
					q.Position = [x, y, 0];
					q.Model = data.toString('base64');
					that.send(q, Par.Scene, func);
				});
			}
		}
	}

})();
