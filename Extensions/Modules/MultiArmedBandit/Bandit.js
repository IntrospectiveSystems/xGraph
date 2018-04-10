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

	/**
	 * Preload the required js scripts from npm and allocate spaces for following used variables
	 * @param {Object} com 
	 * @callback fun 
	 */
	async function Setup(com, fun) {
		log.i(`--Bandit/Setup`);

		//if BanditCount is not set in the config.json we default to 10 as in Sutton 
		//and Bartow http://incompleteideas.net/book/bookdraft2017nov5.pdf
		if (!("BanditCount" in this.Par) || !(typeof this.Par.BanditCount == "number")) this.Par.BanditCount = 10;

		//load in npm module "probability-distributions" to 
		this.Vlt.ProbabilityDistributions = this.require("probability-distributions");

		//store the actions by PlayerID
		this.Vlt.PlayerHistory = {};

		//the number of plays to preallocate
		if (!("PreallocationCount" in this.Par) || !(typeof this.Par.PreallocationCount == "number")) this.Par.PreallocationCount = 1000;

		fun(null, com);
	}

	/**
	 * Try to load data from the backend server if available otherwise 
	 * generate it and send it off to the backend server if available
	 * @param {Object} com 
	 * @callback fun 
	 */
	async function Start(com, fun) {
		log.i("--Bandit/Start");

		if ("BackendServer" in this.Par)
			//trying to retrieve the means list
			await new Promise((res, rej) => {
				//retrieve the learned data
				let cmd = {};
				cmd.Cmd = "GetData";
				cmd.Key = "Means";
				this.send(cmd, this.Par.BackendServer, (err, com) => {
					if (err) log.w(err);
					if (com.Data) {
						this.Par.Means = com.Data;
						log.i(`Bandit Client has been updated with Bandit Means`);
					}
					res();
				});
			});

		//load in the means
		if (!this.Par.Means || !(this.Par.Means instanceof Array)) {
			log.v("Bandit - Building new Means");
			//build an array of means
			if (("Means" in this.Par) && (this.Par.Means instanceof Array)) {
				if (this.Par.Means.length != this.Par.BanditCount)
					this.Par.Means = this.Vlt.ProbabilityDistributions.sample(this.Par.Means, this.Par.BanditCount, (this.Par.Means.length < this.Par.BanditCount) ? true : false);
			} else {
				this.Par.Means = this.Vlt.ProbabilityDistributions.rnorm(this.Par.BanditCount, this.Par.Means || 0, (typeof this.Par.StandardDeviations == 'number') ? this.Par.StandardDeviations : 1);
			}

			let cmd = {};
			cmd.Cmd = "SetData";
			cmd.Key = "Means";
			cmd.Data = this.Par.Means;
			if ("BackendServer" in this.Par)
				this.send(cmd, this.Par.BackendServer, (err, com) => {
					if (err) log.w(err);
					log.v(`Bandit Server has been updated with Means`);
				});
		}

		//load in the standard deviations
		if ("BackendServer" in this.Par)
			//trying to retrieve the Standard deviations list
			await new Promise((res, rej) => {
				//retrieve the learned data
				let cmd = {};
				cmd.Cmd = "GetData";
				cmd.Key = "StandardDeviaitons";
				this.send(cmd, this.Par.BackendServer, (err, com) => {
					if (err) log.w(err);
					if (com.Data) {
						this.Par.StandardDeviations = com.Data;
						log.i(`Bandit Client has been updated with Bandit Standard Deviations`);
					}
					res();
				});
			});


		if (!this.Par.StandardDeviations) {
			log.v("Bandit - Building new Standard Deviations");
			//build an array of standard deviations
			if (("StandardDeviations" in this.Par) && (this.Par.StandardDeviations instanceof Array)) {
				if (this.Par.StandardDeviations.length != this.Par.BanditCount)
					this.Par.StandardDeviations = this.Vlt.ProbabilityDistributions.sample(this.Par.StandardDeviations, this.Par.BanditCount, (this.Par.StandardDeviations.length < this.Par.BanditCount) ? true : false);
			} else {
				this.Par.StandardDeviations = [1];
				this.Par.StandardDeviations = this.Vlt.ProbabilityDistributions.sample(this.Par.StandardDeviations, this.Par.BanditCount, (this.Par.StandardDeviations.length < this.Par.BanditCount) ? true : false);
			}

			let cmd = {};
			cmd.Cmd = "SetData";
			cmd.Key = "StandardDeviaitons";
			cmd.Data = this.Par.StandardDeviations;
			if ("BackendServer" in this.Par)
				this.send(cmd, this.Par.BackendServer, (err, com) => {
					// log.w("SD Data", com.Data);
					if (err) log.w(err);
					log.v(`Bandit Server has been updated with Standard Deviations`);
				});
		}


		//load in the previous distributions
		if ("BackendServer" in this.Par)
			//trying to retuieve the Bandits array
			await new Promise((res, rej) => {
				//retrieve the learned data
				let cmd = {};
				cmd.Cmd = "GetData";
				cmd.Key = "BanditDistibutions";
				this.send(cmd, this.Par.BackendServer, (err, com) => {
					if (err) log.w(err);
					if (com.Data) {
						this.Vlt.Bandits = com.Data;
						log.i(`Bandit Client has been updated with Bandit Distributions`);
					}
					res();
				});
			});


		if (!this.Vlt.Bandits) {
			log.v("Bandit - Building new Bandits");
			//store the prealloted distributions
			this.Vlt.Bandits = [];
			for (let banditIndex = 0; banditIndex < this.Par.BanditCount; banditIndex++) {
				this.Vlt.Bandits[banditIndex] = this.Vlt.ProbabilityDistributions.rnorm(this.Par.PreallocationCount, this.Par.Means[banditIndex], this.Par.StandardDeviations[banditIndex]);
			}
			let cmd = {};
			cmd.Cmd = "SetData";
			cmd.Key = "BanditDistibutions";
			cmd.Data = this.Vlt.Bandits;
			if ("BackendServer" in this.Par)
				this.send(cmd, this.Par.BackendServer, (err, com) => {
					if (err) log.w(err);
					log.v(`Bandit Server has been updated with Bandit Distributions`);
				});
		}

		log.v(`There are ${this.Par.BanditCount} one-armed bandits`);
		log.v(`Preallocating for ${this.Par.PreallocationCount} plays`);
		log.v(`Means by index are ${this.Par.Means}`);
		log.v(`Standard Deviations by index are ${this.Par.StandardDeviations}`);

		fun(null, com);
	}

	/**
	 * Initialize the ML tools with the appropriate size input dimensions
	 * @param {Object} com 
	 * @param {String} com.ID		the ID of the module being initialized
	 * @callback fun 
	 */
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

	/**
	 * The main interaction with the environment. 
	 * This Function call imitates a "pull of the bandit's arm"
	 * @param {Object} com 
	 * @param {Number} com.Index 		The index of the play chosen
	 * @param {String} com.ID 			The id of the module making the choice
	 * @callback fun 
	 */
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

		let playIndex = this.Vlt.PlayerHistory[com.ID][com.Index]++;
		if (playIndex % this.Par.PreallocationCount == 0 && (playIndex != 0)) {
			log.d(`Play index is ${playIndex}`);
			this.Vlt.Bandits[com.Index] = this.Vlt.Bandits[com.Index].concat(this.Vlt.ProbabilityDistributions.rnorm(this.Par.PreallocationCount, this.Par.Means[com.Index], this.Par.StandardDeviations[com.Index]));

			let cmd = {};
			cmd.Cmd = "SetData";
			cmd.Key = "BanditDistibutions";
			cmd.Data = this.Vlt.Bandits;
			if ("BackendServer" in this.Par)
				this.send(cmd, this.Par.BackendServer, (err, com) => {
					if (err) log.w(err);
					log.v(`Bandit Server has been updated with Learned Average Returns`);
				});
		}
		log.d(this.Vlt.Bandits);
		log.d(com.Index);
		log.d(playIndex);
		com.Value = this.Vlt.Bandits[com.Index][playIndex];

		fun(null, com);
	}

	/**
	 * A way for the ML module to access the true state of the environment. 
	 * @param {Object} com 
	 * @callback fun 
	 */
	function GetTrueState(com, fun) {
		com.TrueState = this.Par.Means;

		fun(null, com);
	}

})();
