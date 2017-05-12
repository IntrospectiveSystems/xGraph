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
		var JSZip = require('jszip');
		var async = require('async');

		console.log(com.Module);
		var Checklist = {
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
				console.log(zip);
				com.Module = zip;

				// TODO: Read module.json from zip and compare with Checklist
				/*
				checkMod(Checklist, () => {
					console.log(Checklist);

				});
				*/

				fun(null, com);
			});


		function checkMod(obj, callback) {
			console.log('checkMod: ', obj);
			let keys = Object.keys(obj);
			async.forEach(keys, (key, func) => {
				if( (typeof key === "object") && (key !== null) ) {
					checkMod(obj[key], func);
				} else {
					// TODO: key against module.json
					// TODO: ensure icon/src/doc are files in module zip
					obj[key] = true;
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