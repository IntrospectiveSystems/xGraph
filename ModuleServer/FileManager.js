(function FileManager() {

	var dispatch = {
		Setup: Setup,
		Start: Start,
		AddModule: AddModule
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('FileManager::Setup');
	}

	function Start(com, fun) {
		console.log('FileManager::Start');
	}

	// Receives module data and writes module to designated storage
	function AddModule(com, fun) {
		console.log('FileManager::AddModule');
	}

})();