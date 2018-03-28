//# sourceURL=Bandit.js
(function Bandit() {

	//-----------------------------------------------------dispatch
	let dispatch = {
		Start,
		Setup,
		Initialize,
		Play,
		GetTrueState
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
		if (!("PreallocationCount" in this.Par) || !(typeof this.Par.PreallocationCount == "number")) this.Par.PreallocationCount = 1000;

		//build an array of means
		if (("Means" in this.Par) && (this.Par.Means instanceof Array)) {
			if (this.Par.Means.length != this.Par.BanditCount)
				this.Par.Means = this.Vlt.ProbabilityDistributions.sample(this.Par.Means, this.Par.BanditCount, (this.Par.Means.length < this.Par.BanditCount) ? true : false);
		} else {
			this.Par.Means = this.Vlt.ProbabilityDistributions.rnorm(this.Par.BanditCount, this.Par.Means || 0, (typeof this.Par.StandardDeviations == 'number') ? this.Par.StandardDeviations : 1);
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
			this.Vlt.Bandits[banditIndex] = this.Vlt.ProbabilityDistributions.rnorm(this.Par.PreallocationCount, this.Par.Means[banditIndex], this.Par.StandardDeviations[banditIndex]);
		}

		fun(null, com);
	}


	function Start(com, fun) {
		log.i("--Bandit/Start");

		log.v(`There are ${this.Par.BanditCount} one-armed bandits`);
		log.v(`Preallocating for ${this.Par.PreallocationCount} plays`);
		log.v(`Means by index are ${this.Par.Means}`);
		log.v(`Standard Deviations by index are ${this.Par.StandardDeviations}`);
		// log.v(this.Vlt.Bandits);

		fun(null, com);
	}

	function Initialize(com, fun) {
		let err = null;
		if (!("ID" in com) || !(typeof com.ID == "string")) {
			err = "ID not defined or of invalid type";
			com.ID = com.ID || null;
		}

		log.i(`--Bandit/Initialize Player - ${com.ID}`);

		if (!(com.ID in this.Vlt.PlayerHistory) && (err == null))
			this.Vlt.PlayerHistory[com.ID] = this.Vlt.ProbabilityDistributions.sample([0], this.Par.BanditCount, true);
		else
			err += "\nID is already initialized";

		com.InputDimensions = [this.Par.BanditCount];

		fun(err, com);
	}


	function Play(com, fun) {
		let err = null;
		// log.d(typeof com.Index, com.Index);
		if (!("Index" in com) || !(typeof com.Index == "number")) {
			err = "Index not defined or of invalid type";
		}
		if (!("ID" in com) || !(typeof com.ID == "string")) {
			err += "\nID not defined or of invalid type";
		}
		if (err != null) {
			fun(err, com);
			return;
		}

		// log.i(`-Bandit/Play: Bandit ${com.Index}`);

		let playIndex = this.Vlt.PlayerHistory[com.ID][com.Index]++;
		if (playIndex % this.Par.PreallocationCount == 0)
			this.Vlt.Bandits[com.Index] = this.Vlt.Bandits[com.Index].concat(this.Vlt.ProbabilityDistributions.rnorm(this.Par.PreallocationCount, this.Par.Means[com.Index], this.Par.StandardDeviations[com.Index]));
		com.Value = this.Vlt.Bandits[com.Index][playIndex];

		// log.d(`Accessing Play ${playIndex} from BanditIdx ${com.Index} for player ${com.ID} and got value ${com.Value}`);

		fun(null, com);
	}


	function GetTrueState(com, fun) {
		com.TrueState = this.Par.Means;

		fun(null, com);
	}

})();
