//# sourceURL=Perception.js
(
	/**
	 * The Perceptron entity is the Apex and only entity of the Perceptron Module.
	 * This entity requres its Setup function invoked during the Setup phase of Nexus startup.
	 * The main capability of this entity is to initialize and work with a neataptic.js perceptron network.
	 */
	function Perception() {

		var dispatch = {
			Setup,
			Initialize,
			Train,
			Evaluate,
			Reset
		};

		return {
			dispatch
		};

		/**
		 * Set some default attributes and initialize if Par.InitializeOnStart = true;
		 * @param {Object} com  the command object
		 * @param {Function} fun callback(err, com)
		 */
		function Setup(com, fun) {
			log.v("--Perceptron/Setup");
			let Par = this.Par;
			//set some defaults
			Par.TrainingSetSize = Par.TrainingSetSize || 1000;
			Par.NetworkDimensions = Par.NetworkDimensions || [2, 2, 1];

			if (Par.InitializeOnSetup) {
				log.v("Self Initializing");
				var q = {};
				q.Cmd = "Initialize";
				this.send(q, this.Par.Pid, (err, com) => {
					fun(err || null, com);
				});
			} else {
				fun(null, com);
			}
		}

		/**
		 * Initialize the neural network and define the required parameters.
		 * @param {Object} com command object
		 * @param {Integer=}com.TrainingSetSize 	the number of I/O sets to train on
		 * @param {Object=} com.NetworkDimensions the dimensions of the neural network
		 * @param {Function=} fun callback(err, com)
		 */
		function Initialize(com, fun = _ => log.e(_)) {
			log.v("--Perceptron/Initialize");
			let Par = this.Par;
			let Vlt = this.Vlt;

			Vlt.TrainingData = [];
			// The training set grows with each Train command,
			// and is truncated to match its specified size

			//set defaults
			Vlt.TrainingSetSize = com.TrainingSetSize || Par.TrainingSetSize;
			Vlt.NetworkDimensions = com.NetworkDimensions || Par.NetworkDimensions;


			// Initialize neural net
			this.Vlt.neataptic = this.require('neataptic');
			// Perceptron parameters, in order:
			// number of input nodes
			// number of neurons in hidden layer (can be multiple numbers if multiple layers)
			// number of neurons in output layer

			log.v(`Building a Perceptron with dimensions ${Vlt.NetworkDimensions}`);
			//build the network
			Vlt.Network = new Vlt.neataptic.architect.Perceptron(...Vlt.NetworkDimensions);

			fun(null, com);
		}

		/**
		 * Update the training set and retrain the Network.
		 * @param {Object} com 		command object
		 * @param {Object} com.Input the input to train the network on
		 * @param {Object} com.Output	the output to train the network on
		 * @param {Function=} fun  	callback(err, com)
		 */
		function Train(com, fun = _ => _) {
			log.v("--Perception/Train", com.Input, com.Output);
			let Vlt = this.Vlt;

			Vlt.TrainingData.push({
				input: com.Input,
				output: com.Output
			});

			//if our training set is getting too large remove the oldest
			if (Vlt.TrainingData.length > Vlt.TrainingSetSize) {
				Vlt.TrainingData.shift();
			}

			//train the network
			log.v(JSON.stringify(Vlt.Network.train(Vlt.TrainingData, {
				log: 100,  			//if we want to log training info
				iterations: 10000,	//a maximum number of iteration before stop training
				error: 0.003,		//stop training when this error is reached
				rate: 0.3  			//the learning rate
			}), null, 2));

			fun(null, com);
		}

		/**
		 * Evaluate the neural net on an input array and return the output
		 * @param {Object} com	Command Object
		 * @param {Object} com.Input An array of input arguments for the neural network
		 * @param {Function} fun 	Callback
		 */
		function Evaluate(com, fun) {
			com.Output = this.Vlt.Network.activate(com.Input);
			fun(null, com);
		}

		/**
		 * Reset the training data set if we want to start fresh.
		 * @param {Object} com  Command Object
		 * @param {Function=} fun  Callback
		 */
		function Reset(com, fun = _ => _) {
			this.Vlt.TraingingData = [];
			fun(null, com);
		}

	})();
