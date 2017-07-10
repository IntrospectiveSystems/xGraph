
//jshint esversion: 6
(function Car() {

	class Car {
		Start(com, fun) {
			this.send({Cmd: 'AddModel'}, this.Par.Scene, () => {
				debugger;
			});
			fun(null, com);
		}
		Setup(com, fun) {
			fun(null, com);
		}
	}

	return {
		dispatch: Car.prototype
	};

})();