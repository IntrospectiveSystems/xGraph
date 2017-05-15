(function Test() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Test: Test
	};

	return {
		dispatch: dispatch
	};

	function Test(com, fun) {
		console.log('--Test/Test');
		if(fun)
			fun();
	}

})();
