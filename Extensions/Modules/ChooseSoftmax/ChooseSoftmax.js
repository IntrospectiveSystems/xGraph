//# sourceURL=ChooseSoftmax.js
(function ChooseSoftmax() {

	//-----------------------------------------------------dispatch
	let dispatch = {
		Start,
		Setup
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		log.i(`--ChooseSoftmax/Setup`);

		//load in npm module "probability-distributions" to 
		this.Vlt.ProbabilityDistributions = this.require("probability-distributions");

		if (!("Stepms" in this.Par) || !(typeof this.Par.Stepms == "number"))
			this.Par.Stepms = 0;

		if (!("InitialEstimates" in this.Par) || !(typeof this.Par.InitialEstimates == "number"))
			this.Par.InitialEstimates = 0;

		this.Vlt.Waiting = false;

		fun(null, com);
	}


	async function Start(com, fun) {
		log.i("--ChooseSoftmax/Start");

		await new Promise((res, rej) => {
			//retrieve the learned data
			let cmd = {};
			cmd.Cmd = "GetData";
			cmd.Key = `${this.Par.Entity}-AverageReturnEstimates`;
			this.send(cmd, this.Par.BackendServer, async (err, com) => {
				// log.d(JSON.stringify(com, null, 2));
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
					log.v(`ChooseSoftmax - Starting with preLearned`, this.Vlt.AverageReturn);
				if (!("PlayCountByInput" in this.Vlt)) this.Vlt.PlayCountByInput = this.Vlt.ProbabilityDistributions.sample([0], this.Vlt.InputDimensions[0], true);
				resolve();
			});
		});

		this.Vlt.ActionLoop = setInterval(() => {
			if (!this.Vlt.Waiting) {
				this.Vlt.Waiting = true;

				let maxIndex = this.Vlt.AverageReturn.indexOf(Math.max(...this.Vlt.AverageReturn));

				// play by weighted sample from average returns (softmax selection)
				let sampleArray = [];
				for (let index = 0; index < this.Vlt.AverageReturn.length; index++) {
					sampleArray.push((this.Vlt.AverageReturn[index] < 0) ? 0.1 : this.Vlt.AverageReturn[index]);
				}
				let playIndex = this.Vlt.ProbabilityDistributions.sample(this.Vlt.PlayOptions, 1, false, sampleArray)[0];


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

					// log.d(`Value: ${com.Value}`);
					// log.d(this.Vlt.AverageReturn);
					// log.d(this.Vlt.PlayCountByInput);
					//update the known average returns
					this.Vlt.PlayCountByInput[com.Index]++;
					this.Vlt.AverageReturn[com.Index] += ((com.Value - this.Vlt.AverageReturn[com.Index]) / this.Vlt.PlayCountByInput[com.Index]);
					this.Vlt.Waiting = false;

					// log.i(this.Vlt.PlayCountByInput);
					this.Vlt.TotalRuns = this.Vlt.PlayCountByInput.reduce((sum, current) => { return sum += current; });
					// log.i(this.Vlt.PlayCountByInput.reduce((sum, current) => { return sum += current; }));


					let cmd = {};
					cmd.Cmd = "AddData";
					cmd.Channel = this.Par.Entity;
					cmd.Data = this.Vlt.AverageReturn;
					this.send(cmd, this.Par.Chart);

					if (((this.Vlt.TotalRuns - 1) % 1000 == 0) && (this.Vlt.TotalRuns != 1)) { //|| (Math.max(...this.Vlt.PlayCountByInput) >= 500)) {
						log.i("Finished \n", this.Vlt.TotalRuns);
						log.i(this.Vlt.PlayCountByInput);
						log.i(`Estimate state max ${this.Vlt.AverageReturn.indexOf(Math.max(...this.Vlt.AverageReturn))}\n`, this.Vlt.AverageReturn);

						let finalizeCommand = {
							Cmd: "GetTrueState",
							ID: this.Par.Pid,
							Index: playIndex
						};

						this.send(finalizeCommand, this.Par.Environment, (err, com) => {
							log.i(`True state max ${com.TrueState.indexOf(Math.max(...com.TrueState))}\n`, com.TrueState);
							log.i(`Total return ${this.Vlt.PlayCountByInput.reduce((sum, current, index) => { return sum += current * this.Vlt.AverageReturn[index]; })}`);
							log.i(`Total Average return ${this.Vlt.PlayCountByInput.reduce((sum, current, index) => { return sum += current * this.Vlt.AverageReturn[index]; }) / this.Vlt.TotalRuns}`);

							// process.exit(1);
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
								log.v(`ChooseSoftmax -Server has been updated with Learned Average Returns`);
							});

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
