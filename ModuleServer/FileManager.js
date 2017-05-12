(function FileManager() {

	var dispatch = {
		Setup: Setup,
		Start: Start,
		AddModule: AddModule,
		GetModule: GetModule
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('FileManager::Setup');
		console.log(com);
		fun()
	}

	function Start(com, fun) {
		console.log('FileManager::Start');
		fun();
	}

	// Receives module data and writes module to designated storage
	function AddModule(com, fun) {
		console.log('FileManager::AddModule');
		var that = this;
		if ('Module' in com) {
			console.log(com);
			var path = Nxs.genPath(com.ModuleStorage + '/' + com.Info.name + '.zip');
			// TODO: Check if file exists and overwrite (sanity check should take place in ModuleServer)
			com.Module.generateNodeStream({type:'nodebuffer',streamFiles:true})
				.pipe(fs.createWriteStream(path))
				.on('finish', function () {
					console.log("out.zip written.");
					if(fun) fun(null, com);
				});
		} else {
			if(fun) fun(null, com);
		}

	}

	function GetModule(com, fun) {
		var path = Nxs.genPath(com.ModuleStorage + '/' + com.Name + '.zip');
		if (fs.existsSync(path)) {
			fs.readFile(path, done);
		} else {
			var err = 'Module <' + com.Name + '> not in archive';
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err, com);
		}

		function done(err, data) {
			if(err) {
				console.log(' ** ERR:' + err);
				if(fun)
					fun(err);
				return;
			}
			delete com.ModuleStorage;
			com.Module = data.toString('base64');
			if(fun)
				fun(null, com);
		}
		fun();
	}

	// Get file in specific module and return in com.Info
	function GetIcon(com, fun) {
		// Read module zip

	}

})();