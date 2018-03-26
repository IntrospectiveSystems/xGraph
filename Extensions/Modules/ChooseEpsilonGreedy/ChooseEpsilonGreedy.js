//# sourceURL=ChooseEpsilonGreedy.js
(function ChooseEpsilonGreedy() {

	//-----------------------------------------------------dispatch
	let dispatch = {
		Start,
		Setup,
		Play
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		log.i(`--ChooseEpsilonGreedy/Setup`);
		
		//load in npm module "probability-distributions" to 
		this.Vlt.ProbabilityDistributions = this.require("probability-distributions");

		if (!("Epsilon" in this.Par) || (typeof this.Par.Epsilon == "number"))
			this.Par.Epsilon = 0.01;
			
		fun(null, com);
	}


	function Start(com, fun) {
		log.i("--ChooseEpsilonGreedy/Start");

		fun(null, com);
	}


	function Play(com, fun) {
		log.i(`-Bandit/Play: Bandit - ${com.Index}`);


		fun(null, com);
	}

})();
