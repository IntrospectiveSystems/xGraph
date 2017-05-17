(function FileManager() {

	var dispatch = {
		Setup: Setup,
		Start: Start,
		AddModule: AddModule,
		GetModule: GetModule,
		GetFile: GetFile
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('FileManager::Setup');
		var that = this;
		let path = Nxs.genPath(that.Par.ModuleStorage);
		if (!fs.existsSync(path)) {
			fs.mkdirSync(path);
		}
		// TODO: Check if that.Par.ModuleStorage exists, and if not create it (possible error with permissions/file path)
		fun()
	}

	function Start(com, fun) {
		console.log('FileManager::Start');
		fun();
	}

	// Receives module data and writes module to designated storage
	function AddModule(com, fun) {
		console.log('FileManager::AddModule');
		//var JSZip = require('jszip');
		var that = this;
		console.log(com);

		if ('Module' in com) {
			console.log(com);
			var path = Nxs.genPath(that.Par.ModuleStorage + '/' + com.Info.name);
			// TODO: Check if file exists and overwrite (sanity check should take place in ModuleServer)
			// Create Module Folder
			if (!fs.existsSync(path)) {
				fs.mkdirSync(path);
			}

			com.Module.file(com.Info.icon).async('base64').then(function(data) {
				fs.writeFileSync(path + '/' + com.Info.icon, data)
			});
			com.Module.file(com.Info.doc).async('string').then(function(data) {
				fs.writeFileSync(path + '/' + com.Info.doc, data);
			});
			com.Module.file('module.json').async('string').then(function(data) {
				fs.writeFileSync(path + '/module.json', data);
			});



			// Write icon
			// Write module.json
			// Write doc.md
			com.Module.generateNodeStream({type:'nodebuffer',streamFiles:true})
				.pipe(fs.createWriteStream(path + '/' + com.Info.name + '.zip'))
				.on('finish', function () {
					console.log("out.zip written.");
					if(fun) fun(null, com);
				});
		} else {
			if(fun) fun(null, com);
		}

	}

	function GetModule(com, fun) {
		var that = this;
		var path = Nxs.genPath(that.Par.ModuleStorage + '/' + com.Name + '/' + com.Name + '.zip');
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
			com.Module = data.toString('base64');
			if(fun)
				fun(null, com);
		}
		fun();
	}

	// Used to retrieve a file in a given module folder
	// Requires com.Name as the folder name of the module and com.Filename as the filename (with extension)
	// Returns com.File.
	function GetFile(com, fun) {
		var that = this;

		var path = Nxs.genPath(that.Par.ModuleStorage + '/' + com.Name + '/' + com.Filename);
		if (fs.existsSync(path)) {
			fs.readFile(path, done);
		} else {
			var err = 'File <' + path + '> does not exist';
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
			com.File = data.toString('base64');
			if(fun)
				fun(null, com);
		}
	}

})();