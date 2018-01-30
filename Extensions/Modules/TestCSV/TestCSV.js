//# sourceURL=TestCSV.js
(function TestCSV() {
	class TestCSV {
		Setup(com, fun) {
			//this function is typically used to allow the entity/module to handle any internal setup
			//procedures prior to being connected to by other entities/modules

			fun(null, com);
		}

		Start(com, fun){
			//this function is typically used to allow the entity/module to handle any external setup
			//procedures
			let that = this;


			let command = {
				Cmd: "ReadFile"
			};

			that.send(command, that.Par.CSV, callback);

			function callback(err, cmd){
				log.i("Made it here!");
				log.i(cmd);
				command = {
					Cmd:"WriteFile",
					Data: ""
				};
				that.send(command, that.Par.CSV, backcall);
				function backcall(err,msg){
					log.i("Made it here too!");
					log.i(msg);
				}

			}
            fun(null, com);
		}
	}
	return {dispatch:TestCSV.prototype};
})();