// ModuleServer Apex
// Manages module entities and filtering capability
// Defers storage to FileManager

(function ModuleServer() {

	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetModule: GetModule,
		AddModule: AddModule,
		Query: Query,
	};

	return {
		dispatch: dispatch
	};


	// Iterate through import folder and create modules
	function Setup(com, fun) {
		var that = this;


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
		let par = {};
		par.Entity = 'xGraph:ModuleServer/ModuleServer';
		par.Name = 'Test';





		function scandir() {
			fs.readdir(path, function (err, files) {
				if (err) {
					console.log(' ** ERR:Project file err:' + err);
					func(err);
					return;
				}
				async.eachSeries(files, scan, finished);

				function finished(err) {

					func();
				}
			});
		}

		function scan(file, func) {
			// If isDirectory
			// 	Look for module.json
			// 	read through module.json and create zipped module




		}
		fun();

	}

	// Get module by pid, return full Module zip
	function GetModule(com, fun) {

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
	}

})();
