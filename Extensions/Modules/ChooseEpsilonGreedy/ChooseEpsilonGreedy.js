//# sourceURL=ChooseEpsilonGreedy.js
(function ChooseEpsilonGreedy() {

	//-----------------------------------------------------dispatch
	let dispatch = {
		Start,
		Setup
	};

	return {
		dispatch: dispatch
	};


	/**
	 * Load in the required npm library. 
	 * Initialize pars that weren't set in the config.json
	 * @param {Object} com 
	 * @callback fun 
	 */
	function Setup(com, fun) {
		log.i(`--ChooseEpsilonGreedy/Setup`);

		//load in npm module "probability-distributions" to 
		this.Vlt.ProbabilityDistributions = this.require("probability-distributions");

		if (!("Epsilon" in this.Par) || !(typeof this.Par.Epsilon == "number"))
			this.Par.Epsilon = 0.01;

		if (!("Stepms" in this.Par) || !(typeof this.Par.Stepms == "number"))
			this.Par.Stepms = 0;

		if (!("InitialEstimates" in this.Par) || !(typeof this.Par.InitialEstimates == "number"))
			this.Par.InitialEstimates = 0;

		this.Vlt.Waiting = false;

		fun(null, com);
	}


	/**
	 * Try loading in the pre-trained data from the BackendServer if it exists.
	 * Access the size of the input required for the Environment. 
	 * Initialize the Action Loop that chooses the plays from the environment.
	 * @param {Object} com 
	 * @callback fun 
	 */
	async function Start(com, fun) {
		log.i("--ChooseEpsilonGreedy/Start");

		//get pretrained data from the backend server
		await new Promise((res, rej) => {
			//retrieve the learned data
			let cmd = {};
			cmd.Cmd = "GetData";
			cmd.Key = `${this.Par.Entity}-AverageReturnEstimates`;
			this.send(cmd, this.Par.BackendServer, async (err, com) => {
				if (err) log.w(err);
				if (com.Data) {
					this.Vlt.AverageReturn = com.Data.Returns;
					this.Vlt.PlayCountByInput = com.Data.Plays;
					//for stopping on the 1000th run
					this.Vlt.PlayCountByInput[this.Vlt.PlayCountByInput.indexOf(Math.max(this.Vlt.PlayCountByInput))]++
					log.i(`Client has been updated with Learned Average Returns`);
				}
				await new Promise((reso) => {
					setTimeout(() => {
						reso();
					}, 1000);
				});
				res();
			});
		});

		// get the environment state dimensions 
		await new Promise((resolve, reject) => {
			let initialCommand = {
				Cmd: "Initialize",
				ID: this.Par.Pid
			};
			this.send(initialCommand, this.Par.Environment, (err, com) => {
				if (err) {
					log.e(err);

					return;
				}
				this.Vlt.InputDimensions = com.InputDimensions;
				this.Vlt.PlayOptions = [];
				for (let index = 0; index < com.InputDimensions[0]; index++)
					this.Vlt.PlayOptions.push(index);
				if (!this.Vlt.AverageReturn)
					this.Vlt.AverageReturn = this.Vlt.ProbabilityDistributions.sample([this.Par.InitialEstimates], this.Vlt.InputDimensions[0], true);
				else
					log.v(`ChooseEpsilonGreedy - Starting with preLearned`, this.Vlt.AverageReturn);
				if (!("PlayCountByInput" in this.Vlt)) this.Vlt.PlayCountByInput = this.Vlt.ProbabilityDistributions.sample([0], this.Vlt.InputDimensions[0], true);
				resolve();
			});
		});

		// Define the action loop that performs all the selections. 
		// This loop is canceled after 1000 plays have been performed. 
		// Once restarted it will continue based on the previously learned information
		this.Vlt.ActionLoop = setInterval(() => {
			if (!this.Vlt.Waiting) {
				this.Vlt.Waiting = true;

				let maxIndex = this.Vlt.AverageReturn.indexOf(Math.max(...this.Vlt.AverageReturn));

				// implement an epsilon greedy choosing algorithm
				let playIndex = null;
				if (Math.random() < this.Par.Epsilon) {
					let sampleArray = [];
					for (let index = 0; index < this.Vlt.PlayOptions.length; index++) {
						if (index == maxIndex) continue;
						sampleArray.push(index);
					}
					playIndex = this.Vlt.ProbabilityDistributions.sample(sampleArray, 1, false)[0];
				} else {
					playIndex = maxIndex;
				}

				//build the play (action) command that will be sent to the environment
				let playCommand = {
					Cmd: "Play",
					ID: this.Par.Pid,
					Index: playIndex
				};
				this.send(playCommand, this.Par.Environment, (err, com) => {
					if (err) {
						log.e(err);
						this.Vlt.Waiting = false;
						return;
					}

					//update the known average returns
					this.Vlt.PlayCountByInput[com.Index]++;
					this.Vlt.AverageReturn[com.Index] += ((com.Value - this.Vlt.AverageReturn[com.Index]) / this.Vlt.PlayCountByInput[com.Index]);

					this.Vlt.Waiting = false;
					this.Vlt.TotalRuns = this.Vlt.PlayCountByInput.reduce((sum, current) => { return sum += current; });

					//update the Chart module in the Environment system
					let cmd = {};
					cmd.Cmd = "AddData";
					cmd.Channel = this.Par.Entity;
					cmd.Data = this.Vlt.AverageReturn;
					this.send(cmd, this.Par.Chart);

					if (((this.Vlt.TotalRuns - 1) % 1000 == 0) && (this.Vlt.TotalRuns != 1)) {
						log.i("Finished \n", this.Vlt.TotalRuns);
						log.i(this.Vlt.PlayCountByInput);
						log.i(`Estimate state max ${this.Vlt.AverageReturn.indexOf(Math.max(...this.Vlt.AverageReturn))}\n`, this.Vlt.AverageReturn);


						//get the true state from the environment for comparison.
						let finalizeCommand = {
							Cmd: "GetTrueState",
							ID: this.Par.Pid,
							Index: playIndex
						};
						this.send(finalizeCommand, this.Par.Environment, (err, com) => {
							log.i(`True state max ${com.TrueState.indexOf(Math.max(...com.TrueState))}\n`, com.TrueState);
							log.i(`Total return ${this.Vlt.PlayCountByInput.reduce((sum, current, index) => { return sum += current * this.Vlt.AverageReturn[index]; })}`);
							log.i(`Total Average return ${this.Vlt.PlayCountByInput.reduce((sum, current, index) => { return sum += current * this.Vlt.AverageReturn[index]; }) / this.Vlt.TotalRuns}`);

							//stop the action loop
							clearInterval(this.Vlt.ActionLoop);

							//save the learned data
							let cmd = {};
							cmd.Cmd = "SetData";
							cmd.Key = `${this.Par.Entity}-AverageReturnEstimates`;
							cmd.Data = {
								Plays: this.Vlt.PlayCountByInput,
								Returns: this.Vlt.AverageReturn
							};
							this.send(cmd, this.Par.BackendServer, (err, com) => {
								if (err) log.w(err);
								log.v(`ChooseEpsilonGreedy -Server has been updated with Learned Average Returns`);
							});

							//send the true state to the chart module
							cmd = {};
							cmd.Cmd = "AddData";
							cmd.Channel = "TrueState";
							cmd.Data = com.TrueState;
							this.send(cmd, this.Par.Chart);
						});
					}
				});
			}
		}, this.Par.Stepms);

		fun(null, com);
	}

})();
