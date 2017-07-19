//# sourceURL=RenderController.js
//jshint esversion: 6
(function RenderController() {

	class RenderController {
		Start(com, fun) {
			this.Vlt.threads = [];
			this.Vlt.Directory = "C:/xGraph/Work/WobbleTest/Simulations/spock";
			this.Vlt.unprocessed = [];
			require('fs').readdir(this.Vlt.Directory, (err, files) => {
				this.Vlt.unprocessed.push(...files);
			});
		}
		RendererReady(com, fun) {

			// debugger;
			this.send({
				Cmd: "BeginMovie",
				Forward: com.Passport.From
			}, this.Par.Browser, () => {
				this.Vlt.threads.push(com.Passport.From);
				console.log('RENDERER RESET', this.Vlt.threads);
			});

			fun(null, com);
		}





	}

	return {
		dispatch: RenderController.prototype
	};

})();