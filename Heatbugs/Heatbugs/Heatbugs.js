(function Http() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Heatbugs/Setup');
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Heatbugs/Start');
		if(fun)
			fun();
	}

})();
