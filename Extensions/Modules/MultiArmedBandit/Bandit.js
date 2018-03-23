//# sourceURL=Bandit.js
(function Bandit() {

	//-----------------------------------------------------dispatch
	let dispatch = {
		Start: Start,
		Setup
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		this.Vlt.ProbabilityDistributions = this.require("probability-distributions");
		this.Vlt.Bandits = [];
		if ("Means") {
			
		}

		for (let banditIndex = 0; banditIndex < this.Par.BanditCount; banditIndex++) {
			this.Vlt.Bandits
		}

		fun(null, com);
	}


	function Start(com, fun) {
		console.log("--Bandit/Start");

		fun(null, com);




		// setTimeout(()=>{
		// 	log.d(`Terminating the current process with exit code 72`)
		// 	process.exit(72);
		// }, 4000);

	}

})();
