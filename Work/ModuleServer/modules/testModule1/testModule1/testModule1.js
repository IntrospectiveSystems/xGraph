(function testModule1() {

	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('testModule1.md::Setup');
	}

	function Start(com, fun) {
		console.log('testModule1.md::Start');
	}
})();