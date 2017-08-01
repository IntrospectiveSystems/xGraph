//#
//jshint esversion: 6
(function Car() {

	class Car {
		Start(com, fun) {
   			/* this.send({
				Cmd: 'AddModel',
				Name: "Geo.101Plants.Cactus3"
			}, this.Par.Scene, (err, com) => {
				debugger;
			}); */
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