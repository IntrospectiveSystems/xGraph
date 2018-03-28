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
				this.Vlt.AverageReturn = this.Vlt.ProbabilityDistributions.sample([this.Par.InitialEstimates], this.Vlt.InputDimensions[0], true);
				this.Vlt.PlayCountByInput = this.Vlt.ProbabilityDistributions.sample([0], this.Vlt.InputDimensions[0], true);
				resolve();
			});
		});

		this.Vlt.ActionLoop = setInterval(() => {
			if (!this.Vlt.Waiting) {
				this.Vlt.Waiting = true;

				let maxIndex = this.Vlt.AverageReturn.indexOf(Math.max(...this.Vlt.AverageReturn));
				// log.d(`max is ${maxIndex}`);

				// play by weighted sample from average returns (softmax selection)
				let sampleArray = [];
				for (let index = 0; index < this.Vlt.AverageReturn.length; index++) {
					sampleArray.push((this.Vlt.AverageReturn[index]<0)?0.1:this.Vlt.AverageReturn[index]);
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
					//update the known average returns
					this.Vlt.PlayCountByInput[com.Index]++;
					this.Vlt.AverageReturn[com.Index] += ((com.Value - this.Vlt.AverageReturn[com.Index]) / this.Vlt.PlayCountByInput[com.Index]);
					this.Vlt.Waiting = false;

					// log.i(this.Vlt.PlayCountByInput);
					this.Vlt.TotalRuns = this.Vlt.PlayCountByInput.reduce((sum, current) => { return sum += current; });
					// log.i(this.Vlt.PlayCountByInput.reduce((sum, current) => { return sum += current; }));

					if ((this.Vlt.TotalRuns >= 1000)) { //|| (Math.max(...this.Vlt.PlayCountByInput) >= 500)) {
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
							log.i(`Total return ${this.Vlt.PlayCountByInput.reduce((sum, current, index) => { return sum += current*this.Vlt.AverageReturn[index]; })}`);
							process.exit(1);
						});
					}
				});
			}
		}, this.Par.Stepms);

		fun(null, com);
	}

})();
