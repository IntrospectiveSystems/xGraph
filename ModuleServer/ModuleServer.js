// ModuleServer Apex
// Manages module entities and filtering capability
// Defers storage to FileManager

(function ModuleServer() {

	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetModule: GetModule,
		GetDocumentation: GetDocumentation,
		AddModule: AddModule,
		Query: Query,
		DownloadModule: DownloadModule
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
						that.send({Cmd:'AddModule', Module:zip, ModuleStorage:that.Par.ModuleStorage, Info: ModuleInfo}, that.Par.FileManager, function(err, com) {
							console.log('Module Saved');
							callback();
						})
					})
				});
			});


			// Scan Module directory for module.json
			function scanModule(dir, callback) {
				fs.readdir(dir, function (err, files) {
					if (err) {
						console.log(' ** ERR:Project file err:' + err);
						return;
					}
					async.eachSeries(files, (file, func) => {
						if (file === 'module.json') {
							fs.readFile(dir + '/' + file, (err, data) => {
								if (err) {
									console.log(' ** ERR:' + err);
									func(err);
									return;
								}
								let modData = JSON.parse(data);
								ModuleInfo = modData;
								that.Par.ModuleCache[modData.name] = modData;
								func();
							});
						} else {
							func();
						}
					}, function(err) {
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
							if (sub) {
								zip.file(sub + '/' + fileName, data);
							} else {
								zip.file(fileName,data);
							}
							callback();
						});
					}
				})
			}
		}
		fun();
	}

	// Pull a module from another ModuleServer into this one.
	// Requires:
	//	com.Module as the name of the module
	//	com.From as the pid of the other ModuleServer
	// Returns:
	//	Nothing
	function DownloadModule(com, fun) {

		let otherModuleServer = com.From;
		let name = com.Module;
		let that = this;

		that.send({ Cmd: 'GetModule', Name: name }, otherModuleServer, (err, cmd) => {

			let moduleZip = cmd.Module;

			that.send({ Cmd: 'AddModule', Name: name, Module: moduleZip }, that.Par.Pid, (err, cmd) => {
				
				fun(null, com);

			});

		});

	}

	// Get module from moduleCache, return full Module zip
	// Requires:
	//	com.Name,
	// Returns zipped module in base64 in com.Module
	function GetModule(com, fun) {
		console.log('ModuleServer:GetModule');
		var async = require('async');
		var that = this;
		if (!'Name' in com) {
			fun(null, com);
		}
		if (com.Name in that.Par.ModuleCache) {
			com.Module = that.Par.ModuleCache[com.Name];
			that.send(com, that.Par.FileManager, (err, com) => {
				if (fun) {
					fun(null, com);
				}
			})
		} else {
			if (fun) {
				fun(null, com);
			}
		}
	}

	// GetDocumentation file for a particular module
	// Requires:
	//	com.Name as the name of the module
	// Returns:
	//	com.Info as a base64 encoded string of the contents of the markdown file as declared in the module.json
	function GetDocumentation(com, fun) {
		console.log('ModuleServer:GetDocumentation');
		var that = this;
		let modInfo = that.Par.ModuleCache[com.Name];
		that.send({Cmd:'GetFile',Name:com.Name,Filename:modInfo.doc}, that.Par.FileManager, (err, cmd) => {
			com.Info = cmd.File;
			if (fun) fun(null, com);
		})
	}

	// Inspect module files for required pars, create module entity, add zipped module to module location
	// Requires:
	// 	com.Module as zipped module file
	//	com.Name as named in module.json
	function AddModule(com, fun) {
		console.log('ModuleServer:AddModule');
		var that = this;
		if ('Module' in com) {
			let buf = Buffer.from(com.Module, 'base64');
			com.Module = buf;

			that.send(com, that.Par.ModuleData, function(err, com) {
				if (err) {
					console.log(err);
					fun(err, com);
					return;
				}
				that.Par.ModuleCache[com.Info.name] = com.Info;
				that.save();
				that.send(com, that.Par.FileManager, function(err, com) {
					if (err) {
						console.log(err);
						fun(err, com);
						return;
					}

					// debugger;
					if (fun) fun(null, com);
				});
				if (fun) fun(null, com);
			})
		} else {
			if(fun) fun('ERR:ModuleServer: Missing com.Module(zipped module)', com);
		}

	}

	// Get module list based on filters, return module info
	// Requires:
	//	com.Filters as object with possible filters Input,Output,Name as strings
	// Returns Array of module.json typeobjects in com.Info
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
						let modInfo = JSON.parse(JSON.stringify(that.Par.ModuleCache[module]));
						if ('icon' in modInfo && modInfo.icon !== null) {
							that.send({Cmd:'GetFile',Name:modInfo.name,Filename:modInfo.icon}, that.Par.FileManager, function(err, cmd) {
								modInfo.icon = cmd.File;
								com.Info.push(modInfo);
								func();
							});
						} else {
							com.Info.push(modInfo);
							func();
						}

					} else {
						func();
					}
				});
				}, (err) => {
				if (fun) {
					fun(null, com);
				}
			})
		}

		function CheckFilters(Mod, Filters, callback) {
			let bMatch = true;
			console.log('CheckFilters');
			//console.log(Filters);
			// Iterate through filters
			// Check against each property in module
			async.forEach(Object.keys(Filters), (Filter, func) => {
				//console.log("Filter is ", Filter);
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
				//console.log("Match is", Match);
				for (let i=0; i<Match.length;i++) {
					// TODO: Change to function and compare n to n for par and info (recursive?)

					if (Filter == "name" && Mod.name.toLowerCase().startsWith(Filters[Filter].toLowerCase())){
						bMatch = true;
					}else if (Filters[Filter] === Match[i]) {
						bMatch = true;
					} else {
						bMatch = false;
					}
				}
				//console.log('FilterKey: ', Filter, ' Filter:', Filters[Filter], ' Match:', Match, ' bMatch:', bMatch);
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
