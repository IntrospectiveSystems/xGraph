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


	async function Start(com, fun) {
		log.i("--Bandit/Start");



		await new Promise((res, rej) => {
			//retrieve the learned data
			let cmd = {};
			cmd.Cmd = "GetData";
			cmd.Key = "Means";
			this.send(cmd, this.Par.BackendServer, (err, com) => {
				if (err) log.w(err);
				if (com.Data) {
					this.Par.Means = com.Data;
					log.i(`Bandit Client has been updated with Bandit Standard Deviations`);
				}
				res();
			});
		});


		if (!this.Par.Means) {
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
			cmd.Data = this.Vlt.Means;
			this.send(cmd, this.Par.BackendServer, (err, com) => {
				if (err) log.w(err);
				log.v(`Bandit Server has been updated with Means`);
			});
		}





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
			cmd.Data = this.Vlt.StandardDeviations;
			this.send(cmd, this.Par.BackendServer, (err, com) => {
				if (err) log.w(err);
				log.v(`Bandit Server has been updated with Standard Deviations`);
			});
		}


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
			this.send(cmd, this.Par.BackendServer, (err, com) => {
				if (err) log.w(err);
				log.v(`Bandit Server has been updated with Learned Average Returns`);
			});
		}




		log.v(`There are ${this.Par.BanditCount} one-armed bandits`);
		log.v(`Preallocating for ${this.Par.PreallocationCount} plays`);
		log.v(`Means by index are ${this.Par.Means}`);
		log.v(`Standard Deviations by index are ${this.Par.StandardDeviations}`);


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

		// log.d(JSON.stringify(com, null, 2));

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
