//# sourceURL=Hedgehog.js
(function Graph() {
	//a general purpose multi-dimensional searching algorithm that interrogates
	//the dispatching function
	// com.Data = {
	//  State : [] //the current action that was chosen
	// 	Min: [],
	// 	Max: [],
	// 	StepSize: [], //percent
	// 	Iterations: 5, //number
	// 	Delta: 0.03 //percent
	// };
	//
	// com.Host= pid; //id of a host of value function
	// com.EvalName= "Evaluate";
	// com.Mode= "Max"; //or "Min"

	//-----------------------------------------------------dispatch
	let dispatch = {
		Start: Start,
		Evaluate: Evaluate
	};

	return {
		dispatch: dispatch
	};

	function Start(com, fun){
		console.log("--Graph/Start");
		let Vlt = this.Vlt;

		Vlt.Function = (function (x,y){
			return (Math.sin(x)*Math.sin(y));
		});

		let q = {Cmd:"Instantiate"};

		q.Data = {
			State: [0.5,0.5], //the current action that was chosen
			Min: [0,0],
			Max: [2*Math.PI,2*Math.PI],
			StepSize: [0.75, 0.75], //percent
			Iterations: 1000, //number
			Delta: 0.001 //percent
		};

		q.Host= this.Par.Pid; //id of a host of value function
		q.EvalName= "Evaluate";
		q.Mode= "Max"; //or "Min"

		this.send(q, this.Par.Hedgehog, returnVal);

		function returnVal(err, cm){
			if (err)
				console.log("Err"+err);

			console.log("The found optimal state is ", cm.State);
		}

		fun(com);
	}

	function Evaluate(com, fun){
		//console.log("Evaluating the function at ", ...com.State);
		com.Value =  this.Vlt.Function(...com.State);
		//console.log("Value is ", com.Value);
		fun(null,com);
	}
})();
