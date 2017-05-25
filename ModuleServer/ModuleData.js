(function ModuleData() {

	var dispatch = {
		AddModule: AddModule
	};

	return {
		dispatch: dispatch
	};

	//
	function AddModule(com, fun) {
		console.log('ModuleData::AddModule');
		var that = this;
		var JSZip = require('jszip');
		var async = require('async');
		// TODO: Load from external template
		com.Checklist = {
			input: {
				required: false,
				opts: false
			},
			output: {
				required: false,
				opts: false
			},
			par: {
				required:false,
				opts: false
			},
			name: false,
			info: false,
			doc: false,
			src: false
		};



		JSZip.loadAsync(com.Module)
			.then(function(zip) {
				console.log('ModuleData:AddModule:JSZip::::');
				com.Module = zip;
				zip.file("module.json").async("string").then(function (data) {
					let mod = JSON.parse(data);
					com.Info = mod;
					checkMod(mod, com.Checklist, function() {
						fun(null, com);
					})

				});
			});


		function checkMod(obj, checklist, callback) {
			let keys = Object.keys(checklist);
			async.forEach(keys, (key, func) => {

				if (obj[key]) {
					if( (typeof checklist[key] === "object") && (key !== null) ) {
						checkMod(obj[key], checklist[key], func);
					} else {
						// TODO: ensure icon/src/doc are files in module zip
						if (obj[key]) {
							checklist[key] = true;
						}
						func();
					}
				} else {
					func();
				}

			}, (err) => {
				if (err) console.log(err);
				callback();
			});
		}
	}

	function GetModule(com, fun) {
		console.log('ModuleData::GetModule');
		fun(null, com);
	}

})();