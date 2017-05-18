(function testModule5() {

	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('testModule5.md::Setup');
	}

	function Start(com, fun) {
		console.log('testModule5.md::Start');
	}
})();