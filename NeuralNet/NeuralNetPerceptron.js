//# sourceURL=NeuralNetPerception.js
(function NeuralNetPerception() {
	// Purpose: Provide an LSTM Neural net functionality
	//	- required Par:
	// 		OnStart boolean
	//		Size    Array [input, hidden, ..., output]


	//-----------------------------------------------------dispatch
	var dispatch = {

		Start: Start,
		Initialize: Initialize,
		Train: Train,
		Evaluate: Evaluate,
		Reset: Reset,

	};

	return {
		dispatch: dispatch
	};



	function Start(com, fun) {
		let Par = this.Par;

		//set some defaults
		Par.TrainingSetSize = Par.TrainingSetSize || 1000;
		Par.NetworkDimentions = Par.NetworkDimentions || [2, 2, 1];

		if (Par.InitializeOnStart) {
			var q = {};
			q.Cmd = "Initialize";
			q.NetworkDimentions = Par.NetworkDimentions;
			q.TrainingSetSize = Par.TrainingSetSize;
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
	 * @param {Integer}com.TrainingSetSize 	the number of I/O sets to train on
	 * @param {Object} com.NetworkDimentions
	 * @param {Function=} fun callback(err, com)
	 */
	function Initialize(com, fun = _ => log.e(_)) {
		log.v("--NeuralNetPerception/Initialize", com);
		let Par = this.Par;
		let Vlt = this.Vlt;

		Vlt.TrainingData = [];
		// The training set grows with each Train command,
		// and is truncated to match its specified size

		//set defaults
		Vlt.TrainingSetSize = com.TrainingSetSize || Par.TrainingSetSize;
		Vlt.NetworkDimentions = com.NetworkDimentions || Par.NetworkDimentions;


		// Initialize neural net
		this.Vlt.neataptic = require('neataptic');
		// Perceptron parameters, in order:
		// number of input nodes
		// number of neurons in hidden layer (can be multiple numbers if multiple layers)
		// number of neurons in output layer

		//build the network
		Vlt.Network = new Vlt.neataptic.Architect.Perceptron(...Vlt.NetworkDimentions);

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
		log.v("--NeuralNetPerception/Train", com);
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
		Vlt.Network.train(Vlt.TrainingData, {
			log: 100,  			//if we want to log training info
			iterations: 1000,	//a maximum nuber of iteration before stop training
			error: 0.03,		//stop training when this error is reached
			rate: 0.3  			//the learning reate
		});

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
