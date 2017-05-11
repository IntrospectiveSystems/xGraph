// ModuleServer Apex
// Manages module entities and filtering capability
// Defers storage to FileManager

(function ModuleServer() {

	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetModule: GetModule,
		AddModule: AddModule,
		Query: Query
	};

	return {
		dispatch: dispatch
	};


	// Iterate through import folder and create modules
	function Setup(com, fun) {
		var that = this;

		that.Vlt.ModuleCache = {};


		// If cache not setup
		// iterate through modules folder
		// add module info to cache
		console.log('ModuleServer:Setup');
		console.log(this.Par.Modules);
		fun();

	}

	function Start(com, fun) {
		console.log('ModuleServer:Start');
		var that = this;
		var async = require('async');
		var JSZip = require('jszip');


		console.log(that.Vlt);

		fs.readdir(that.Par.Modules, function(err, files) {
			if (err) {
				console.log(' ** ERR:Project file err:' + err);
				return;
			}
			async.eachSeries(files, (file, func) => {
				readModule(that.Par.Modules + '/' + file, func);
			}, function(err) {
				console.log('Finished scanning module folder');
			});
		});

		// Read Module Folder and create zipped module
		function readModule(dir, callback) {
			var zip = new JSZip();
			var bTop = true;
			scanModule(dir, function() {
				console.log('Finished scanning module');
				fs.readdir(dir, (err, files) => {
					async.eachSeries(files, (file, func) => {
						zipModule(file, '', func);
					}, function() {
						console.log(zip);
						that.send({Cmd:'AddModule', Module:zip}, that.Par.FileManager, function(err, com) {
							console.log('Module Saved');
						})
					})
				});
			});


			// Scan Module directory for module.json
			function scanModule(dir, callback) {
				console.log('Scanning ', dir, ' for module.json');
				fs.readdir(dir, function (err, files) {
					if (err) {
						console.log(' ** ERR:Project file err:' + err);
						return;
					}
					async.eachSeries(files, (file, func) => {
						if (file === 'module.json') {
							console.log('Module file found');
							console.log(dir);
							fs.readFile(dir + '/' + file, (err, data) => {
								if (err) {
									console.log(' ** ERR:' + err);
									func(err);
									return;
								}
								let modData = JSON.parse(data);
								that.Vlt.ModuleCache[modData.name] = modData;
								//that.send({Cmd:'AddModule', Module: dir});
								func();
							});
						} else {
							func();
						}
					}, function(err) {
						console.log('Finished Scanning for module.json')
						callback();
					});
				});
			}

			function zipModule(fileName, sub, callback) {
				let path = dir + sub + '/' + fileName;
				console.log('ZipModule: ', path);
				console.log('Sub: ', sub);

				fs.lstat(path, (err, stats) => {
					if (err) {
						console.log(err);
						callback();
					}
					if (stats.isDirectory()) {
						console.log('isDirectory');
						sub += '/' + fileName;
						zip.folder(sub);

						fs.readdir(path, (err, files) => {
							async.eachSeries(files, (file, func) => {
								zipModule(file, sub, func);
							}, callback)
						});
					} else if (stats.isFile()) {
						fs.readFile(path, function(err, data) {
							if (err) {
								console.log(' ** ERR:' + err);
								callback();
								return;
							}
							console.log('writing', sub + '/' + fileName, data.length);
							zip.file(sub + '/' + fileName, data);
							callback();
						});
					}
				})
			}
		}

		fun();

	}

	// Get module from moduleCache, return full Module zip
	function GetModule(com, fun) {
		//
	}

	// Inspect module files for required pars, create module entity, add zipped module to module location
	function AddModule(com, fun) {
		// Create Module entity
		//

	}

	// Get module list based on filters, return pids and limited data describing modules
	function Query(com, fun) {
		// Check Filter
		// Send Command to modules based on filter
		if ('Filter' in com) {
			// Async through moduleCache and check filter properties
		}
	}

})();
