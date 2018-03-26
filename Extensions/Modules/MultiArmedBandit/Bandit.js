//# sourceURL=Bandit.js
(function Bandit() {

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
		log.i(`--Bandit/Setup`);
		//if BanditCount is not set in the config.json we default to 10 as in Sutton 
		//and Bartow http://incompleteideas.net/book/bookdraft2017nov5.pdf
		if (!("BanditCount" in this.Par) || !(typeof this.Par.BanditCount == "number")) this.Par.BanditCount = 10;

		//load in npm module "probability-distributions" to 
		this.Vlt.ProbabilityDistributions = this.require("probability-distributions");

		//store the prealloted distributions
		this.Vlt.Bandits = [];
		//store the actions by PlayerID
		this.Vlt.PlayerHistory = {};

		//the number of plays to preallocate
		if (!("PlayCount" in this.Par) || !(typeof this.Par.PlayCount == "number")) this.Par.PlayCount = 1000;

		//build an array of means 
		if (("Means" in this.Par) && (this.Par.Means instanceof Array)) {
			if (this.Par.Means.length != this.Par.BanditCount)
				this.Par.Means = this.Vlt.ProbabilityDistributions.sample(this.Par.Means, this.Par.BanditCount, (this.Par.Means.length < this.Par.BanditCount) ? true : false);
		} else {
			this.Par.Means = [0];
			this.Par.Means = this.Vlt.ProbabilityDistributions.sample(this.Par.Means, this.Par.BanditCount, (this.Par.Means.length < this.Par.BanditCount) ? true : false);
		}

		//build an array of standard deviations
		if (("StandardDeviations" in this.Par) && (this.Par.StandardDeviations instanceof Array)) {
			if (this.Par.StandardDeviations.length != this.Par.BanditCount)
				this.Par.StandardDeviations = this.Vlt.ProbabilityDistributions.sample(this.Par.StandardDeviations, this.Par.BanditCount, (this.Par.StandardDeviations.length < this.Par.BanditCount) ? true : false);
		} else {
			this.Par.StandardDeviations = [1];
			this.Par.StandardDeviations = this.Vlt.ProbabilityDistributions.sample(this.Par.StandardDeviations, this.Par.BanditCount, (this.Par.StandardDeviations.length < this.Par.BanditCount) ? true : false);
		}

		for (let banditIndex = 0; banditIndex < this.Par.BanditCount; banditIndex++) {
			this.Vlt.Bandits[banditIndex] = this.Vlt.ProbabilityDistributions.rnorm(this.Par.PlayCount, this.Par.Means[banditIndex], this.Par.StandardDeviations[banditIndex]);
		}

		fun(null, com);
	}


	function Start(com, fun) {
		log.i("--Bandit/Start");

		log.v(`There are ${this.Par.BanditCount} one-armed bandits`);
		log.v(`Play the game ${this.Par.PlayCount} times`);
		log.v(`Means by index are ${this.Par.Means}`);
		log.v(`Standard Deviations by index are ${this.Par.StandardDeviations}`);
		// log.v(this.Vlt.Bandits);

		fun(null, com);
	}


	function Play(com, fun) {
		log.i(`-Bandit/Play: Bandit - ${com.Index}`);

		if (!(com.ID in this.Vlt.PlayerHistory))
			this.Vlt.PlayerHistory[com.ID] = this.Vlt.ProbabilityDistributions.sample([0], this.Par.BanditCount, true);

		let playIndex = this.Vlt.PlayerHistory[com.ID][com.Index]++;

		com.Value = this.Vlt.Bandits[com.Index][playIndex];
		
		log.d(`Accessing Play ${playIndex} from BanditIdx ${com.Index} for player ${com.ID} and got value ${com.Value}`);
		fun(null, com);
	}

})();
