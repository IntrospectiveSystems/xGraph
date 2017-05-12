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

	function Setup(com, fun) {
		console.log('ModuleServer:Setup');
		var that = this;
		if ('ModuleCache' in that.Par) {
			fun();
		} else {
			that.Par.ModuleCache = {};
			fun();
		}
	}

	function Start(com, fun) {
		console.log('ModuleServer:Start');
		var that = this;
		if (that.Par.bInitialized) {
			if (that.Par.bTest) {
				that.send({Cmd:'StartTests', ModuleServer:that.Par.Pid}, that.Par.Test, (err, com) => {
					console.log('Tests Finished');
				})
			}
			fun();
			return;
		}
		var async = require('async');
		var JSZip = require('jszip');


		// Read Module import directory
		fs.readdir(Nxs.genPath(that.Par.Modules), function(err, files) {
			if (err) {
				console.log(' ** ERR:Project file err:' + err);
				return;
			}
			// Iterate through modules in module import directory and read each
			async.eachSeries(files, (file, func) => {
				readModule(Nxs.genPath(that.Par.Modules + '/' + file), func);
			}, function(err) {
				console.log('Finished scanning module folder');
				that.Par.bInitialized = true;
				that.save();
				console.log(that.Par.bTest);
				if (that.Par.bTest) {
					that.send({Cmd:'StartTests', ModuleServer:that.Par.Pid}, that.Par.Test, (err, com) => {
						console.log('Tests Finished');
					})
				}
			});
		});

		// Read Module Folder and create zipped module
		function readModule(dir, callback) {
			var zip = new JSZip();
			var ModuleInfo = {};
			scanModule(dir, function() {
				console.log('Finished scanning module');
				fs.readdir(dir, (err, files) => {
					async.eachSeries(files, (file, func) => {
						zipModule(file, '', func);
					}, function() {
						//console.log(zip);
						that.send({Cmd:'AddModule', Module:zip, ModuleStorage:that.Par.ModuleStorage, Name: ModuleInfo.name}, that.Par.FileManager, function(err, com) {
							console.log('Module Saved');
							callback();
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
								ModuleInfo = modData;
								console.log(ModuleInfo);
								that.Par.ModuleCache[modData.name] = modData;
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

				fs.lstat(path, (err, stats) => {
					if (err) {
						console.log(err);
						callback();
					}
					if (stats.isDirectory()) {
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
	// Requires:
	//	com.Name,
	// Returns zipped module in base64 in com.Module
	function GetModule(com, fun) {
		var async = require('async');
		// Check if Module is in registry
		var that = this;
		if ('Name' in com) {
			console.log(that.Par.ModuleCache);
			// Async through moduleCache and check filter properties
			async.forEach(Object.keys(that.Par.ModuleCache), (module, func) => {
				let ModuleInfo = that.Par.ModuleCache[module];

				if (ModuleInfo) {
					if (com.Name === ModuleInfo) {
						com.Module = ModuleInfo;
					}
				}
			}, (err) => {
				console.log('Finished');
				if (com.Module) {
					that.send(com, that.Par.FileManager, (err, com) => {
						if (fun) {
							fun(null, com);
						}
					})
				}
			})
		}
		com.ModuleStorage = that.Par.ModuleStorage;
		that.send(com, that.Par.FileManager, function(err, com) {
			if (fun) {
				fun(null, com);
			}
		})
	}

	// Inspect module files for required pars, create module entity, add zipped module to module location
	// Requires:
	// 	com.Module as zipped module file:
	//	com.Name as named in module.json
	function AddModule(com, fun) {
		// TODO: Send to ModuleData to check compatibility
		// ModuleData should return module.json obj
		var that = this;
		if ('Module' in com) {
			that.send(com, that.Par.ModuleData, function(err, com) {
				if (err) {
					console.log(err);
					fun(err, com);
					return;
				}
				com.ModuleStorage = that.Par.ModuleStorage;
				that.send(com, that.Par.FileManager, function(err, com) {
					if (err) {
						console.log(err);
						fun(err, com);
						return;
					}

					if (fun) fun(null, com);
				});
				if (fun) fun(null, com);
			})
		} else {
			if(fun) fun('ERR:ModuleServer: Missing com.Module(zipped module)', com);
		}

	}

	// Get module list based on filters, return module info
	function Query(com, fun) {
		console.log('ModuleServer:Query');
		var that = this;
		var async = require('async');
		com.Info = [];
		if ('Filters' in com) {

			// Async through moduleCache and check filter properties
			async.forEach(Object.keys(that.Par.ModuleCache), (module, func) => {
				CheckFilters(that.Par.ModuleCache[module], com.Filters, (err, bMatch) => {
					if(bMatch) {
						com.Info.push(that.Par.ModuleCache[module]);
					}
					func();
				});
				}, (err) => {
				console.log('Finished');
				if (fun) {
					fun(null, com);
				}
			})
		}

		function CheckFilters(Mod, Filters, callback) {
			let bMatch = true;
			console.log('CheckFilters');
			// Iterate through filters
			// Check against each property in module
			async.forEach(Object.keys(Filters), (Filter, func) => {
				if(!bMatch) {
					func();
				}
				let Match = [];
				switch(Filter) {
					// TODO: Add cases for info and par
					case 'input':
					case 'output':
						if (Mod[Filter].required.length > 0) {
							for (let key in Mod[Filter].required) {
								Match = Match.concat(Mod[Filter].required[key].cmd);
							}
						}
						if (Mod[Filter].opts.length > 0) {
							for (let key in Mod[Filter].opts) {
								Match = Match.concat(Mod[Filter].opts[key].cmd);
							}
						}
						break;
					case 'name':
						Match.push(Mod.name);
						break;
					default:
						break;
				}
				for (let i=0; i<Match.length;i++) {
					// TODO: Change to function and compare n to n for par and info (recursive?)
					if (Filters[Filter] === Match[i]) {
						bMatch = true;
						break;
					} else {
						bMatch = false;
					}
				}
				console.log('FilterKey: ', Filter, ' Filter:', Filters[Filter], ' Match:', Match, ' bMatch:', bMatch);
				func();


			}, (err) => {
				if (err) {
					console.log(err);
				}
				callback(err, bMatch);
			});
		}
	}

})();
