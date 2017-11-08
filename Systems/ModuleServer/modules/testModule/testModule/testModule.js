(function testModule() {

	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('testModule.md::Setup');
	}

	function Start(com, fun) {
		console.log('testModule.md::Start');
	}
})();