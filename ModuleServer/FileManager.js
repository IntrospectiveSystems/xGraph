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
		fun();
	}

	function Start(com, fun) {
		console.log('FileManager::Start');
		fun();
	}

	// Receives module data and writes module to designated storage
	function AddModule(com, fun) {
		console.log('FileManager::AddModule');
		if ('Module' in com) {
			// Check for duplicates and overwrite if necessary
			// Create zipped file
			// Write to stash
		}
		fun();
	}

	function GetModule(com, fun) {
		// Check stash for module file
		// return module file in com.Module

		fun();
	}

})();