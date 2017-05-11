(function ModuleData() {

	var dispatch = {
		Setup: Setup,
		Start: Start,
		AddModule: AddModule
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('ModuleData::Setup');
		fun();
	}

	function Start(com, fun) {
		console.log('ModuleData::Start');
		fun();
	}

	function AddModule(com, fun) {
		console.log('ModuleData::AddModule');
		fun(null, com);
	}

	function GetModule(com, fun) {
		console.log('ModuleData::GetModule');
		fun(null, com);
	}

})();