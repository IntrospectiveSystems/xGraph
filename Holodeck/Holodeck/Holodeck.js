(function Holodeck() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Holodeck/Setup');
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Holodeck/Start');
		if(fun)
			fun();
	}

})();
